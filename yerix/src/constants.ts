export const MAX_CONTACTS = 5;
export const COUNTDOWN_SECONDS = 5;
export const LOCATION_INTERVAL_MS = 5000;
export const SOS_HOLD_MS = 2000;
export const SAFE_MODE_DEFAULT_MIN = 120;
export const SAFE_MODE_OPTIONS_MIN = [30, 60, 120, 240] as const;
export const TRIGGER_DEBOUNCE_MS = 10000;
export const SHAKE_THRESHOLD_G = 2.5;
export const SHAKE_PEAKS = 3;
export const SHAKE_WINDOW_MS = 1500;
export const WAKE_PHRASES = [
  "hey yerix",
  "hi yerix",
  "yerix",
  "hey rix",
  "hi rix",
  "yeah ricks",
  "your ex",
  "yerics",
  "eric's",
] as const;
export const COMMAND_PHRASES = ["help me", "save me", "send alert", "send the alert"] as const;
export const ARM_WINDOW_MS = 8000;
const COMBINED_VOICE_PHRASES = WAKE_PHRASES.flatMap((wakePhrase) =>
  COMMAND_PHRASES.map((commandPhrase) => `${wakePhrase} ${commandPhrase}`)
);
export const VOSK_GRAMMAR = [
  ...WAKE_PHRASES,
  ...COMMAND_PHRASES,
  ...COMBINED_VOICE_PHRASES,
  "[unk]",
];
export const EMERGENCY_NUMBER = "112";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.34:3000";
