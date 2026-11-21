import { Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import notifee, {
  AndroidForegroundServiceType,
  type NotificationAndroid,
} from "@notifee/react-native";
import { loadModel, unload, start as voskStart, stop as voskStop, onPartialResult, onResult } from "react-native-vosk";
import { startShakeListener, stopShakeListener } from "@/services/shake";
import { startEmergencyFlow } from "@/services/emergency";
import { getSettings } from "@/services/api";
import { VOSK_GRAMMAR, DEV_USER_ID } from "@/constants";
import { startForegroundService, stopForegroundService } from "@/services/foregroundTask";
import { setLastHeard, setSafeModeEndStore } from "@/state/store";

const SECURE_STORE_KEY = "yerix_safe_mode_end";
let stopTimer: ReturnType<typeof setTimeout> | null = null;
let voskResultSub: { remove: () => void } | null = null;
let voskPartialSub: { remove: () => void } | null = null;

function handleVoiceResult(text: string, enabledPhrases: Record<string, boolean>): void {
  const lower = text.toLowerCase();
  if (!lower || lower === "[unk]") return;
  setLastHeard(lower);
  for (const [phrase, enabled] of Object.entries(enabledPhrases)) {
    if (enabled && lower.includes(phrase.toLowerCase())) {
      startEmergencyFlow("voice");
      return;
    }
  }
}

export async function startSafeMode(durationMin: number): Promise<void> {
  await Location.requestForegroundPermissionsAsync();
  await Location.requestBackgroundPermissionsAsync();
  await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await notifee.requestPermission();
  }

  let enabledPhrases: Record<string, boolean> = { yerix: true, "help me": true, "save me": true };
  try {
    const settings = await getSettings(DEV_USER_ID);
    enabledPhrases = settings.phrases ?? enabledPhrases;
  } catch (e) {
    console.error("failed to load settings for safe mode", e);
  }

  if (Platform.OS === "android") {
    await startForegroundService(durationMin);
  }

  await loadModel("model-en-us");
  await voskStart({ grammar: [...VOSK_GRAMMAR] });

  voskPartialSub = onPartialResult((text) => {
    handleVoiceResult(text, enabledPhrases);
  });
  voskResultSub = onResult((text) => {
    handleVoiceResult(text, enabledPhrases);
  });

  startShakeListener(() => {
    startEmergencyFlow("shake");
  });

  const endTime = Date.now() + durationMin * 60 * 1000;
  await SecureStore.setItemAsync(SECURE_STORE_KEY, String(endTime));
  setSafeModeEndStore(endTime);

  stopTimer = setTimeout(() => {
    stopSafeMode();
  }, durationMin * 60 * 1000);
}

export async function stopSafeMode(): Promise<void> {
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
