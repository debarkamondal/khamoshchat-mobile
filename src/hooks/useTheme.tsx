import React, { createContext, useContext, useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { colors, ThemeColors } from "@/src/static/colors";

// Define types for the Theme Context
interface ThemeContextType {
  colors: ThemeColors;
  scheme: "light" | "dark" | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // useColorScheme from react-native returns 'light', 'dark', 'unspecified', or null
  // Calling this here triggers a re-render when the system theme changes
  // which is required for Color.android.dynamic.* to update correctly
  const rawScheme = useColorScheme();
  const scheme = rawScheme === 'light' || rawScheme === 'dark' ? rawScheme : 'light';

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

export type { ThemeColors };

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
