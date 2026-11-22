import { StyleSheet, Text, TouchableOpacity, StyleProp, TextStyle, ViewStyle } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Radius, Spacing } from "@/theme/spacing";

export type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "danger" | "outline";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};
export function Button({ children, onPress, variant = "primary", disabled, style, textStyle }: ButtonProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  const isDanger = variant === "danger";
  const isOutline = variant === "outline";
  const bg = disabled
    ? c.muted
    : isOutline
    ? "transparent"
    : isDanger
    ? c.danger
    : c.primary;
  const border = isOutline ? c.border : "transparent";
  const color = disabled ? c.textSecondary : isDanger ? "#fff" : isOutline ? c.text : "#fff";
  return (
    <TouchableOpacity
      style={[styles.container, styles[variant], { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 }, style]}
      onPress={onPress && !disabled ? onPress : undefined}
      disabled={disabled}
    >
      <Text style={[styles.text, { color }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius,
    minHeight: 52,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primary: {},
  danger: {},
  outline: {},
  text: { fontWeight: "700", fontSize: 16 },
});
