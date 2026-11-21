import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Radius, Spacing } from "@/theme/spacing";

type Props = { onSos: () => void; label?: string };
export function SOSButton({ onSos, label = "SOS" }: Props) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  const [held, setHeld] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setHeld(true);
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 50;
        if (next >= 100) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          setHeld(false);
          onSos();
          return 100;
        }
        return next;
      });
    }, 50);
  };
  const stop = () => {
    setHeld(false);
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setProgress(0);
  };
  useEffect(() => () => stop(), []);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, held && styles.active, { backgroundColor: c.danger }]}
        onPressIn={start}
        onPressOut={stop}
        onLongPress={() => {
          stop();
          onSos();
        }}
      >
        <View style={styles.ring}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>hold 2s</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  button: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  active: { opacity: 0.85 },
  ring: { position: "absolute", inset: 0, borderRadius: 55 },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "0%",
    backgroundColor: "rgba(255,255,255,0.35)",
    borderTopLeftRadius: 55,
    borderBottomLeftRadius: 55,
  },
  label: { color: "#fff", fontWeight: "700", fontSize: 20 },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
});
