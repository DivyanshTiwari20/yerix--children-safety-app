import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/state/auth";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

export default function LoginScreen() {
  const { signInWithGoogle, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert("Google sign-in failed", String((error as Error).message ?? error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.blueTint }]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>Y</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>YERIX</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Safety and peace of mind, together.
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={[styles.welcome, { color: colors.text }]}>Welcome</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Sign in to set up your safety profile and emergency contacts.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={[styles.googleButton, { borderColor: colors.border }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.googleMark}>G</Text>
                <Text style={[styles.googleLabel, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          <Text style={[styles.privacy, { color: colors.textSecondary }]}>
            Your account is used to keep your profile and safety settings in sync.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: "space-between", padding: Spacing.screen, paddingTop: 72, paddingBottom: 48 },
  brand: { alignItems: "center", gap: Spacing.two },
  logo: { width: 76, height: 76, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  logoText: { fontSize: 42, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: 2 },
  subtitle: { fontSize: 15, textAlign: "center" },
  actions: { gap: Spacing.three },
  welcome: { fontSize: 25, fontWeight: "700" },
  description: { fontSize: 15, lineHeight: 22 },
  googleButton: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    backgroundColor: "#FFFFFF",
  },
  googleMark: { fontSize: 20, fontWeight: "700", color: "#4285F4" },
  googleLabel: { fontSize: 15, fontWeight: "600" },
  privacy: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  error: { color: "#DC2626", fontSize: 13 },
});
