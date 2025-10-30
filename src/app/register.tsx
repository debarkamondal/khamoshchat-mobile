import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StyledStyledTextInput from "@/src/components/StyledTextInput";
import StyledButton from "@/src/components/StyledButton";
import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import StyledText from "@/src/components/StyledText";
import { useMemo, useState } from "react";
import "./../polyfills/crypto";
import useSession from "@/src/store/session";

export default function register() {
  const colors = useTheme();
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
          onPress: () => console.log("No Pressed"),
          style: "cancel",
        },
        {
          text: "Yes",
          isPreferred: true,
          onPress: async () => {
            await clearSession();
            const iKey = await initSession({
              countryCode,
              number: parseInt(phone as string),
            });
            const b64iKey = btoa(String.fromCharCode(...iKey.public));
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
            if (res.status === 204) router.push("/register/otp");
            else
              Alert.alert("Invalid request", undefined, [
                {
                  text: "okay",
                  style: "cancel",
                },
              ]);
          },
        },
      ],
    );
  };

  const dynamicStyle = useMemo(
    () =>
      StyleSheet.create({
        helpLink: {
          position: "absolute",
          bottom: 48,
          color: colors.accentPrimary,
        },
        heading: {
          fontSize: 24,
          color: colors.textPrimary,
        },
        container: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.backgroundPrimary,
          color: colors.textPrimary,
        },
      }),
    [colors],
  );
  return (
    <SafeAreaView style={dynamicStyle.container}>
      <StyledText style={dynamicStyle.heading}>
        Welcome to{" "}
        <StyledText style={styles.branding}>KhamoshChat!</StyledText>{" "}
      </StyledText>
      <StyledText style={styles.emoji}>🤫</StyledText>
      <View style={styles.inputContainer}>
        <StyledStyledTextInput
          // defaultValue="+91"
          autoComplete="tel-country-code"
          value={countryCode}
          onChangeText={(value) => setCountryCode(value)}
        />
        <StyledStyledTextInput
          autoFocus
          style={styles.numberInput}
          textContentType="telephoneNumber"
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="Your Phone number"
          onChangeText={(value) => setPhone(value)}
        />
      </View>
      <StyledButton style={styles.button} onPress={confirmationAlert}>
        <StyledText>Continue</StyledText>
        <Feather
          size={16}
          style={{ marginTop: 2 }}
          color={colors.textPrimary}
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
  branding: { fontWeight: 600, fontSize: 32 },
  emoji: {
    fontSize: 36,
    marginBottom: 24,
  },
});
