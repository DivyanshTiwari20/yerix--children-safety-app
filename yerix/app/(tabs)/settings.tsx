import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppState } from "@/state/store";
import { getSettings, putSettings, type Settings } from "@/services/api";
import { useAuth } from "@/state/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { COMMAND_PHRASES, WAKE_PHRASES } from "@/constants";
import { getDirectTriggerPreference, setDirectTriggerPreference } from "@/services/voicePreferences";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

export default function SettingsScreen() {
  const { dispatch } = useAppState();
  const { user, profile, signOut } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [settings, setSettings] = useState<Settings>({
    alert_message: "I need help. Here is my live location:",
    sensitivity: 5,
    phrases: { yerix: true, "help me": true, "save me": true },
  });
  const [directTrigger, setDirectTrigger] = useState(true);
  const [loading, setLoading] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Could not sign out", String((error as Error).message ?? error));
    }
  };

  useEffect(() => {
    load();
    loadDirectTrigger();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setSettings(await getSettings());
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const loadDirectTrigger = async () => {
    try {
      setDirectTrigger(await getDirectTriggerPreference());
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    }
  };

  const handleDirectTriggerChange = async (enabled: boolean) => {
    try {
      await setDirectTriggerPreference(enabled);
      setDirectTrigger(enabled);
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      await putSettings(settings);
    } catch (error) {
      Alert.alert("Error", String((error as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const sensitivity = Math.max(1, Math.min(10, Math.round(settings.sensitivity)));
  const panValue = ((sensitivity - 1) / 9) * 100;

  const responder = useCallback(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_event, gesture) => {
          const pct = Math.max(0, Math.min(100, gesture.moveX));
          pan.setValue(pct);
          const value = Math.max(1, Math.min(10, Math.round(1 + (pct / 100) * 9)));
          setSettings((previous) => ({ ...previous, sensitivity: value }));
        },
        onPanResponderRelease: () => {
          Animated.timing(pan, { toValue: panValue, duration: 100, useNativeDriver: false }).start();
          save();
        },
      }),
    [pan, panValue, save]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert message</Text>
          <Card>
            <TextInput
              style={[styles.messageInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
              value={settings.alert_message}
              onChangeText={(text) => setSettings((previous) => ({ ...previous, alert_message: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sensitivity</Text>
          <Card style={styles.sensitivityCard}>
            <View style={styles.sliderHeading}>
              <Text style={[styles.sliderDescription, { color: colors.textSecondary }]}>Detection sensitivity</Text>
              <Text style={[styles.sliderValue, { color: colors.primary }]}>{sensitivity}</Text>
            </View>
            <View style={styles.sliderWrap}>
              <View style={[styles.track, { backgroundColor: colors.border }]}>
                <View style={[styles.trackFill, { width: `${panValue}%`, backgroundColor: colors.primary }]} />
                <Animated.View style={[styles.thumb, { left: `${panValue}%`, backgroundColor: colors.primary }]} />
              </View>
              <TouchableOpacity style={styles.sliderHit} {...responder()} accessibilityLabel="Sensitivity slider" />
            </View>
            <Text style={[styles.sliderHint, { color: colors.textSecondary }]}>
              Stored only; not yet used for voice detection.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice activation</Text>
          <Card style={styles.voiceCard}>
            <View style={styles.directTriggerRow}>
              <View style={styles.directTriggerText}>
                <Text style={[styles.phraseText, { color: colors.text }]}>Direct trigger</Text>
                <Text style={[styles.sliderHint, { color: colors.textSecondary }]}>
                  Say &quot;help me&quot; without the wake word
                </Text>
              </View>
              <Switch
                value={directTrigger}
                onValueChange={handleDirectTriggerChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.phraseGroupTitle, { color: colors.text }]}>Wake phrases</Text>
            <View style={styles.phraseChips}>
              {WAKE_PHRASES.map((phrase) => (
                <View key={phrase} style={[styles.phraseChip, { backgroundColor: colors.blueTint }]}>
                  <Text style={[styles.phraseChipText, { color: colors.primary }]}>{phrase}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.phraseGroupTitle, { color: colors.text }]}>Command phrases</Text>
            <View style={styles.phraseChips}>
              {COMMAND_PHRASES.map((phrase) => (
                <View key={phrase} style={[styles.phraseChip, { backgroundColor: colors.blueTint }]}>
                  <Text style={[styles.phraseChipText, { color: colors.primary }]}>{phrase}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <Card style={styles.aboutCard}>
            <View style={styles.accountDetails}>
              <Text style={[styles.aboutName, { color: colors.text }]}>{profile?.full_name ?? user?.email}</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>{user?.email}</Text>
              {profile?.phone ? (
                <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>{profile.phone}</Text>
              ) : null}
            </View>
            <Button variant="outline" onPress={handleSignOut} style={styles.signOutButton}>
              Sign out
            </Button>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Card style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutName, { color: colors.text }]}>YERIX</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
            </View>
          </Card>
        </View>

        <Button onPress={save} disabled={loading} style={styles.saveButton}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.screen, gap: Spacing.section },
  title: { fontSize: 28, fontWeight: "700" },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  messageInput: { minHeight: 112, borderRadius: 14, padding: Spacing.three, fontSize: 15 },
  sensitivityCard: { gap: Spacing.two },
  sliderHeading: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sliderDescription: { fontSize: 14 },
  sliderValue: { fontSize: 18, fontWeight: "700" },
  sliderWrap: { height: 44, justifyContent: "center" },
  track: { height: 6, borderRadius: 3, overflow: "visible" },
  trackFill: { height: 6, borderRadius: 3 },
  thumb: { position: "absolute", top: -8, width: 22, height: 22, borderRadius: 11, marginLeft: -11 },
  sliderHit: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, height: 44 },
  sliderHint: { fontSize: 12 },
  voiceCard: { gap: Spacing.two },
  directTriggerRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  directTriggerText: { flex: 1, gap: Spacing.one },
  phraseText: { fontSize: 15, fontWeight: "500" },
  phraseGroupTitle: { fontSize: 13, fontWeight: "600" },
  phraseChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  phraseChip: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  phraseChipText: { fontSize: 12, fontWeight: "500" },
  aboutCard: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  aboutRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  accountDetails: { gap: Spacing.one, marginBottom: Spacing.two },
  signOutButton: { height: 48 },
  aboutName: { fontSize: 15, fontWeight: "700" },
  aboutVersion: { fontSize: 13 },
  saveButton: { width: "100%", height: 52 },
});
