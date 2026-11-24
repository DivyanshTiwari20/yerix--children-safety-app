import { useEffect, useState, useCallback, useRef } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppState } from "@/state/store";
import {
  subscribe,
  getEmergencyCountdown,
  getEmergencyStatus,
  openWhatsAppAlertForContact,
  startEmergencyFlow,
  cancelEmergency,
  endEmergency,
  resetEmergency,
  type EmergencyStatus,
} from "@/services/emergency";
import { getContacts, type Contact } from "@/services/api";
import { EMERGENCY_NUMBER } from "@/constants";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

export default function EmergencyScreen() {
  const { dispatch } = useAppState();
  const [status, setStatus] = useState<EmergencyStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const unsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsub.current = subscribe((nextStatus, data) => {
      setStatus(nextStatus);
      setSeconds(getEmergencyCountdown());
      setEmergencyId(data.emergencyId);
      setTrackUrl(data.trackUrl);
    });
    startEmergencyFlow("sos");
    return () => {
      unsub.current?.();
      if (getEmergencyStatus() === "active") {
        endEmergency();
      }
      resetEmergency();
    };
  }, []);

  useEffect(() => {
    if (status === "active" || status === "countdown") {
      getContacts().then((items) => {
        setContacts((items ?? []).map((contact: Contact) => ({ name: contact.name, phone: contact.phone })));
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" hidden={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {isCountdown ? (
          <View style={styles.countdownContent}>
            <Text style={styles.eyebrow}>EMERGENCY</Text>
            <Text style={styles.countdown}>{seconds}</Text>
            <Text style={styles.countdownLabel}>seconds until help is alerted</Text>
            <Button
              variant="outline"
              onPress={handleCancel}
              style={styles.cancelButton}
              textStyle={styles.cancelText}
            >
              Cancel
            </Button>
          </View>
        ) : (
          <View style={styles.activeContent}>
            <Text style={styles.eyebrow}>EMERGENCY</Text>
            <Text style={styles.activeTitle}>{isActive ? "Help is on the way" : "Emergency ended"}</Text>
            <Card style={styles.activeCard}>
              <Text style={styles.cardTitle}>Tracking link</Text>
              <Text selectable style={styles.trackUrl}>{trackUrl ?? "Preparing your tracking link..."}</Text>
              {contacts.map((contact) => (
                <View key={contact.phone} style={styles.contactAction}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <Button
                    onPress={() => trackUrl && openWhatsAppAlertForContact(contact.phone, trackUrl)}
                    disabled={!trackUrl}
                    style={styles.whatsAppButton}
                  >
                    WhatsApp
                  </Button>
                </View>
              ))}
              {contacts.length === 0 && <Text style={styles.noContacts}>No emergency contacts added.</Text>}
            </Card>
            <Button onPress={handleCall} style={styles.actionButton}>Call Indian emergency services ({EMERGENCY_NUMBER})</Button>
            {isActive && (
              <Button onPress={handleSafe} style={styles.actionButton}>I&apos;m safe</Button>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.danger },
  content: { flexGrow: 1, justifyContent: "center", padding: Spacing.screen, gap: Spacing.section },
  countdownContent: { alignItems: "center", gap: Spacing.two },
  eyebrow: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "700", letterSpacing: 1.4 },
  countdown: { color: "#FFFFFF", fontSize: 112, fontWeight: "700", lineHeight: 124 },
  countdownLabel: { color: "#FFFFFF", fontSize: 16, textAlign: "center" },
  cancelButton: {
    width: "100%",
    height: 56,
    marginTop: Spacing.four,
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    borderRadius: 16,
  },
  cancelText: { color: Colors.light.danger },
  activeContent: { gap: Spacing.section },
  activeTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  activeCard: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF", gap: Spacing.three },
  cardTitle: { color: Colors.light.text, fontSize: 16, fontWeight: "600" },
  trackUrl: { color: Colors.light.textSecondary, fontSize: 13, lineHeight: 20 },
  contactAction: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.two,
  },
  contactInfo: { flex: 1, gap: Spacing.one },
  contactName: { color: Colors.light.text, fontSize: 14, fontWeight: "600" },
  contactPhone: { color: Colors.light.textSecondary, fontSize: 12 },
  whatsAppButton: { width: 116, height: 52, minHeight: 52, paddingHorizontal: Spacing.two },
  noContacts: { color: Colors.light.textSecondary, fontSize: 13 },
  actionButton: { width: "100%", height: 52 },
});
