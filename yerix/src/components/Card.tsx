import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { CardRadius, Spacing } from "@/theme/spacing";

export type CardProps = { children: React.ReactNode; style?: StyleProp<ViewStyle> };
export function Card({ children, style }: CardProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <View style={[styles.container, { backgroundColor: c.card, borderColor: c.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: CardRadius,
    borderWidth: 1,
    padding: Spacing.four,
  },
});
