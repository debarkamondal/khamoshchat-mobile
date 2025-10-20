import React from "react";
import {
  Pressable,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { getColors } from "../static/colors";

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
  const colors = getColors();

  const styles = StyleSheet.create({
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
      backgroundColor: colors.accentPrimaryDark ?? colors.accentPrimary, // fallback
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    link: {
      backgroundColor: "transparent",
    },
    pressedLink: {
      opacity: 0.6,
    },
  });

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
          ? { color: colors.accentPrimaryDark ?? "#00000020" }
          : undefined
      }
      {...restProps}
    >
      {children}
    </Pressable>
  );
};

export default StyledButton;
