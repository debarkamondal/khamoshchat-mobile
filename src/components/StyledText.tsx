import { StyleSheet, Text, TextProps } from "react-native";
import { useTheme } from "@/src/hooks/colors";

const StyledText = ({ style: styles, ...restProps }: TextProps) => {
  const {colors} = useTheme();
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
