export const Colors = {
  light: {
    primary: "#dc2626",
    background: "#ffffff",
    card: "#f3f4f6",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    danger: "#dc2626",
    success: "#16a34a",
    muted: "#f3f4f6",
  },
  dark: {
    primary: "#ef4444",
    background: "#111827",
    card: "#1f2937",
    text: "#f3f4f6",
    textSecondary: "#9ca3af",
    border: "#374151",
    danger: "#ef4444",
    success: "#34d399",
    muted: "#1f2937",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
