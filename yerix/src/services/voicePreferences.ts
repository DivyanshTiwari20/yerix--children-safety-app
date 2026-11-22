import * as SecureStore from "expo-secure-store";

const DIRECT_TRIGGER_KEY = "yerix_direct_trigger";

export async function getDirectTriggerPreference(): Promise<boolean> {
  const saved = await SecureStore.getItemAsync(DIRECT_TRIGGER_KEY);
  if (saved === null) return true;
  if (saved === "true") return true;
  if (saved === "false") return false;
  throw new Error("Saved direct-trigger preference is invalid");
}

export async function setDirectTriggerPreference(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(DIRECT_TRIGGER_KEY, String(enabled));
}
