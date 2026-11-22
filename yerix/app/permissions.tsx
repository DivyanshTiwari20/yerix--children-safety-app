import { useState, type ComponentProps } from "react";
import { Platform, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AudioModule } from "expo-audio";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

type PermissionStatus = { location?: string; notification?: string; microphone?: string };
type SymbolName = ComponentProps<typeof SymbolView>["name"];

export default function PermissionsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [status, setStatus] = useState<PermissionStatus>({});

  const requestLocation = async () => {
    const { status: result } = await Location.requestForegroundPermissionsAsync();
    await Location.requestBackgroundPermissionsAsync();
    setStatus((previous) => ({ ...previous, location: result }));
  };

  const requestNotifications = async () => {
    const { status: result } = await Notifications.requestPermissionsAsync();
    setStatus((previous) => ({ ...previous, notification: result }));
  };

  const requestMicrophone = async () => {
    try {
      await AudioModule.requestRecordingPermissionsAsync();
      setStatus((previous) => ({ ...previous, microphone: "granted" }));
    } catch {
      setStatus((previous) => ({ ...previous, microphone: "denied" }));
    }
  };

  const PermissionCard = ({
    title,
    reason,
    icon,
    value,
    onAllow,
  }: {
    title: string;
    reason: string;
    icon: SymbolName;
    value?: string;
    onAllow: () => void;
  }) => {
    const granted = value === "granted";
    return (
      <Card style={styles.permissionCard}>
        <View style={styles.permissionHeading}>
          <View style={[styles.iconBadge, { backgroundColor: granted ? colors.greenTint : colors.blueTint }]}>
            <SymbolView
              name={icon}
              tintColor={granted ? colors.success : colors.primary}
              size={23}
            />
          </View>
          <View style={styles.permissionTitleWrap}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.permissionStatus, { color: granted ? colors.success : colors.textSecondary }]}>
              {value ?? "Not requested"}
            </Text>
          </View>
        </View>
        <Text style={[styles.reason, { color: colors.textSecondary }]}>{reason}</Text>
        <Button onPress={onAllow} disabled={granted} style={styles.allowButton}>
          {granted ? "Allowed" : "Allow"}
        </Button>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: colors.text }]}>Permissions</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Allow these to use Safe Mode and send alerts.
          </Text>
        </View>

        <PermissionCard
          title="Microphone"
          reason="Listens for your wake word only during Safe Mode."
          icon={{ ios: "mic.fill", android: "mic", web: "mic" }}
          value={status.microphone}
          onAllow={requestMicrophone}
        />
        <PermissionCard
          title="Location"
          reason="Shares your location with emergency contacts."
          icon={{ ios: "location.fill", android: "location_on", web: "location_on" }}
          value={status.location}
          onAllow={requestLocation}
        />
        <PermissionCard
          title="Notifications"
          reason="Keeps the Safe Mode session visible while it is active."
          icon={{ ios: "bell.fill", android: "notifications", web: "notifications" }}
          value={status.notification}
          onAllow={requestNotifications}
        />
        {Platform.OS === "android" && (
          <Button variant="outline" onPress={() => router.replace("/(tabs)")} style={styles.homeButton}>
            Back to Home
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.screen, gap: Spacing.section },
  heading: { gap: Spacing.one },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  permissionCard: { gap: Spacing.two },
  permissionHeading: { minHeight: 56, flexDirection: "row", alignItems: "center" },
  iconBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  permissionTitleWrap: { flex: 1, marginLeft: Spacing.three, gap: Spacing.one },
  permissionTitle: { fontSize: 16, fontWeight: "600" },
  permissionStatus: { fontSize: 12, textTransform: "capitalize" },
  reason: { fontSize: 13, lineHeight: 19 },
  allowButton: { width: "100%", height: 52 },
  homeButton: { width: "100%", height: 52 },
});
