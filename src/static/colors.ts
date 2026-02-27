import { Color } from "expo-router";
import { Platform } from "react-native";

export const colors = {
  // Text colors
  textPrimary: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: "#000000",
  }),
  textSecondary: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: "#5A5A5A",
  }),
  textTertiary: Platform.select({
    ios: Color.ios.tertiaryLabel,
    android: Color.android.dynamic.outline,
    default: "#8E8E93",
  }),

  // Backgrounds
  backgroundPrimary: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: "#FFFFFF",
  }),
  backgroundSecondary: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceVariant,
    default: "#F2F2F7",
  }),
  backgroundTertiary: Platform.select({
    ios: Color.ios.tertiarySystemBackground,
    android: Color.android.dynamic.surfaceContainerHigh,
    default: "#FFFFFF",
  }),

  // Borders / Dividers
  border: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: "#E0E0E0",
  }),

  // Brand accent
  brandAccent: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.primary,
    default: "#FF9500",
  }),
  brandAccentDark: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.primary, // Android dynamic colors handle dark mode automatically
    default: "#C77400",
  }),

  // "on" colors — text/icons that sit on top of accent surfaces
  onBrandAccent: Platform.select({
    ios: "#FFFFFF",
    android: Color.android.dynamic.onPrimary,
    default: "#FFFFFF",
  }),

  // System accent (Material You / Adaptive)
  systemAccent: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.primary,
    default: "#007AFF",
  }),
  accentBackground: Platform.select({
    ios: Color.ios.systemFill,
    android: Color.android.dynamic.primaryContainer,
    default: "#E8E0F0",
  }),

  // Semantic states
  success: Platform.select({
    ios: Color.ios.systemGreen,
    android: "#99cc00", // Android holo_green_light hex
    default: "#34C759",
  }),
  warning: Platform.select({
    ios: Color.ios.systemYellow,
    android: Color.android.dynamic.tertiary,
    default: "#FFD60A",
  }),
  error: Platform.select({
    ios: Color.ios.systemRed,
    android: Color.android.dynamic.error,
    default: "#FF3B30",
  }),
  info: Platform.select({
    ios: Color.ios.systemTeal,
    android: "#33b5e5", // Android holo_blue_bright hex
    default: "#5AC8FA",
  }),

  // UI surfaces
  card: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceContainerLow,
    default: "#FFFFFF",
  }),
  overlay: Platform.select({
    ios: Color.ios.systemGray5,
    android: Color.android.dynamic.surfaceContainerHighest,
    default: "rgba(0,0,0,0.1)",
  }),
  shadow: Platform.select({
    ios: Color.ios.systemGray4,
    android: Color.android.dynamic.shadow,
    default: "rgba(0,0,0,0.25)",
  }),

  // Tab bar
  tabBarBackground: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.primary,
    default: "#007AFF",
  }),
  tabBarIndicator: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.primaryContainer,
    default: "#FF9500",
  }),
};

export type ThemeColors = typeof colors;