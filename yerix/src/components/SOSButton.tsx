import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { SOS_HOLD_MS } from "@/constants";

type Props = { onSos: () => void; label?: string };
export function SOSButton({ onSos, label = "SOS" }: Props) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "dark" ? "dark" : "light"];
  const [held, setHeld] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number | null>(null);

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    setHeld(true);
    setProgress(0);
    startedAt.current = Date.now();
    timer.current = setInterval(() => {
      const elapsed = startedAt.current == null ? 0 : Date.now() - startedAt.current;
      const next = Math.min(100, (elapsed / SOS_HOLD_MS) * 100);
      setProgress(next);
      if (next >= 100) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        startedAt.current = null;
        setHeld(false);
        onSos();
      }
    }, 50);
  };
  const stop = () => {
    setHeld(false);
    startedAt.current = null;
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setProgress(0);
  };
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    []
  );

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, held && styles.active, { backgroundColor: c.primary }]}
        onPressIn={start}
        onPressOut={stop}
      >
        <View pointerEvents="none" style={styles.ring}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>hold 2s</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 140, height: 140, alignSelf: "center" },
  button: {
    position: "relative",
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  active: { opacity: 0.85 },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  label: { color: "#fff", fontWeight: "700", fontSize: 20 },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
});
