import React from "react";
import {
  Pressable,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";

interface StyledButtonProps extends TouchableOpacityProps {
  variant?: "default" | "link";
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

const StyledButton = ({
  style,
  variant = "default",
  children,
  ...restProps
}: StyledButtonProps) => {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    base: {
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    default: {
      backgroundColor: colors.accentPrimary,
    },
    pressedDefault: {
      backgroundColor: colors.accentPrimaryDark ?? colors.accentPrimary,
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    link: {
      backgroundColor: "transparent",
    },
    pressedLink: {
      opacity: 0.6,
    },
  }));

  return (
    <Pressable
      style={({ pressed }) => {
        const variantStyles =
          variant === "link"
            ? [styles.base, styles.link, pressed && styles.pressedLink]
            : [styles.base, styles.default, pressed && styles.pressedDefault];
        return StyleSheet.flatten([variantStyles, style]);
      }}
      android_ripple={
        variant === "default"
          ? { color: "#00000020" }  // Use string color; PlatformColor values don't work with android_ripple
          : undefined
      }
      {...restProps}
    >
      {children}
    </Pressable>
  );
};

export default StyledButton;
