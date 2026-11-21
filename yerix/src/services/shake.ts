import { Accelerometer } from "expo-sensors";
import { SHAKE_THRESHOLD_G, SHAKE_PEAKS, SHAKE_WINDOW_MS } from "@/constants";

let subscription: { remove: () => void } | null = null;
let peakTimes: number[] = [];

export function startShakeListener(onShake: () => void): void {
  if (subscription) return;
  Accelerometer.setUpdateInterval(100);
  subscription = Accelerometer.addListener((data) => {
    const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    const now = Date.now();
    peakTimes = peakTimes.filter((t) => now - t < SHAKE_WINDOW_MS);
    if (magnitude > SHAKE_THRESHOLD_G) {
      peakTimes.push(now);
      if (peakTimes.length >= SHAKE_PEAKS) {
        peakTimes = [];
        onShake();
      }
    }
  });
}

export function stopShakeListener(): void {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  peakTimes = [];
}
