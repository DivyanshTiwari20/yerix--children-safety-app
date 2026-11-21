import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="contacts" options={{ title: "Contacts" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="emergency" options={{ headerShown: false }} />
      <Stack.Screen name="permissions" options={{ title: "Permissions" }} />
    </Stack>
  );
}
