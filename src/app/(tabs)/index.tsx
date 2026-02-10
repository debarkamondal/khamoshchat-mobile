import { KeyPair } from "@/modules/libsignal-dezire";
import useSession from "@/src/store/useSession";
import * as Crypto from "expo-crypto";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import { useThemedStyles } from "@/src/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();

  // Theme-dependent styles (memoized by theme)
  const themedStyles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundPrimary,
    },
  }));

  // Insets-dependent styles (memoized by insets)
  const contactButtonStyle = useMemo(() => ({
    position: "absolute" as const,
    bottom: Platform.OS === "ios" ? insets.bottom + 55 : insets.bottom + 120,
    right: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 50,
  }), [insets.bottom]);
  return (
    <View style={themedStyles.container}>
      <StyledText>Tab Home</StyledText>
      <StyledButton
        style={contactButtonStyle}
        onPress={() => router.push("/contacts")}
      >
        <StyledText>
          <MaterialCommunityIcons name="contacts" size={28} />
        </StyledText>
      </StyledButton>
    </View>
  );
}
