import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppState } from "@/state/store";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SOSButton } from "@/components/SOSButton";
import { StatusPill } from "@/components/StatusPill";
import { startSafeMode, stopSafeMode } from "@/services/safeMode";
import { startEmergencyFlow } from "@/services/emergency";
import { SAFE_MODE_DEFAULT_MIN, SAFE_MODE_OPTIONS_MIN } from "@/constants";
import { Colors } from "@/theme/colors";
import { Radius, Spacing } from "@/theme/spacing";

export default function HomeScreen() {
  const { state, dispatch } = useAppState();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [duration, setDuration] = useState(SAFE_MODE_DEFAULT_MIN);
  const [safeModeEnd, setSafeModeEnd] = useState<number | null>(null);
  const [armSecondsLeft, setArmSecondsLeft] = useState(0);

  const active = safeModeEnd != null && Date.now() < safeModeEnd;
  const remaining = active ? Math.max(0, Math.ceil((safeModeEnd - Date.now()) / 60000)) : 0;
  const remainingHours = Math.floor(remaining / 60);
  const remainingMinutes = remaining % 60;
  const remainingLabel = remainingHours > 0
    ? `${remainingHours}h ${remainingMinutes}m remaining`
    : `${remainingMinutes}m remaining`;
  const endTime = safeModeEnd == null
    ? ""
    : new Date(safeModeEnd).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    if (state.safeModeEnd != null) setSafeModeEnd(state.safeModeEnd);
  }, [state.safeModeEnd]);

  useEffect(() => {
    const expiresAt = state.armExpiresAt;
    if (!state.armed || expiresAt == null) {
      setArmSecondsLeft(0);
      return;
    }

    const updateCountdown = () => {
      setArmSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [state.armed, state.armExpiresAt]);

  const handleStart = async () => {
    try {
      await startSafeMode(duration);
      const end = Date.now() + duration * 60 * 1000;
      setSafeModeEnd(end);
      dispatch({ type: "setSafeModeEnd", end });
    } catch (error) {
      Alert.alert("Safe Mode failed to start", String((error as Error).message ?? error));
    }
  };

  const handleStop = async () => {
    try {
      await stopSafeMode();
    } catch (error) {
      console.error("Failed to stop Safe Mode", error);
    }
    setSafeModeEnd(null);
    dispatch({ type: "setSafeModeEnd", end: null });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: colors.text }]}>YERIX</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Children&apos;s safety, with you.</Text>
        </View>

        <Card style={[styles.hero, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={styles.heroEyebrow}>SAFE MODE</Text>
          <Text style={styles.heroStatus}>{active ? `ON until ${endTime}` : "OFF"}</Text>
          <Text style={styles.heroDetail}>
            {active ? remainingLabel : "Listening only while you choose to keep it on."}
          </Text>
          <Button
            onPress={active ? handleStop : handleStart}
            style={styles.heroButton}
            textStyle={{ color: colors.primary }}
          >
            {active ? "Stop Safe Mode" : "Start Safe Mode"}
          </Button>
        </Card>

        {state.armed && (
          <View style={styles.armedPill}>
            <StatusPill label={`Listening... ${armSecondsLeft}s`} variant="listening" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Duration</Text>
          <View style={styles.chips}>
            {SAFE_MODE_OPTIONS_MIN.map((minutes) => {
              const selected = duration === minutes;
              return (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setDuration(minutes)}
                >
                  <Text style={[styles.chipText, { color: selected ? "#FFFFFF" : colors.text }]}>
                    {minutes} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Card style={styles.sosCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency SOS</Text>
          <SOSButton onSos={() => startEmergencyFlow("sos")} />
        </Card>

        <Button
          variant="outline"
          onPress={() => startEmergencyFlow("test")}
          style={[styles.testButton, { borderColor: colors.border }]}
          textStyle={{ color: colors.primary }}
        >
          Test emergency
        </Button>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Last heard</Text>
          <Card style={styles.lastHeardCard}>
            {state.heardHistory.length === 0 ? (
              <Text style={[styles.lastHeard, { color: colors.textSecondary }]}>{"\u2014"}</Text>
            ) : (
              state.heardHistory
                .slice(-5)
                .reverse()
                .map((entry, index) => (
                  <View key={`${entry.timestamp}-${index}`} style={styles.heardEntry}>
                    <Text style={[styles.heardTimestamp, { color: colors.textSecondary }]}>
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </Text>
                    <Text numberOfLines={1} style={[styles.lastHeard, { color: colors.text }]}>
                      {entry.text}
                    </Text>
                  </View>
                ))
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.screen, gap: Spacing.section },
  heading: { gap: Spacing.one },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  hero: { width: "100%", padding: Spacing.screen, gap: Spacing.two },
  heroEyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  heroStatus: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  heroDetail: { color: "#FFFFFF", fontSize: 14, marginBottom: Spacing.two },
  heroButton: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF", borderRadius: Radius, height: 52 },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 14, fontWeight: "600" },
  sosCard: { alignItems: "center", gap: Spacing.three },
  testButton: { height: 52, borderRadius: Radius },
  lastHeardCard: { padding: Spacing.three },
  armedPill: { alignItems: "flex-start" },
  heardEntry: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  heardTimestamp: { fontSize: 11 },
  lastHeard: { fontSize: 13 },
});
