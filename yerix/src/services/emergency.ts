import { Alert } from "react-native";
import {
  startEmergencyApi,
  postLocation,
  cancelEmergencyApi,
  endEmergencyApi,
  getContacts,
  getSettings,
} from "@/services/api";
import { openWhatsApp } from "@/services/whatsapp";
import { getCurrentLocation, watchLocation, type Coordinates } from "@/services/location";
import {
  COUNTDOWN_SECONDS,
  LOCATION_INTERVAL_MS,
  TRIGGER_DEBOUNCE_MS,
  DEV_USER_ID,
} from "@/constants";
import {
  clearEmergencyNotification,
  displayEmergencyNotification,
} from "@/services/foregroundTask";

export type EmergencyStatus = "idle" | "countdown" | "active" | "ended";

type Listener = (
  status: EmergencyStatus,
  data: { emergencyId: string | null; trackUrl: string | null }
) => void;

let status: EmergencyStatus = "idle";
let lastTrigger = 0;
let listeners = new Set<Listener>();
let emergencyId: string | null = null;
let trackUrl: string | null = null;
let lastCoordinates: Coordinates | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let locationTimer: ReturnType<typeof setInterval> | null = null;
let locationSub: { remove: () => void } | null = null;
let countdownSeconds = COUNTDOWN_SECONDS;

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(status, { emergencyId, trackUrl });
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((l) => l(status, { emergencyId, trackUrl }));
}

export function getEmergencyStatus(): EmergencyStatus {
  return status;
}

export function getEmergencyCountdown(): number {
  return countdownSeconds;
}

export function startEmergencyFlow(trigger: string): void {
  const now = Date.now();
  if (status === "active" && trigger === "voice") {
    if (!trackUrl || now - lastTrigger < TRIGGER_DEBOUNCE_MS) return;
    lastTrigger = now;
    sendWhatsAppAlert(trackUrl).catch(reportWhatsAppError);
    return;
  }
  if (status !== "idle") return;
  if (now - lastTrigger < TRIGGER_DEBOUNCE_MS) return;
  lastTrigger = now;

  status = "countdown";
  countdownSeconds = COUNTDOWN_SECONDS;
  emit();
  displayEmergencyNotification("countdown").catch((error) => {
    console.error("Failed to display emergency countdown notification", error);
  });

  countdownTimer = setInterval(() => {
    countdownSeconds -= 1;
    emit();
    if (countdownSeconds <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      goActive(trigger);
    }
  }, 1000);
}

async function goActive(trigger: string): Promise<void> {
  status = "active";
  emit();

  try {
    await displayEmergencyNotification("active");
  } catch (error) {
    console.error("Failed to display local emergency notification", error);
  }

  let coordinates: Coordinates | null = null;
  try {
    coordinates = await getCurrentLocation();
  } catch (error) {
    console.error("Failed to get emergency location", error);
    Alert.alert("Unable to get location");
  }
  lastCoordinates = coordinates;

  try {
    const { id, trackUrl: url } = await startEmergencyApi(
      DEV_USER_ID,
      trigger,
      coordinates?.lat ?? null,
      coordinates?.lng ?? null
    );
    emergencyId = id;
    trackUrl = url;
    emit();

    if (coordinates) {
      try {
        locationSub = await watchLocation((la, lo) => {
          lastCoordinates = { lat: la, lng: lo };
          if (emergencyId) {
            postLocation(emergencyId, la, lo).catch(() => {});
          }
        });
      } catch (error) {
        console.error("Failed to start emergency location updates", error);
        Alert.alert("Unable to share location");
      }
    }

    locationTimer = setInterval(() => {}, LOCATION_INTERVAL_MS);

    try {
      await sendWhatsAppAlert(url);
    } catch (error) {
      reportWhatsAppError(error);
    }
  } catch (e) {
    console.error("emergency active error", e);
    Alert.alert("Unable to start emergency");
  }
}

async function sendWhatsAppAlert(url: string): Promise<void> {
  const contacts = await getContacts(DEV_USER_ID);
  if (contacts.length === 0) {
    Alert.alert("No emergency contacts", "Add a contact to send a WhatsApp alert.");
    return;
  }

  await openWhatsAppAlertForContact(contacts[0].phone, url);
}

export async function openWhatsAppAlertForContact(phone: string, url: string): Promise<void> {
  let alertMessage = "I need help. Here is my live location:";
  try {
    const settings = await getSettings(DEV_USER_ID);
    alertMessage = settings.alert_message.trim() || alertMessage;
  } catch (error) {
    console.error("Failed to load WhatsApp alert message", error);
  }

  const mapUrl = lastCoordinates
    ? `https://maps.google.com/?q=${lastCoordinates.lat},${lastCoordinates.lng}`
    : null;
  const message = [
    alertMessage,
    mapUrl ? `Current location in Google Maps: ${mapUrl}` : null,
    `Live tracking: ${url}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n\n");
  await openWhatsApp(phone, message);
}

function reportWhatsAppError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Failed to open WhatsApp alert", error);
  Alert.alert("Unable to open WhatsApp", message);
}

export function cancelEmergency(): void {
  if (status !== "countdown") return;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (emergencyId) {
    cancelEmergencyApi(emergencyId, DEV_USER_ID).catch(() => {});
    emergencyId = null;
  }
  lastCoordinates = null;
  trackUrl = null;
  countdownSeconds = COUNTDOWN_SECONDS;
  status = "idle";
  clearEmergencyNotification();
  emit();
}

export function endEmergency(): void {
  if (status !== "active") return;
  if (locationTimer) {
    clearInterval(locationTimer);
    locationTimer = null;
  }
  if (locationSub) {
    locationSub.remove();
    locationSub = null;
  }
  if (emergencyId) {
    endEmergencyApi(emergencyId, DEV_USER_ID).catch(() => {});
    emergencyId = null;
  }
  lastCoordinates = null;
  trackUrl = null;
  countdownSeconds = COUNTDOWN_SECONDS;
  status = "ended";
  clearEmergencyNotification();
  emit();
}

export function resetEmergency(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (locationTimer) {
    clearInterval(locationTimer);
    locationTimer = null;
  }
  if (locationSub) {
    locationSub.remove();
    locationSub = null;
  }
  lastCoordinates = null;
  emergencyId = null;
  trackUrl = null;
  countdownSeconds = COUNTDOWN_SECONDS;
  status = "idle";
  clearEmergencyNotification();
  emit();
}
