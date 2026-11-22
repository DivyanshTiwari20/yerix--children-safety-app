import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "react-native";
import { SymbolView } from "expo-symbols";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";

export type ContactRowProps = {
  name: string;
  phone: string;
  onDelete: () => void;
  onPress?: () => void;
  last?: boolean;
};
export function ContactRow({ name, phone, onDelete, onPress, last = false }: ContactRowProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
  return (
    <View style={[styles.container, { borderBottomColor: c.border }, !last && styles.divider]}>
      <View style={[styles.badge, { backgroundColor: c.blueTint }]}>
        <Text style={[styles.initials, { color: c.primary }]}>{initials || "?"}</Text>
      </View>
      <TouchableOpacity style={styles.body} onPress={onPress}>
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: c.text }]}>{name}</Text>
          <Text style={[styles.phone, { color: c.textSecondary }]}>{phone}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.delete} onPress={onDelete} accessibilityLabel={`Delete ${name}`}>
        <SymbolView
          name={{ ios: "trash", android: "delete", web: "delete" }}
          tintColor={c.textSecondary}
          size={21}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingVertical: Spacing.two,
  },
  divider: { borderBottomWidth: 1 },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.three,
  },
  initials: { fontSize: 14, fontWeight: "700" },
  body: { flex: 1, justifyContent: "center" },
  textWrap: { justifyContent: "center" },
  name: { fontWeight: "600", fontSize: 15, marginBottom: 3 },
  phone: { fontSize: 13 },
  delete: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: Spacing.two },
});
