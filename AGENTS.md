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
- 2026-11-22: Diagnosed empty contacts failing because server `.env` used the Supabase sample URL; corrected it to the project URL provided by the user. Added a fallback for the existing `TWILIO_PHONE_NUMBER` setting. Configured `Vosk_models` for the existing Android model directory so Gradle generates its UUID; model files were not changed. A new APK is required for the native model packaging fix.
- 2026-11-22: Added the user's Supabase keys to the ignored local server `.env` without exposing them in output. Initially, the secret key authenticated but Supabase REST returned HTTP 403 because `service_role` lacked table privileges; the updated SQL was pending application and the local backend was stopped at that point.
- 2026-11-22: After the schema grants were applied and the backend was started, verified health and contacts GET through the app's configured LAN URL. A temporary contact POST/DELETE succeeded, and the final contact count was 0. Moved Vosk result listeners before recognizer startup to avoid missing early results. Both app and backend `npx tsc --noEmit` passed. Confirmed the Vosk Gradle `genUUID` task reads `Vosk_models` and packages the generated UUID with the model; the existing APK predates this native fix and the corrected Notifee manifest, so one new development APK is required. No build or install was run.
- 2026-11-22: Fixed repeat voice alerts: voice commands during an active emergency now reopen WhatsApp with the current live-tracking URL (still protected by the 10-second trigger debounce). Home now navigates to the Emergency screen for triggered flows; new subscribers receive current state, and leaving an active Emergency screen ends and resets it so later triggers can start. Twilio 401 `invalid username` is an unrelated credential failure and does not invalidate WhatsApp deep links. App `npx tsc --noEmit` passed; no APK build was run.
- 2026-11-22: WhatsApp emergency messages now include a tappable Google Maps pin for the latest known coordinates plus the live tracking link, both for automatic alerts and per-contact Emergency screen actions. Clarified the call button label; the number remains 112, India's national emergency number. App `npx tsc --noEmit` passed; no APK build was run.
- 2026-11-22: Initial lock-screen notification implementation used a high-importance public channel and opened the Emergency route when tapped; cancel/end cleared it. A full-screen intent had not yet been added. App `npx tsc --noEmit` passed; no APK build was run.
- 2026-11-22: Per user request, enabled Notifee's full-screen action on the emergency countdown notification, added `USE_FULL_SCREEN_INTENT`, and configured MainActivity with `showWhenLocked`/`turnScreenOn` in the manifest and config plugin. Android may still require granting full-screen notification access; while unlocked it can show heads-up instead of forcibly covering another app. App typecheck, plugin syntax, and manifest XML validation passed. No APK build was run.