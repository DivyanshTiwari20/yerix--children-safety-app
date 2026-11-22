This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## PROGRESS LOG

### 2026-11-21
- Step 1: `ipconfig` identified active Wi-Fi IPv4 LAN_IP as `192.168.1.34`.
- Step 2: Confirmed `.env` sets `EXPO_PUBLIC_API_URL=http://192.168.1.34:3000`.
- Step 4: Created valid `eas.json` with the requested development profile and empty preview/production profiles.
- Step 3: Confirmed server `.env` has `PORT=3000` and `PUBLIC_BASE_URL=http://192.168.1.34:3000`; other values were left unchanged.
- Step 5: Added `.env` to `.gitignore`; `node_modules/` is ignored and `/android` is not ignored.
- Step 6: Initialized local Git and committed `dev build`; global Git identity was already configured.
- Step 7: `npx tsc --noEmit` passed in `yerix-server`; it failed in `yerix` with existing TypeScript errors (missing `expo-av`/CSS declarations, React Native exports/types, and implicit-any errors). No install/build command was run.

### 2026-11-21 follow-up
- Replaced only the missing microphone permission import with the already-configured `expo-audio` permission API; corrected React/React Native imports and the RN absolute-fill style type; preserved the tab ref and added CSS module typings.
- No dependencies, UI flows, or app configuration were changed. `npx tsc --noEmit` now passes in both `yerix` and `yerix-server`.
- README now distinguishes the Metro-dependent development-client APK from a standalone APK and records LAN/backend setup blockers. No EAS, install, audit, or build command was run.
- Updated the Home layout with 16-point ScrollView spacing, wrapped duration chips, aligned action rows, a fixed 140x140 SOS control with an internal progress overlay, and a one-line Last heard card. Applied theme-aware foreground and status colors for light and dark modes.
- Location permission/position failures now show Alerts and allow emergency creation with null coordinates; the emergency API payload type accepts null latitude/longitude.
- `npx tsc --noEmit` was run in `yerix` and still reports an unrelated route typing error at `src/components/app-tabs.web.tsx:28` for the nonexistent `/explore` route. No build or install was run.
- 2026-11-21: Added the root SafeAreaProvider + AppProvider tab-stack shell and the Home/Contacts/Settings bottom tab layout; refreshed shared healthcare colors, cards, buttons, and contact-row styling. `@expo/vector-icons` was not present in the app manifest or local modules, so the existing cross-platform `expo-symbols` package is used without adding a dependency.
- 2026-11-21: Home screen redesigned with the blue Safe Mode hero, duration pills, SOS card, test action, and one-line Last heard card.
- 2026-11-21: Contacts moved into the tabs group and redesigned with a themed contacts card, initials badges, delete icons, contact count, empty state, and a collapsible add form.
- 2026-11-21: Settings moved into the tabs group and redesigned with grouped cards, a blue sensitivity slider, phrase switches, and About/version details; existing settings load/save/toggle behavior retained.
- 2026-11-21: Emergency screen redesigned with the full red countdown view, white cancel action, active tracking/contact card, per-contact WhatsApp actions, emergency call, and safe action; existing service/state flow retained.
- 2026-11-21: Permissions screen redesigned as individual themed permission cards with pastel symbol badges, reasons, status, Allow controls, and a working Back to Home route.
- 2026-11-21: Updated the legacy web tab component to target the grouped Home, Contacts, and Settings routes used by the new navigation.
- 2026-11-21: Contacts accepts a 10-digit Indian mobile number and prefixes +91 before submitting to the existing E.164 API.
