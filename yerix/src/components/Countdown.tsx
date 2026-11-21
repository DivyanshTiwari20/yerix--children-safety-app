import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

export type CountdownProps = { seconds: number; label?: string };
export function Countdown({ seconds, label }: CountdownProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: c.danger }]}>{seconds}</Text>
      {label && <Text style={[styles.caption, { color: c.textSecondary }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  value: { fontSize: 56, fontWeight: "800", letterSpacing: -2 },
  caption: { fontSize: 13, marginTop: Spacing.one },
});
