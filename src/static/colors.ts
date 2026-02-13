
// Definition for a single color entry
export type ColorDefinition = {
  ios: string;
  android:
  | {
    dark: string;
    light: string;
  }
  | string;
  fallback: {
    light: string;
    dark: string;
  };
};

// Generic type for color groups
export type ColorGroup = Record<string, ColorDefinition>;

// Expanded color definitions
export const requiredColors = {
  // Text colors
  textPrimary: {
    ios: "label",
    android: "?attr/colorForeground",
    fallback: {
      light: "#000000",
      dark: "#FFFFFF",
    },
  },
  textSecondary: {
    ios: "secondaryLabel",
    android: {
      light: "@android:color/system_neutral1_700",
      dark: "@android:color/system_neutral1_300",
    },
    fallback: {
      light: "#5A5A5A",
      dark: "#C7C7C7",
    },
  },
  textTertiary: {
    ios: "tertiaryLabel",
    android: {
      light: "@android:color/system_neutral1_500",
      dark: "@android:color/system_neutral1_500",
    },
    fallback: {
      light: "#8E8E93",
      dark: "#6E6E73",
    },
  },

  // Backgrounds
  backgroundPrimary: {
    ios: "systemBackground",
    android: {
      light: "@android:color/system_neutral1_50",
      dark: "@android:color/system_neutral1_900",
    },
    fallback: {
      light: "#FFFFFF",
      dark: "#000000",
    },
  },
  backgroundSecondary: {
    ios: "secondarySystemBackground",
    android: "?attr/colorBackgroundFloating",
    fallback: {
      light: "#F2F2F7",
      dark: "#1C1C1E",
    },
  },
  backgroundTertiary: {
    ios: "tertiarySystemBackground",
    android: {
      light: "@android:color/system_neutral2_50",
      dark: "@android:color/system_neutral2_800",
    },
    fallback: {
      light: "#FFFFFF",
      dark: "#2C2C2E",
    },
  },

  // Borders / Dividers
  border: {
    ios: "separator",
    android: {
      light: "@android:color/system_neutral1_300",
      dark: "@android:color/system_neutral1_700",
    },
    fallback: {
      light: "#E0E0E0",
      dark: "#3A3A3C",
    },
  },

  // ── Brand accent (fixed yellow/orange — app identity) ──
  brandAccent: {
    ios: "systemOrange",
    android: {
      light: "#FF9500",
      dark: "#FF9F0A",
    },
    fallback: {
      light: "#FF9500",
      dark: "#FF9F0A",
    },
  },
  brandAccentDark: {
    ios: "systemOrange",
    android: {
      light: "#C77400",
      dark: "#D48600",
    },
    fallback: {
      light: "#C77400",
      dark: "#D48600",
    },
  },

  // ── System accent (Material You — follows device wallpaper) ──
  systemAccent: {
    ios: "systemOrange",
    android: {
      light: "@android:color/system_accent1_400",
      dark: "@android:color/system_accent1_600",
    },
    fallback: {
      light: "#007AFF",
      dark: "#0A84FF",
    },
  },
  accentBackground: {
    ios: "systemFill", // Standard dynamic fill color
    android: {
      light: "@android:color/system_accent2_400",
      dark: "@android:color/system_accent2_600",
    },
    fallback: {
      light: "#E8E0F0",
      dark: "#2A2040",
    },
  },

  // Semantic states
  success: {
    ios: "systemGreen",
    android: "@android:color/holo_green_light",
    fallback: {
      light: "#34C759",
      dark: "#30D158",
    },
  },
  warning: {
    ios: "systemYellow",
    android: {
      light: "#FFD60A",
      dark: "#FFD60A",
    },
    fallback: {
      light: "#FFD60A",
      dark: "#FFD60A",
    },
  },
  error: {
    ios: "systemRed",
    android: "@android:color/holo_red_light",
    fallback: {
      light: "#FF3B30",
      dark: "#FF453A",
    },
  },
  info: {
    ios: "systemTeal",
    android: "@android:color/holo_blue_bright",
    fallback: {
      light: "#5AC8FA",
      dark: "#64D2FF",
    },
  },

  // UI surfaces
  card: {
    ios: "secondarySystemBackground",
    android: "?attr/colorSurface",
    fallback: {
      light: "#FFFFFF",
      dark: "#1C1C1E",
    },
  },
  overlay: {
    ios: "systemGray5",
    android: {
      light: "@android:color/system_neutral2_100",
      dark: "@android:color/system_neutral2_800",
    },
    fallback: {
      light: "rgba(0,0,0,0.1)",
      dark: "rgba(255,255,255,0.1)",
    },
  },
  shadow: {
    ios: "systemGray4",
    android: {
      light: "@android:color/system_neutral1_500",
      dark: "@android:color/system_neutral1_900",
    },
    fallback: {
      light: "rgba(0,0,0,0.25)",
      dark: "rgba(0,0,0,0.5)",
    },
  },

  // Tab bar (brand-tinted)
  tabBarBackground: {
    ios: "systemOrange",
    android: {
      light: "@android:color/system_accent1_600",
      dark: "@android:color/system_accent1_900",
    },
    fallback: {
      light: "#007AFF",
      dark: "#0A84FF",
    },
  },
  tabBarIndicator: {
    ios: "systemOrange",
    android: {
      light: "#FF9500",
      dark: "#FF9F0A",
    },
    fallback: {
      light: "#FF9500",
      dark: "#FF9F0A",
    },
  },
} satisfies Record<string, ColorDefinition>;