import { useState } from "react";
import { StyleSheet, TextInput as Input, TextInputProps } from "react-native";
import { useTheme } from "@/src/hooks/useTheme";

const StyledTextInput = ({ style: styles, ...restProps }: TextInputProps) => {
  const [isInFocus, setIsInFocus] = useState(false);
  const colors = useTheme();
  const defaultStyles = StyleSheet.create({
    textInputDefault: {
      color: colors.textPrimary,
      borderWidth: 2,
      padding: 8,
      borderRadius: 5,
      borderColor: colors.border,
    },
    textInputActive: {
      borderColor: colors.accentPrimary,
    },
  });
  return (
    <Input
      style={StyleSheet.flatten([
        defaultStyles.textInputDefault,
        isInFocus ? defaultStyles.textInputActive : "",
        styles,
      ])}
      onFocus={() => setIsInFocus(true)}
      onBlur={() => setIsInFocus(false)}
      {...restProps}
    />
  );
};

export default StyledTextInput;
