import React, { createContext, useContext, useMemo } from "react";
import { Platform, PlatformColor, StyleSheet, useColorScheme, OpaqueColorValue } from "react-native";
import { requiredColors } from "@/src/static/colors";

// Derive color keys from the requiredColors object
type ColorKeys = keyof typeof requiredColors;

// Type for the computed colors object (maps color keys to color values)
type ComputedColors = { [K in ColorKeys]: string | OpaqueColorValue };

// Define types for the Theme Context
interface ThemeContextType {
  colors: ComputedColors;
  scheme: "light" | "dark" | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // useColorScheme from react-native returns 'light', 'dark', or undefined
  const scheme = useColorScheme() ?? 'light';
  const colors = useMemo(() => computeColors(scheme), [scheme]);
  return (
    <ThemeContext.Provider value={{ colors, scheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function computeColors(scheme: "light" | "dark" | null): ComputedColors {
  const platform = Platform.OS;
  const colorObj = {} as ComputedColors;

  for (const color of Object.keys(requiredColors) as ColorKeys[]) {
    const colorDef = requiredColors[color];
    if (platform === "ios") {
      colorObj[color] = PlatformColor(colorDef.ios);
    } else if (platform === "android") {
      colorObj[color] = PlatformColor(
        typeof colorDef.android === "string"
          ? colorDef.android
          : colorDef.android[scheme === "light" ? "light" : "dark"]
      );
    } else {
      colorObj[color] = colorDef.fallback[scheme ?? "light"];
    }
  }
  return colorObj;
}

// Export the type for colors object
export type ThemeColors = ComputedColors;

/**
 * Hook for creating memoized themed styles.
 * Styles are only recomputed when the theme colors change.
 *
 * @example
 * const styles = useThemedStyles((colors) => ({
 *   container: { backgroundColor: colors.backgroundPrimary },
 *   text: { color: colors.textPrimary },
 * }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (colors: ThemeColors) => T
): T {
  const { colors } = useTheme();
  return useMemo(
    () => StyleSheet.create(styleFactory(colors)),
    [colors, styleFactory]
  );
}
