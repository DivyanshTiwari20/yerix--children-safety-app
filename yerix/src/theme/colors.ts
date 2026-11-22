export const Colors = {
  light: {
    primary: "#2B84E8",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#1B1F2A",
    textSecondary: "#8A93A5",
    border: "#E6E9F0",
    danger: "#EF4444",
    success: "#22C55E",
    muted: "#F3F5F9",
    blueTint: "#EAF3FE",
    greenTint: "#EAF9F0",
    redTint: "#FEECEC",
  },
  dark: {
    primary: "#2B84E8",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#1B1F2A",
    textSecondary: "#8A93A5",
    border: "#E6E9F0",
    danger: "#EF4444",
    success: "#22C55E",
    muted: "#F3F5F9",
    blueTint: "#EAF3FE",
    greenTint: "#EAF9F0",
    redTint: "#FEECEC",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
