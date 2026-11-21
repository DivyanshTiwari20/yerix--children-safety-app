# SPEC.md — Technical decisions (follow exactly; do not redesign)

## 0. Verify-first rule
Never guess a library API. Before using `react-native-vosk` or `@notifee/react-native`, read their README and TypeScript types inside node_modules and use only what they actually export. Log the verified API in AGENTS.md progress log.

## 1. Constants (src/constants.ts, single source)
DEV_USER_ID = "dev-user-1"; MAX_CONTACTS = 5; COUNTDOWN_SECONDS = 5; LOCATION_INTERVAL_MS = 5000; SOS_HOLD_MS = 2000; SAFE_MODE_DEFAULT_MIN = 120; SAFE_MODE_OPTIONS_MIN = [30, 60, 120, 240]; TRIGGER_DEBOUNCE_MS = 10000; SHAKE_THRESHOLD_G = 2.5; SHAKE_PEAKS = 3; SHAKE_WINDOW_MS = 1500; VOSK_GRAMMAR = ["yerix","help me","save me","[unk]"]; EMERGENCY_NUMBER = "112".

## 2. Database (yerix-server/schema.sql)
contacts(id uuid pk default gen_random_uuid(), user_id text, name text, phone text (E.164), created_at timestamptz default now())
settings(user_id text pk, alert_message text default 'I need help. Here is my live location:', sensitivity int default 5, phrases jsonb default '{"yerix":true,"help me":true,"save me":true}')
emergencies(id uuid pk default gen_random_uuid(), user_id text, trigger text, status text default 'active', created_at timestamptz default now(), ended_at timestamptz)
location_points(id bigserial pk, emergency_id uuid references emergencies(id), lat double precision, lng double precision, created_at timestamptz default now())
Disable RLS for now (server uses service key only). Add a comment that RLS is needed before production.

## 3. API contract (all JSON, prefix /api, header x-user-id optional; middleware sets req.userId = header || DEV_USER_ID)
GET /api/contacts -> Contact[] | POST /api/contacts {name,phone} (400 if >5 or phone not E.164) | DELETE /api/contacts/:id
GET /api/settings -> Settings | PUT /api/settings {alert_message?,sensitivity?,phrases?}
POST /api/emergencies {trigger:"voice"|"sos"|"shake"|"test", lat, lng} -> {id, trackUrl}; side effects: insert row, insert first point, send SMS to every contact, place Twilio call to every contact (skip both if trigger=="test": log only)
POST /api/emergencies/:id/location {lat,lng} -> {ok:true}
POST /api/emergencies/:id/cancel -> {ok:true} (status='cancelled', ended_at=now())
POST /api/emergencies/:id/end -> {ok:true} (status='ended')
GET /api/track/:id -> {status, lat, lng, updatedAt, path:[{lat,lng}] (last 100)}
GET /track/:id -> HTML page: Leaflet 1.9 + OpenStreetMap tiles from CDN, marker + polyline, polls /api/track/:id every 5s, shows "Emergency ended" when status != active. Mobile-friendly, no login.
GET /health -> {ok:true}
Errors: {error:string} with proper status. CORS enabled. Listen on 0.0.0.0:PORT.
SMS text: `${alert_message} ${PUBLIC_BASE_URL}/track/${id}`. Call TwiML: `<Response><Say voice="alice">Emergency alert. ${name} needs help. A tracking link was sent by text message.</Say></Response>` via Twilio `calls.create({twiml, to, from})`.
DRY-RUN: if any TWILIO_* var is missing, do not call Twilio; console.log what would be sent and return normally.

## 4. App file structure
yerix/index.js (custom entry: `import './src/services/foregroundTask'; import 'expo-router/entry';` and set "main":"index.js" in package.json)
yerix/app/_layout.tsx, app/index.tsx (Home), app/contacts.tsx, app/settings.tsx, app/emergency.tsx, app/permissions.tsx
yerix/src/constants.ts, src/theme/{colors,spacing}.ts (light+dark tokens), src/components/{Button,Card,SOSButton,Countdown,ContactRow,StatusPill}.tsx
yerix/src/services/{api,location,voice,safeMode,shake,whatsapp,foregroundTask,emergency}.ts
yerix/src/state/store.ts (zustand NOT installed: use React Context + useReducer unless I install zustand)

