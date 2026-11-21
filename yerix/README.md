# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Android testing and APK notes

The current `development` profile in `eas.json` creates an internal **development-client APK**, not a standalone APK. A development client needs Metro running to load the JavaScript bundle. After installing it, start Metro from `yerix` with `npx expo start --dev-client` and keep the phone and PC on the same Wi-Fi.

To build that development APK, run these from `yerix`:

```powershell
eas login
eas build --profile development --platform android
```

For local phone testing, the configured API URL is `http://192.168.1.34:3000`. The server listens on port 3000; start it from `yerix-server` with `npx tsx src/index.ts`. If the PC's LAN IP changes, update `yerix/.env`, `yerix/eas.json`, and `yerix-server/.env` together. The PC and phone must be able to reach each other over the LAN.

A standalone APK that does not require Metro needs a separate non-development EAS profile with Android APK output; the current `preview` and `production` profiles are empty. The server environment still contains placeholder Supabase/Twilio values, and `yerix-server/.env` uses `TWILIO_PHONE_NUMBER` while the server code reads `TWILIO_FROM_NUMBER`. Set real local service configuration and align that key before relying on live backend or SMS behavior. Do not use the app as an emergency service until those paths have been configured and tested.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
