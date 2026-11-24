import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/state/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "@/state/auth";
import { Redirect, Stack, usePathname, type Href } from "expo-router";

function AppNavigator() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2B84E8" />
      </View>
    );
  }
  if (!user && pathname !== "/") return <Redirect href={"/" as Href} />;
  if (user && !profile && pathname !== "/onboarding") return <Redirect href={"/onboarding" as Href} />;
  if (user && profile && (pathname === "/" || pathname === "/onboarding")) {
    return <Redirect href="/(tabs)" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" hidden={false} />
      <AuthProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
});
