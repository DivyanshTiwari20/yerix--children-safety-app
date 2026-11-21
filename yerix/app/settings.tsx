import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, SafeAreaView, Alert } from "react-native";
import { useAppState } from "@/state/store";
import { getSettings, putSettings, type Settings } from "@/services/api";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DEV_USER_ID } from "@/constants";

export default function SettingsScreen() {
  const { dispatch } = useAppState();
  const [settings, setSettings] = useState<Settings>({
    alert_message: "I need help. Here is my live location:",
    sensitivity: 5,
    phrases: { yerix: true, "help me": true, "save me": true },
  });
  const [loading, setLoading] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setSettings(await getSettings(DEV_USER_ID));
    } catch (e) {
      Alert.alert("Error", String((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      await putSettings(DEV_USER_ID, settings);
    } catch (e) {
      Alert.alert("Error", String((e as Error).message));
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
        onPanResponderMove: (_e, gesture) => {
          const pct = Math.max(0, Math.min(100, gesture.moveX));
          pan.setValue(pct);
          const s = Math.max(1, Math.min(10, Math.round(1 + (pct / 100) * 9)));
          setSettings((prev) => ({ ...prev, sensitivity: s }));
        },
        onPanResponderRelease: () => {
          Animated.timing(pan, { toValue: panValue, duration: 100, useNativeDriver: false }).start();
          save();
        },
      }),
    [pan, panValue, save]
  );

  const togglePhrase = (phrase: string) => {
    setSettings((prev) => ({
      ...prev,
      phrases: { ...prev.phrases, [phrase]: !prev.phrases[phrase] },
    }));
    save();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Stored locally on the device for now.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldTitle}>Alert message</Text>
          <TextInput
            style={styles.messageInput}
            value={settings.alert_message}
            onChangeText={(t) => setSettings((prev) => ({ ...prev, alert_message: t }))}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldTitle}>Sensitivity (1-10)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{sensitivity}</Text>
            <View style={styles.track}>
              <Animated.View style={[styles.thumb, { transform: [{ translateX: `${panValue}%` }] }]} />
            </View>
            <TouchableOpacity style={styles.sliderHit} {...responder()} />
          </View>
          <Text style={styles.sliderHint}>Stored only; not yet used for voice detection.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldTitle}>Wake / distress phrases</Text>
          {Object.entries(settings.phrases).map(([phrase, enabled]) => (
            <TouchableOpacity
              key={phrase}
              style={[styles.phraseRow, enabled && styles.phraseActive]}
              onPress={() => togglePhrase(phrase)}
            >
              <Text style={[styles.phraseText, { color: enabled ? "#111827" : "#9ca3af" }]}>{phrase}</Text>
              <Text style={styles.phraseBadge}>{enabled ? "on" : "off"}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Button onPress={save} disabled={loading} style={styles.saveBtn}>
          Save
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14 },
  card: { width: "100%", padding: 18, gap: 10 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 10 },
  messageInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
  },
  fieldTitle: { fontSize: 14, fontWeight: "600", color: "#6b7280", marginBottom: 8 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sliderLabel: { fontSize: 16, fontWeight: "800", width: 30 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#e5e7eb", overflow: "hidden" },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#dc2626", position: "absolute", left: 0 },
  sliderHit: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, height: 44 },
  sliderHint: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  phraseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  phraseActive: { borderColor: "#dc2626", backgroundColor: "#fef3f2" },
  phraseText: { fontSize: 14, fontWeight: "600" },
  phraseBadge: { fontSize: 12, fontWeight: "700" },
  saveBtn: { marginTop: 10 },
});
