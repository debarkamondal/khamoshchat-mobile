import { Alert, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Color, Link } from "expo-router";
import { useState } from "react";

import StyledButton from "@/src/components/StyledButton";
import StyledTextInput from "@/src/components/StyledTextInput";
import StyledText from "@/src/components/StyledText";
import { useTheme } from "@/src/hooks/useTheme";
import useSession from "@/src/store/useSession";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

import "../../polyfills/crypto";

export default function RegisterPhoneDraft() {
  const { colors } = useTheme();
  const [phone, setPhone] = useState<string>();
  const [countryCode, setCountryCode] = useState<string>("+91");

  const { initSession, clearSession } = useSession();

  const confirmationAlert = () => {
    return Alert.alert(
      "Confirmation",
      `Are you sure ${countryCode} ${phone} is your phone number?`,
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          isPreferred: true,
          onPress: async () => {
            await clearSession();
            const session = await initSession({
              countryCode,
              number: parseInt(phone as string, 10),
            });
            const b64iKey = btoa(
              String.fromCharCode(...await LibsignalDezireModule.genPubKey(session.iKey)),
            );
            const res = await fetch(
              "https://identity.dkmondal.in/test/register/phone",
              {
                method: "POST",
                body: JSON.stringify({
                  phone: countryCode + phone,
                  iKey: b64iKey,
                }),
              },
            );
            if (res.status === 204) {
              Alert.alert("Phone OTP draft saved", "Restore the OTP route when phone onboarding returns.");
            } else {
              Alert.alert("Invalid request");
            }
          },
        },
      ],
    );
  };

  const dynamicStyle = StyleSheet.create({
    helpLink: {
      position: "absolute",
      bottom: 48,
      color: Platform.select({
        ios: Color.ios.systemOrange,
        android: Color.android.dynamic.primary,
        default: "#FF9500",
      }),
    },
    heading: {
      fontSize: 24,
      color: colors.onBackground,
    },
    text: {
      color: colors.onPrimary,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Platform.select({
        ios: Color.ios.systemBackground,
        android: Color.android.dynamic.surface,
        default: "#FFFFFF",
      }),
      color: colors.onBackground,
    },
  });

  return (
    <SafeAreaView style={dynamicStyle.container}>
      <StyledText style={dynamicStyle.heading}>
        Welcome to <StyledText style={styles.branding}>KhamoshChat!</StyledText>
      </StyledText>
      <StyledText style={styles.emoji}>🤫</StyledText>
      <View style={styles.inputContainer}>
        <StyledTextInput
          autoComplete="tel-country-code"
          value={countryCode}
          onChangeText={setCountryCode}
        />
        <StyledTextInput
          autoFocus
          style={styles.numberInput}
          textContentType="telephoneNumber"
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="Your Phone number"
          onChangeText={setPhone}
        />
      </View>
      <StyledButton style={styles.button} onPress={confirmationAlert}>
        <StyledText style={dynamicStyle.text}>Continue</StyledText>
        <Feather
          size={16}
          style={{ marginTop: 2 }}
          color={colors.onPrimary as string}
          name="arrow-right"
        />
      </StyledButton>

      <Link style={dynamicStyle.helpLink} href="/">
        Need help?
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "70%",
    marginTop: 18,
  },
  numberInput: {
    borderWidth: 2,
    padding: 8,
    borderRadius: 5,
    flexGrow: 1,
  },
  inputContainer: {
    width: "75%",
    flexDirection: "row",
    gap: 4,
  },
  branding: { fontWeight: "600", fontSize: 32 },
  emoji: {
    fontSize: 36,
    marginBottom: 24,
  },
});
