const { withPermissions } = require("@expo/config-plugins/build/android/Permissions");
const { withAndroidManifest } = require("@expo/config-plugins/build/plugins/android-plugins");

const PERMISSIONS = [
  "FOREGROUND_SERVICE",
  "FOREGROUND_SERVICE_MICROPHONE",
  "FOREGROUND_SERVICE_LOCATION",
  "RECORD_AUDIO",
  "ACCESS_FINE_LOCATION",
  "ACCESS_BACKGROUND_LOCATION",
  "POST_NOTIFICATIONS",
  "READ_CONTACTS",
  "CALL_PHONE",
  "WAKE_LOCK",
  "VIBRATE",
];

const withSafeMode = (config) => {
  config = withPermissions(config, PERMISSIONS);

  config = withAndroidManifest(config, async (config) => {
    const mainApplication =
      config.modResults.manifest.application?.find(
        (app) => app.$?.["android:name"]?.endsWith(".MainApplication")
      ) ?? config.modResults.manifest.application?.[0];

    if (!mainApplication) return config;

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const hasNotifeeService = mainApplication.service.some(
      (svc) => svc.$?.["android:name"]?.includes("notifee.service.ForegroundService")
    );

    if (!hasNotifeeService) {
      mainApplication.service.push({
        $: {
          "android:name": "com.invertase.notifee.service.ForegroundService",
          "android:foregroundServiceType": "microphone|location",
          "android:exported": "false",
        },
      });
    }

    return config;
  });

  return config;
};

module.exports = withSafeMode;
