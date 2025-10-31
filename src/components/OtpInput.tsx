import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextStyle,
  ViewStyle,
  NativeSyntheticEvent,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  Platform,
  StyleProp,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme";

export interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  cellStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  placeholder?: string;
  editable?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
}

export default function OtpInput({
  length = 6,
  value: controlledValue,
  onChange,
  onComplete,
  autoFocus = true,
  secure = false,
  keyboardType = Platform.OS === "ios" ? "number-pad" : "numeric",
  cellStyle,
  containerStyle,
  placeholder = "",
  editable = true,
  returnKeyType = "done",
}: OtpInputProps) {
  const isControlled = typeof controlledValue === "string";
  const [value, setValue] = useState<string>(
    isControlled ? controlledValue || "" : "",
  );
  const inputs = useRef<(TextInput | null)[]>([]);
  const {colors} = useTheme();

  useEffect(() => {
    if (isControlled) setValue(controlledValue || "");
  }, [controlledValue, isControlled]);

  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0]?.focus();
    }
  }, [autoFocus]);

  const focusIndex = (i: number) => {
    const ref = inputs.current[i];
    ref?.focus?.();
  };

  const updateValue = (next: string) => {
    if (!isControlled) setValue(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChangeText = (text: string, index: number) => {
    const normalized = (text || "").replace(/\s+/g, "");
    if (normalized.length > 1) {
      // handle paste
      const current = value.split("");
      for (let i = 0; i < normalized.length && index + i < length; i++) {
        current[index + i] = normalized[i];
      }
      const next = current.join("").slice(0, length);
      updateValue(next);
      focusIndex(next.length < length ? next.length : length - 1);
      return;
    }

    const nextChars = value.split("").slice(0, length);
    nextChars[index] = normalized || "";
    const next = nextChars.join("");
    updateValue(next);

    if (normalized && index < length - 1) {
      focusIndex(index + 1);
    }
  };

  // ✅ Updated typing for Expo SDK 54 / RN 0.76+
  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      const currentChars = value.split("");
      if (!currentChars[index] && index > 0) {
        focusIndex(index - 1);
      }
    }
  };
  const dynamicStyles = StyleSheet.create({
    cell: {
      width: 44,
      height: 52,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
      borderRadius: 6,
      textAlign: "center",
      color: colors.textPrimary,
      fontSize: 20,
      padding: 0,
    } as TextStyle,
  });
  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            inputs.current[i] = r;
          }}
          value={value[i] || ""}
          onChangeText={(t) => handleChangeText(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          maxLength={1}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          style={[dynamicStyles.cell, cellStyle]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          editable={editable}
          returnKeyType={returnKeyType}
          textContentType={Platform.OS === "ios" ? "oneTimeCode" : "none"}
          importantForAutofill="yes"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});