## 5. Core logic (state machine, src/services/emergency.ts)
States: idle -> countdown (5s) -> active -> ended; cancel allowed only in countdown (and /cancel on server). Any trigger (voice/sos/shake) calls startEmergencyFlow(trigger). Ignore triggers within TRIGGER_DEBOUNCE_MS or when state != idle.
On entering active: get position (expo-location, High accuracy), POST /api/emergencies, start location interval posting every LOCATION_INTERVAL_MS, open WhatsApp deep link for first contact (see 8), show an "I'm safe" button that calls /end and clears the interval.

## 6. Safe Mode (src/services/safeMode.ts)
start(durationMin): ask permissions (mic, location fg+bg, notifications), start foreground service (notifee) with persistent notification "YERIX Safe Mode active until HH:MM", load Vosk model "model-en-us", start recognition with grammar VOSK_GRAMMAR, start shake listener, set timeout to stop at end. stop(): stop Vosk, stop service, remove listeners, clear timers. Persist end time in expo-secure-store so UI recovers after app restart.
Voice trigger rule: on Vosk result/partial, lowercase; if it contains an enabled phrase from settings.phrases -> startEmergencyFlow("voice"). Ignore "[unk]" and empty. Show last heard text in a debug line on Home (needed for tuning).

## 7. Foreground service (src/services/foregroundTask.ts, imported in index.js at top level)
Call notifee.registerForegroundService(() => new Promise(() => {})) at module load. Create a channel "safe-mode" (low importance). Start with notifee.displayNotification({android:{channelId, asForegroundService:true, ongoing:true, foregroundServiceTypes: microphone + location (use enum names from notifee types)}}). Write a local Expo config plugin plugins/withSafeMode.js that adds to AndroidManifest: permissions FOREGROUND_SERVICE, FOREGROUND_SERVICE_MICROPHONE, FOREGROUND_SERVICE_LOCATION, RECORD_AUDIO, ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION, POST_NOTIFICATIONS, READ_CONTACTS, CALL_PHONE, WAKE_LOCK, VIBRATE and the notifee ForegroundService <service> entry with android:foregroundServiceType="microphone|location". Register it in app.json plugins. Tell me to rebuild the APK after this changes.

## 8. WhatsApp (src/services/whatsapp.ts)
Linking.openURL(`https://wa.me/${phoneDigitsOnly}?text=${encodeURIComponent(message + ' ' + trackUrl)}`). Also provide a "Send WhatsApp" button next to each contact on the Emergency screen. No Business API.

## 9. Shake (src/services/shake.ts)
expo-sensors Accelerometer, updateInterval 100ms; magnitude = sqrt(x²+y²+z²); count peaks > SHAKE_THRESHOLD_G within SHAKE_WINDOW_MS; if >= SHAKE_PEAKS trigger "shake". Only active during Safe Mode or while app is open.

## 10. UI details
Home: large status card (Safe Mode OFF / ON until time + remaining), duration chips, big Start/Stop button, red SOS button (hold 2s with progress ring), "Test emergency" button (trigger "test"), "Last heard" debug text, links to Contacts and Settings. Emergency screen: full-screen red, huge countdown number, big Cancel; after active: shows tracking link, "Send WhatsApp" per contact, "Call 112" (Linking tel:112), "I'm safe". Contacts: list + add (name, phone with country code, validate E.164) + delete, max 5. Settings: alert message text box, sensitivity slider 1-10 (stored only for now), phrase toggles. Font: system. Radius 16. Spacing scale 4/8/12/16/24. Support dark mode via useColorScheme.

## 11. Deferred (do not build)
Push notifications to contacts (needs accounts), Google sign-in, iOS, Siri Shortcut, widgets, audio files. Note them as TODO in the progress log.

## 12. Testing the agent CAN do
Run `npx tsc --noEmit` in both folders and fix type errors. Run the server with `npx tsx src/index.ts` and test routes with curl-style scripts in dry-run mode. Never run builds.