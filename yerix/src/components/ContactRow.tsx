import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Radius, Spacing } from "@/theme/spacing";

export type ContactRowProps = {
  name: string;
  phone: string;
  onDelete: () => void;
  onPress?: () => void;
};
export function ContactRow({ name, phone, onDelete, onPress }: ContactRowProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.body} onPress={onPress}>
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: c.text }]}>{name}</Text>
          <Text style={[styles.phone, { color: c.textSecondary }]}>{phone}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.delete} onPress={onDelete}>
        <Text style={[styles.deleteText, { color: c.danger }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  body: { flex: 1 },
  textWrap: { flex: 1 },
  name: { fontWeight: "600", fontSize: 15 },
  phone: { fontSize: 13 },
  delete: { marginLeft: Spacing.three, padding: Spacing.one },
  deleteText: { fontSize: 13, fontWeight: "600" },
});
