import { Pressable, StyleSheet, TouchableOpacityProps } from "react-native";
import { getColors } from "../static/colors";

interface StyledButtonProps extends TouchableOpacityProps {
  variant?: "default" | "link";
}
const StyledButton = ({
  style: styles,
  variant = "default",
  children,
  ...restProps
}: StyledButtonProps) => {
  const colors = getColors();

  const defaultStyles = StyleSheet.create({
    default: {
      margin: 4,
      padding: 8,
      paddingHorizontal: 12,
      borderRadius: 5,
      backgroundColor: colors.accentPrimary,
    },
    link: {
      backgroundColor: "transparent",
    },
  });
  return (
    <Pressable
      style={StyleSheet.flatten([defaultStyles[variant], styles])}
      activeOpacity={0.65}
      {...restProps}
    >
      {children}
    </Pressable>
  );
};
export default StyledButton;
