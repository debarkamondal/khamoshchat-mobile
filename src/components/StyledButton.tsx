import React from "react";
import {
  Pressable,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  Text,
  View,
} from "react-native";
import { useThemedStyles, useTheme } from "@/src/hooks/useTheme";
import { ThemeColors } from "@/src/static/colors";

interface StyledButtonProps extends TouchableOpacityProps {
  variant?: "default" | "link";
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

const buttonStylesFactory = (colors: ThemeColors) => ({
  base: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  default: {
    backgroundColor: colors.primary,
  },
  pressedDefault: {
    backgroundColor: colors.primary,
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  link: {
    backgroundColor: "transparent",
  },
  pressedLink: {
    opacity: 0.6,
  },
  textDefault: {
    color: colors.onPrimary,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  textLink: {
    color: colors.primary,
    fontWeight: '600' as const,
    fontSize: 16,
  },
});

const StyledButton = ({
  style,
  textStyle,
  variant = "default",
  children,
  ...restProps
}: StyledButtonProps) => {
  const styles = useThemedStyles(buttonStylesFactory);

  return (
    <Pressable
      android_ripple={
        variant === "default"
          ? { color: "#00000020" }  // Use string color; PlatformColor values don't work with android_ripple
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        variant === "link" ? styles.link : styles.default,
        pressed && (variant === "link" ? styles.pressedLink : styles.pressedDefault),
        style,
      ]}
      {...restProps}
    >
      {children}
    </Pressable>
  );
};

export default StyledButton;
