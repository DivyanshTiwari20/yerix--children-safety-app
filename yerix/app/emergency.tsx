import { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, Text, View, SafeAreaView, Linking } from "react-native";
import { router } from "expo-router";
import { useAppState } from "@/state/store";
import {
  subscribe,
  getEmergencyStatus,
  getEmergencyCountdown,
  startEmergencyFlow,
  cancelEmergency,
  endEmergency,
  resetEmergency,
  type EmergencyStatus,
} from "@/services/emergency";
import { getContacts, type Contact } from "@/services/api";
import { openWhatsApp } from "@/services/whatsapp";
import { EMERGENCY_NUMBER, DEV_USER_ID } from "@/constants";
import { Button } from "@/components/Button";
import { Countdown } from "@/components/Countdown";
import { StatusPill } from "@/components/StatusPill";

export default function EmergencyScreen() {
  const { dispatch } = useAppState();
  const [status, setStatus] = useState<EmergencyStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const unsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsub.current = subscribe((st, data) => {
      setStatus(st);
      setSeconds(getEmergencyCountdown());
      setEmergencyId(data.emergencyId);
      setTrackUrl(data.trackUrl);
    });
    startEmergencyFlow("sos");
    return () => {
      unsub.current?.();
      resetEmergency();
    };
  }, []);

  useEffect(() => {
    if (status === "active" || status === "countdown") {
      getContacts(DEV_USER_ID).then((cs) => {
        setContacts((cs ?? []).map((c: Contact) => ({ name: c.name, phone: c.phone })));
      });
    }
  }, [status]);

  const handleCancel = useCallback(() => {
    cancelEmergency();
    dispatch({ type: "setStatus", status: "idle" });
    router.back();
  }, [dispatch]);

  const handleSafe = useCallback(() => {
    endEmergency();
    dispatch({ type: "setStatus", status: "ended" });
    router.back();
  }, [dispatch]);

  const handleCall = () => Linking.openURL(`tel:${EMERGENCY_NUMBER}`);

  const isCountdown = status === "countdown";
  const isActive = status === "active";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Emergency</Text>
        <StatusPill
          label={isCountdown ? "Counting down\u2026" : isActive ? "ACTIVE" : "ENDED"}
          variant={isCountdown || isActive ? "active" : "default"}
        />

        {isCountdown ? (
          <View style={styles.countdownWrap}>
            <Countdown seconds={seconds} label="seconds until active" />
            <Text style={styles.hint}>Cancel to abort</Text>
            <Button onPress={handleCancel} style={styles.cancelBtn}>
              Cancel
            </Button>
          </View>
        ) : (
          <View style={styles.activeWrap}>
            <Text style={styles.activeTitle}>Help is on the way</Text>
            {trackUrl && (
              <View style={styles.linkCard}>
                <Text style={styles.linkLabel}>Tracking link</Text>
                <Text style={styles.linkUrl}>{trackUrl}</Text>
              </View>
            )}
            <View style={styles.actions}>
              {contacts.length > 0 && trackUrl && (
                <Button onPress={() => openWhatsApp(contacts[0].phone, trackUrl).catch(() => {})}>
                  Send WhatsApp
                </Button>
              )}
              <Button variant="outline" onPress={handleCall}>
                Call {EMERGENCY_NUMBER}
              </Button>
            </View>
            {isActive && (
              <Button variant="danger" onPress={handleSafe} style={styles.safeBtn}>
                I\u2019m safe
              </Button>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fee2e2" },
  content: { padding: 20, gap: 16, alignItems: "center", justifyContent: "center", flex: 1 },
  title: { fontSize: 26, fontWeight: "800", color: "#991b1b" },
  countdownWrap: { alignItems: "center" },
  hint: { color: "#9ca3af", fontSize: 13, marginTop: 6 },
  cancelBtn: { marginTop: 10 },
  activeWrap: { alignItems: "center" },
  activeTitle: { fontSize: 17, fontWeight: "700", color: "#991b1b", marginTop: 10 },
  linkCard: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 },
  linkLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
  linkUrl: { fontSize: 13, color: "#dc2626", fontWeight: "600", textAlign: "center" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14, width: "100", justifyContent: "center" },
  safeBtn: { marginTop: 14, width: "100%" },
});
