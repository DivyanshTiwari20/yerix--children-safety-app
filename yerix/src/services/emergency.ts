import {
  startEmergencyApi,
  postLocation,
  cancelEmergencyApi,
  endEmergencyApi,
  getContacts,
} from "@/services/api";
import { openWhatsApp } from "@/services/whatsapp";
import { getCurrentLocation, watchLocation } from "@/services/location";
import {
  COUNTDOWN_SECONDS,
  LOCATION_INTERVAL_MS,
  TRIGGER_DEBOUNCE_MS,
  DEV_USER_ID,
} from "@/constants";

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
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let locationTimer: ReturnType<typeof setInterval> | null = null;
let locationSub: { remove: () => void } | null = null;
let countdownSeconds = COUNTDOWN_SECONDS;

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
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
  if (status !== "idle") return;
  if (now - lastTrigger < TRIGGER_DEBOUNCE_MS) return;
  lastTrigger = now;

  status = "countdown";
  countdownSeconds = COUNTDOWN_SECONDS;
  emit();

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
    const { lat, lng } = await getCurrentLocation();
    const { id, trackUrl: url } = await startEmergencyApi(DEV_USER_ID, trigger, lat, lng);
    emergencyId = id;
    trackUrl = url;
    emit();

    const watch = await watchLocation((la, lo) => {
      if (emergencyId) {
        postLocation(emergencyId, la, lo).catch(() => {});
      }
    });
    locationSub = watch;

    locationTimer = setInterval(() => {}, LOCATION_INTERVAL_MS);

    const contacts = await getContacts(DEV_USER_ID);
    if (contacts?.length > 0 && trackUrl) {
      openWhatsApp(contacts[0].phone, trackUrl).catch(() => {});
    }
  } catch (e) {
    console.error("emergency active error", e);
  }
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
  trackUrl = null;
  countdownSeconds = COUNTDOWN_SECONDS;
  status = "idle";
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
  trackUrl = null;
  countdownSeconds = COUNTDOWN_SECONDS;
  status = "ended";
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
  emergencyId = null;
  trackUrl = null;
  countdownSeconds = COUNTDOWN_SECONDS;
  status = "idle";
  emit();
}
