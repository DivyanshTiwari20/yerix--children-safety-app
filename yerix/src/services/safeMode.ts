import { Platform, Vibration } from "react-native";
import { AudioModule } from "expo-audio";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import notifee, { AndroidForegroundServiceType } from "@notifee/react-native";
import { loadModel, unload, start as voskStart, stop as voskStop, onPartialResult, onResult } from "react-native-vosk";
import { startShakeListener, stopShakeListener } from "@/services/shake";
import { startEmergencyFlow } from "@/services/emergency";
import { ARM_WINDOW_MS, COMMAND_PHRASES, VOSK_GRAMMAR, WAKE_PHRASES } from "@/constants";
import { startForegroundService, stopForegroundService } from "@/services/foregroundTask";
import { getDirectTriggerPreference } from "@/services/voicePreferences";
import { setLastHeard, setSafeModeEndStore, setVoiceArmedStore } from "@/state/store";

const SECURE_STORE_KEY = "yerix_safe_mode_end";
let stopTimer: ReturnType<typeof setTimeout> | null = null;
let armTimer: ReturnType<typeof setTimeout> | null = null;
let voskResultSub: { remove: () => void } | null = null;
let voskPartialSub: { remove: () => void } | null = null;
let voiceArmed = false;

function disarmVoice(): void {
  if (armTimer) {
    clearTimeout(armTimer);
    armTimer = null;
  }
  voiceArmed = false;
  setVoiceArmedStore(false, null);
}

function armVoice(): void {
  voiceArmed = true;
  const expiresAt = Date.now() + ARM_WINDOW_MS;
  setVoiceArmedStore(true, expiresAt);
  Vibration.vibrate(200);
  console.log("Voice wake phrase detected; armed for 8 seconds");
  armTimer = setTimeout(() => {
    armTimer = null;
    disarmVoice();
    console.log("Voice activation window expired");
  }, ARM_WINDOW_MS);
}

function handleVoiceResult(text: string, directTrigger: boolean): void {
  const lower = text.toLowerCase().trim();
  if (!lower || lower === "[unk]") return;
  setLastHeard(lower);

  const hasWakePhrase = WAKE_PHRASES.some((phrase) => lower.includes(phrase));
  const hasCommandPhrase = COMMAND_PHRASES.some((phrase) => lower.includes(phrase));

  if (hasWakePhrase && hasCommandPhrase) {
    disarmVoice();
    startEmergencyFlow("voice");
    return;
  }

  if (voiceArmed) {
    if (hasCommandPhrase) {
      disarmVoice();
      startEmergencyFlow("voice");
    }
    return;
  }

  if (hasWakePhrase) {
    armVoice();
    return;
  }

  if (directTrigger && hasCommandPhrase) {
    startEmergencyFlow("voice");
  }
}

export async function startSafeMode(durationMin: number): Promise<void> {
  disarmVoice();
  const microphone = await AudioModule.requestRecordingPermissionsAsync();
  if (!microphone.granted) {
    throw new Error("Microphone permission is required for Safe Mode");
  }

  const location = await Location.requestForegroundPermissionsAsync();
  if (location.granted) {
    await Location.requestBackgroundPermissionsAsync();
  }
  await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await notifee.requestPermission();
  }

  const directTrigger = await getDirectTriggerPreference();

  const serviceTypes = [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE];
  if (location.granted) {
    serviceTypes.push(AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION);
  }

  try {
    if (Platform.OS === "android") {
      await startForegroundService(durationMin, serviceTypes);
    }

    await loadModel("model-en-us");
    voskPartialSub = onPartialResult((text) => {
      handleVoiceResult(text, directTrigger);
    });
    voskResultSub = onResult((text) => {
      handleVoiceResult(text, directTrigger);
    });
    await voskStart({ grammar: [...VOSK_GRAMMAR] });

    startShakeListener(() => {
      startEmergencyFlow("shake");
    });

    const endTime = Date.now() + durationMin * 60 * 1000;
    await SecureStore.setItemAsync(SECURE_STORE_KEY, String(endTime));
    setSafeModeEndStore(endTime);

    stopTimer = setTimeout(() => {
      stopSafeMode();
    }, durationMin * 60 * 1000);
  } catch (error) {
    await stopSafeMode().catch(() => {});
    throw error;
  }
}

export async function stopSafeMode(): Promise<void> {
  disarmVoice();
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  voskStop();
  unload();
  voskResultSub?.remove();
  voskPartialSub?.remove();
  voskResultSub = null;
  voskPartialSub = null;
  stopShakeListener();
  if (Platform.OS === "android") {
    await stopForegroundService();
  }
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  setSafeModeEndStore(null);
}

export async function isSafeModeActive(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  if (!val) return false;
  return Date.now() < Number(val);
}

export async function getSafeModeEndTime(): Promise<number | null> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  return val ? Number(val) : null;
}
