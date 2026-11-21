- App folder: ./yerix  | Backend folder: ./yerix-server (replaces /server everywhere)
- The developer builds the Android APK via EAS cloud builds. The agent NEVER runs build commands, installs packages, or runs `expo prebuild --clean`. If a package is needed, tell me the command.
- Listening runs only during a user-started "Safe Mode" session (timer, default 2h, persistent notification). Also provide SOS button and shake trigger. No 24/7 listening.
- Wake word + distress phrases: `react-native-vosk` (restricted grammar yerix / help me / save me). No Picovoice.
- Android background: `@notifee/react-native` foreground service.
- Platform: Android first. iOS later.
- Vosk model is at yerix/android/app/src/main/assets/model-en-us. Don't touch it.
- No login yet: use a DEV_USER_ID constant.

## PROGRESS LOG
- Phase 1 (Constants): COMPLETED
- Phase 2 (Database schema.sql): COMPLETED
- Phase 3 (API contract): COMPLETED
- Phase 4 (App file structure): COMPLETED
- Phase 5 (Core logic / emergency.ts): COMPLETED
- Phase 6 (Safe Mode / safeMode.ts): COMPLETED
- Phase 7 (Foreground service / foregroundTask.ts + plugin): COMPLETED
- Phase 8 (WhatsApp / whatsapp.ts): COMPLETED
- Phase 9 (Shake / shake.ts): COMPLETED
- .env.example (yerix): COMPLETED
- .env.example (yerix-server): COMPLETED
- Deferred TODOs (push to contacts, Google sign-in, iOS, Siri, widgets): NOT STARTED

Override steps completed:
- Prebuild android --clean: COMPLETED
- AndroidManifest verified (permissions, notifee ForegroundService microphone|location, usesCleartextTraffic=true): COMPLETED
- Vosk model re-added to android/app/src/main/assets/model-en-us (am/, conf/, graph/): COMPLETED
- .gitignore /android entry removed: COMPLETED

Verified APIs: react-native-vosk (loadModel, unload, start({grammar}), stop, onResult/onPartialResult/onFinalResult/onError/onTimeout returning EventSubscription); @notifee/react-native (registerForegroundService, stopForegroundService, createChannel, displayNotification, AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE=128, FOREGROUND_SERVICE_TYPE_LOCATION=8, AndroidImportance.LOW=2); expo-sensors Accelerometer (addListener, setUpdateInterval); expo-secure-store (setItemAsync, getItemAsync, deleteItemAsync)