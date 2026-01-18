
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
    android: "?attr/textColorSecondary",
    fallback: {
      light: "#5A5A5A",
      dark: "#C7C7C7",
    },
  },
  textTertiary: {
    ios: "tertiaryLabel",
    android: "?attr/textColorHint",
    fallback: {
      light: "#8E8E93",
      dark: "#6E6E73",
    },
  },

  // Backgrounds
  backgroundPrimary: {
    ios: "systemBackground",
    android: {
      light: "@android:color/system_neutral1_100",
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
    android: "@android:color/system_neutral2_50",
    fallback: {
      light: "#FFFFFF",
      dark: "#2C2C2E",
    },
  },

  // Borders / Dividers
  border: {
    ios: "separator",
    android: "@android:color/system_neutral1_300",
    fallback: {
      light: "#E0E0E0",
      dark: "#3A3A3C",
    },
  },

  // Accent / Brand colors
  accentPrimary: {
    ios: "systemOrange",
    android: "@android:color/holo_orange_light",
    fallback: {
      light: "#FFA500",
      dark: "#FF8C00",
    },
  },
  accentPrimaryDark: {
    ios: "systemOrange",
    android: "@android:color/holo_orange_dark",
    fallback: {
      light: "#E69500",
      dark: "#CC7A00",
    },
  },
  // accentSecondary: {
  //   ios: "systemBlue",
  //   android: "@android:color/holo_blue_light",
  //   fallback: {
  //     light: "#007AFF",
  //     dark: "#0A84FF",
  //   },
  // },
  // accentTertiary: {
  //   ios: "systemGreen",
  //   android: "@android:color/holo_green_light",
  //   fallback: {
  //     light: "#34C759",
  //     dark: "#30D158",
  //   },
  // },

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
    android: "@android:color/holo_orange_dark",
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
    android: "@android:color/system_neutral2_100",
    fallback: {
      light: "rgba(0,0,0,0.1)",
      dark: "rgba(255,255,255,0.1)",
    },
  },
  shadow: {
    ios: "systemGray4",
    android: "@android:color/system_neutral1_500",
    fallback: {
      light: "rgba(0,0,0,0.25)",
      dark: "rgba(0,0,0,0.5)",
    },
  },
};