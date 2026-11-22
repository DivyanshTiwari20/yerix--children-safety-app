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
  "USE_FULL_SCREEN_INTENT",
  "READ_CONTACTS",
  "CALL_PHONE",
  "WAKE_LOCK",
  "VIBRATE",
];

const withSafeMode = (config) => {
  config = withPermissions(config, PERMISSIONS);

  config = withAndroidManifest(config, async (config) => {
    config.modResults.manifest.$ = config.modResults.manifest.$ ?? {};
    config.modResults.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const mainApplication =
      config.modResults.manifest.application?.find(
        (app) => app.$?.["android:name"]?.endsWith(".MainApplication")
      ) ?? config.modResults.manifest.application?.[0];

    if (!mainApplication) return config;

    const mainActivity = mainApplication.activity?.find((activity) =>
      activity.$?.["android:name"]?.endsWith(".MainActivity")
    );
    if (mainActivity) {
      mainActivity.$ = mainActivity.$ ?? {};
      mainActivity.$["android:showWhenLocked"] = "true";
      mainActivity.$["android:turnScreenOn"] = "true";
    }

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const notifeeService = mainApplication.service.find((svc) =>
      [
        "app.notifee.core.ForegroundService",
        "com.invertase.notifee.service.ForegroundService",
      ].includes(svc.$?.["android:name"])
    );

    const service = notifeeService ?? { $: {} };
    service.$["android:name"] = "app.notifee.core.ForegroundService";
    service.$["android:foregroundServiceType"] = "microphone|location";
    service.$["android:exported"] = "false";
    service.$["tools:replace"] = "android:foregroundServiceType";

    if (!notifeeService) {
      mainApplication.service.push(service);
    }

    return config;
  });

  return config;
};

module.exports = withSafeMode;
