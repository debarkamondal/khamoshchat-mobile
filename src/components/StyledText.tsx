import { StyleSheet, Text, TextProps } from "react-native";
import { useThemedStyles } from "@/src/hooks/useTheme";

const StyledText = ({ style: styles, ...restProps }: TextProps) => {
  const defaultStyles = useThemedStyles((colors) => ({
    textDefault: {
      color: colors.textPrimary,
      fontSize: 18,
    },
  }));
  return (
    <Text
      style={StyleSheet.flatten([defaultStyles.textDefault, styles])}
      {...restProps}
    />
  );
};

export default StyledText;
