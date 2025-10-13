import { StyleSheet, Text, TextProps } from "react-native";
import { getColors } from "../static/colors";

const StyledText = ({ style: styles, ...restProps }: TextProps) => {
  const colors = getColors();
  const defaultStyles = StyleSheet.create({
    textDefault: {
      color: colors.textPrimary,
      fontSize: 18,
    },
  });
  return (
    <Text
      style={StyleSheet.flatten([defaultStyles.textDefault, styles])}
      {...restProps}
    />
  );
};

export default StyledText;
