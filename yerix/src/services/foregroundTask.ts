import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
  type NotificationAndroid,
} from "@notifee/react-native";

const CHANNEL_ID = "safe-mode";
const NOTIFICATION_ID = "safe-mode";
const EMERGENCY_CHANNEL_ID = "emergency-alerts";
const EMERGENCY_NOTIFICATION_ID = "emergency-alert";

export function registerForegroundTask(): void {
  notifee.registerForegroundService(() => new Promise(() => {}));
}

export async function createSafeModeChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "Safe Mode",
    importance: AndroidImportance.LOW,
  });
}

export async function displayEmergencyNotification(): Promise<void> {
  await notifee.createChannel({
    id: EMERGENCY_CHANNEL_ID,
    name: "Emergency alerts",
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    id: EMERGENCY_NOTIFICATION_ID,
    title: "YERIX emergency",
    body: "An emergency was triggered on this device.",
    android: {
      channelId: EMERGENCY_CHANNEL_ID,
      pressAction: { id: "default" },
    },
  });
}

export async function startForegroundService(
  durationMin: number,
  types: AndroidForegroundServiceType[]
): Promise<void> {
  await createSafeModeChannel();
  const endTime = new Date(Date.now() + durationMin * 60 * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: "YERIX Safe Mode",
    body: `Safe Mode active until ${endTime}`,
    android: {
      channelId: CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      foregroundServiceTypes: types,
    } as NotificationAndroid,
  });
}

export async function stopForegroundService(): Promise<void> {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(NOTIFICATION_ID).catch(() => {});
}

registerForegroundTask();
createSafeModeChannel().catch(() => {});
