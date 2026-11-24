import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuth } from "@/state/auth";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

export default function OnboardingScreen() {
  const { user, error: authError, saveProfile, signOut } = useAuth();
  const suggestedName = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
  const [fullName, setFullName] = useState(typeof suggestedName === "string" ? suggestedName : "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Enter your name to continue.");
      return;
    }
    setSaving(true);
    try {
      await saveProfile({ full_name: fullName.trim(), phone: phone.trim() });
    } catch (error) {
      Alert.alert("Could not save profile", String((error as Error).message ?? error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>LET&apos;S GET STARTED</Text>
          <Text style={[styles.title, { color: colors.text }]}>Your safety profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add your details so your YERIX profile is ready. You can update them later.
          </Text>
        </View>
        <Card style={styles.form}>
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          <Text style={[styles.label, { color: colors.text }]}>Your name</Text>
          <TextInput
            accessibilityLabel="Your name"
            style={[styles.input, { backgroundColor: colors.muted, color: colors.text }]}
            placeholder="Full name"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
          <Text style={[styles.label, { color: colors.text }]}>Phone number (optional)</Text>
          <TextInput
            accessibilityLabel="Phone number"
            style={[styles.input, { backgroundColor: colors.muted, color: colors.text }]}
            placeholder="Phone number"
            placeholderTextColor={colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
            keyboardType="phone-pad"
          />
          <Button onPress={handleContinue} disabled={saving} style={styles.continueButton}>
            {saving ? "Saving..." : "Continue"}
          </Button>
          {authError ? (
            <Button variant="outline" onPress={signOut}>
              Sign out and try again
            </Button>
          ) : null}
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: Spacing.screen, gap: Spacing.section },
  heading: { gap: Spacing.two },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15, lineHeight: 22 },
  form: { gap: Spacing.two },
  label: { fontSize: 14, fontWeight: "600" },
  input: { minHeight: 52, borderRadius: 14, paddingHorizontal: Spacing.three, fontSize: 15, marginBottom: Spacing.one },
  continueButton: { width: "100%", height: 52, marginTop: Spacing.two },
  email: { fontSize: 12, textAlign: "center" },
  error: { color: "#DC2626", fontSize: 13, lineHeight: 18 },
});
