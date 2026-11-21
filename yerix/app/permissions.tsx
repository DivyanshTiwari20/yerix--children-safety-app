import { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Button as RNButton, Platform, Alert } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";

export default function PermissionsScreen() {
  const [status, setStatus] = useState<{ location?: string; notification?: string; microphone?: string }>({});

  const requestLocation = async () => {
    const { status: s } = await Location.requestForegroundPermissionsAsync();
    await Location.requestBackgroundPermissionsAsync();
    setStatus((prev) => ({ ...prev, location: s }));
  };

  const requestNotifications = async () => {
    const { status: s } = await Notifications.requestPermissionsAsync();
    setStatus((prev) => ({ ...prev, notification: s }));
  };

  const requestMicrophone = async () => {
    try {
      await Audio.requestPermissionsAsync();
      setStatus((prev) => ({ ...prev, microphone: "granted" }));
    } catch (e) {
      setStatus((prev) => ({ ...prev, microphone: "denied" }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>YERIX needs these to run Safe Mode.</Text>
        <View style={styles.row}><RNButton title="Location" onPress={requestLocation} /></View>
        <View style={styles.row}><RNButton title="Notifications" onPress={requestNotifications} /></View>
        {Platform.OS === "android" && (
          <View style={styles.row}><RNButton title="Microphone" onPress={requestMicrophone} /></View>
        )}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Status</Text>
          <Text style={styles.value}>location: {status.location ?? "\u2014"}</Text>
          <Text style={styles.value}>notifications: {status.notification ?? "\u2014"}</Text>
          <Text style={styles.value}>microphone: {status.microphone ?? "\u2014"}</Text>
        </View>
        <RNButton title="Back to Home" onPress={() => {}} color="#dc2626" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 14, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 13, color: "#6b7280", textAlign: "center" },
  row: { width: "100%", marginVertical: 4 },
  card: { width: "100%", padding: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, gap: 6 },
  value: { fontSize: 13, fontFamily: "monospace", color: "#111827" },
});
