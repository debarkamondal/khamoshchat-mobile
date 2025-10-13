import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { getColors } from "../static/colors";

const StyledButton = ({
  style: styles,
  children,
  ...restProps
}: TouchableOpacityProps) => {
  const colors = getColors();

  const defaultStyles = StyleSheet.create({
    default: {
      margin: 4,
      padding: 8,
      paddingHorizontal: 12,
      borderRadius: 5,
      backgroundColor: colors.accentPrimary,
      // ...Platform.select({
      //   ios: {
      //     backgroundColor: PlatformColor("systemYellow"),
      //     color: PlatformColor("label"),
      //   },
      // }),
    },
    pressed: {},
  });
  return (
    <TouchableOpacity
      style={StyleSheet.flatten([defaultStyles.default, styles])}
      activeOpacity={0.65}
      {...restProps}
    >
      {children}
    </TouchableOpacity>
  );
};
export default StyledButton;
