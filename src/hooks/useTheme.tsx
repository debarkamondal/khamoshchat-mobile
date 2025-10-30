import React, { createContext, useContext, useMemo } from "react";
import { Platform, PlatformColor, useColorScheme } from "react-native";
import {requiredColors} from "@/src/static/colors";

// Define types for the Theme Context
interface ThemeContextType {
  colors: { [key: string]: any };
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

function computeColors(scheme: "light" | "dark" | null) {
  const platform = Platform.OS;
  // Compute colors fresh each time
  const colorObj: { [key: string]: any } = {};
  for (let color in requiredColors) {
    if (platform === "ios")
      colorObj[color] = PlatformColor(requiredColors[color].ios);
    else if (platform === "android")
      colorObj[color] = PlatformColor(
        typeof requiredColors[color].android === "string"
          ? requiredColors[color].android
          : requiredColors[color].android[
              scheme === "light" ? "light" : "dark"
            ],
      );
    else colorObj[color] = requiredColors[color].fallback[scheme ?? "light"];
  }
  return colorObj;
}
