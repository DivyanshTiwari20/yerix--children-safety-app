import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAppState } from "@/state/store";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SOSButton } from "@/components/SOSButton";
import { Countdown } from "@/components/Countdown";
import { StatusPill } from "@/components/StatusPill";
import { startSafeMode, stopSafeMode } from "@/services/safeMode";
import { startEmergencyFlow } from "@/services/emergency";
import { DEV_USER_ID, SAFE_MODE_DEFAULT_MIN, SAFE_MODE_OPTIONS_MIN } from "@/constants";

export default function HomeScreen() {
  const { state, dispatch } = useAppState();
  const router = useRouter();
  const [duration, setDuration] = useState(SAFE_MODE_DEFAULT_MIN);
  const [safeModeEnd, setSafeModeEnd] = useState<number | null>(null);

  const active = safeModeEnd != null && Date.now() < safeModeEnd;
  const remaining = active ? Math.max(0, Math.ceil((safeModeEnd - Date.now()) / 1000 / 60)) : 0;

  useEffect(() => {
    if (state.safeModeEnd != null) setSafeModeEnd(state.safeModeEnd);
  }, [state.safeModeEnd]);

  const handleStart = () => {
    startSafeMode(duration);
    setSafeModeEnd(Date.now() + duration * 60 * 1000);
    dispatch({ type: "setSafeModeEnd", end: Date.now() + duration * 60 * 1000 });
  };
  const handleStop = () => {
    stopSafeMode();
    setSafeModeEnd(null);
    dispatch({ type: "setSafeModeEnd", end: null });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>YERIX</Text>
        <Text style={styles.subtitle}>Children's Safety</Text>

        <Card style={styles.card}>
          <Text style={styles.statusTitle}>Safe Mode</Text>
          <StatusPill label={active ? `ON \u2022 ${remaining} min left` : "OFF"} variant={active ? "active" : "default"} />
          <Text style={styles.hint}>Listening only during a Safe Mode session. No 24/7 listening.</Text>
        </Card>

        <Text style={styles.section}>Duration</Text>
        <View style={styles.chips}>
          {SAFE_MODE_OPTIONS_MIN.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, duration === m && styles.chipActive]}
              onPress={() => setDuration(m)}
            >
              <Text style={[styles.chipText, duration === m && styles.chipTextActive]}>{m} min</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <Button variant="danger" onPress={handleStart} disabled={active}>
            {active ? "Safe Mode On" : "Start Safe Mode"}
          </Button>
          <Button variant="outline" onPress={handleStop} disabled={!active}>
            Stop Safe Mode
          </Button>
        </View>

        <View style={styles.row2}>
          <SOSButton onSos={() => startEmergencyFlow("sos")} label="SOS" />
          <Button onPress={() => startEmergencyFlow("test")} style={styles.testBtn}>
            Test emergency
          </Button>
        </View>

        <Text style={styles.section}>Last heard</Text>
        <Text style={styles.lastHeard}>{state.lastHeard || "\u2014"}</Text>

        <View style={styles.row}>
          <Button onPress={() => router.push("/contacts")} style={styles.flex1}>
            Contacts
          </Button>
          <Button variant="outline" onPress={() => router.push("/settings")} style={styles.flex1}>
            Settings
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, alignItems: "center" },
  title: { fontSize: 30, fontWeight: "800" },
  subtitle: { fontSize: 15, color: "#6b7280", marginBottom: 8 },
  card: { width: "100%", padding: 20, alignItems: "center", gap: 8 },
  statusTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  hint: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  section: { alignSelf: "stretch", fontSize: 14, fontWeight: "600", color: "#6b7280", marginTop: 8 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  chipTextActive: { color: "#fff" },
  row: { flexDirection: "row", gap: 10, width: "100" },
  row2: { flexDirection: "row", gap: 12, width: "100", alignItems: "center" },
  testBtn: { flex: 1 },
  flex1: { flex: 1 },
  lastHeard: { fontSize: 13, color: "#6b7280", marginTop: 4, textAlign: "center" },
});
