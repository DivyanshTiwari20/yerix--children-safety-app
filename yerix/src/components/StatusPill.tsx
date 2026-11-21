import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Radius, Spacing } from "@/theme/spacing";

export type StatusPillProps = { label: string; variant?: "active" | "ended" | "cancelled" | "default" };
export function StatusPill({ label, variant = "default" }: StatusPillProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  const conf = {
    active: { bg: "#fef3f2", color: c.danger },
    ended: { bg: c.muted, color: c.textSecondary },
    cancelled: { bg: c.muted, color: c.textSecondary },
    default: { bg: c.muted, color: c.textSecondary },
  }[variant];
  return (
    <View style={[styles.container, { backgroundColor: conf.bg }]}>
      <Text style={[styles.text, { color: conf.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 12, fontWeight: "600" },
});
