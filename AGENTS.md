- App folder: ./yerix  | Backend folder: ./yerix-server (replaces /server everywhere)
- The developer builds the Android APK via EAS cloud builds. The agent NEVER runs build commands, installs packages, or runs `expo prebuild --clean`. If a package is needed, tell me the command.
- Listening runs only during a user-started "Safe Mode" session (timer, default 2h, persistent notification). Also provide SOS button and shake trigger. No 24/7 listening.
- Wake + command voice activation uses `react-native-vosk` with the phrase lists in `yerix/src/constants.ts`; listening is limited to a user-started Safe Mode session. No Picovoice.
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

Verified APIs: react-native-vosk (loadModel, unload, start({grammar}), stop, onResult/onPartialResult/onFinalResult/onError/onTimeout returning EventSubscription); @notifee/react-native (registerForegroundService, stopForegroundService, createChannel, displayNotification, AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE=128, FOREGROUND_SERVICE_TYPE_LOCATION=8, AndroidImportance.LOW=2); expo-sensors Accelerometer (addListener, setUpdateInterval); expo-secure-store (setItemAsync, getItemAsync, deleteItemAsync); React Native 0.88 Vibration.vibrate(number).

## PROGRESS LOG
- 2026-11-21: Confirmed current workspace is `D:\agency work\children-safety-app`; investigating runtime error `useAppState must be used within AppProvider` at `yerix/app/index.tsx` via `yerix/src/state/store.ts`.
- 2026-11-21: Screenshot shows the frontend Metro crash; backend had previously started on port 3000 but was stopped with Ctrl+C. Treat backend as currently stopped, not as the cause of this provider crash.
- 2026-11-21: No code changed yet. Next: inspect app provider/layout and apply only a provider wiring fix; update README. No install, test, build, EAS, or GitHub command.
- 2026-11-21: Diagnosed the Safe Mode crash: `app.notifee:core` AAR declares `app.notifee.core.ForegroundService` with `shortService` (0x800), while the app requested `microphone|location` (0x88). HEAD's manifest declared the wrong class name (`com.invertase.notifee.service.ForegroundService`), so `tools:replace` never applied. Fixed the manifest service name + `tools:replace`, and made `withSafeMode.js` authoritative. Also gated FGS types on granted mic/location permissions, made Safe Mode start/stop awaited, and made `API_URL` read `EXPO_PUBLIC_API_URL`. `npx tsc --noEmit` passes. The installed dev APK is stale; a new EAS development APK is required. Contacts require Supabase (`schema.sql`) and real `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`; no local Postgres is used.
- 2026-11-22: Added two-step Vosk activation during Safe Mode: wake phrases arm an 8-second window; command phrases trigger within that window, with direct trigger enabled by default and stored locally in SecureStore. Added combined wake+command grammar entries, 200 ms vibration, the Home listening countdown pill, timestamped last-five heard history, and read-only phrase chips in Settings. Verified `react-native-vosk` README and installed declarations (`start({grammar: string[]})`, string result/partial callbacks, removable subscriptions), React Native 0.88 `Vibration.vibrate(number)`, and SDK 58 SecureStore get/set APIs. `npx tsc --noEmit` passed; no build was run.