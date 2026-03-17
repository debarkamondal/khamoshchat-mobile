import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import OtpInput from "@/src/components/OtpInput";
import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import { useTheme } from "@/src/hooks/useTheme";
import useSession from "@/src/store/useSession";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { generateOpks } from "@/src/utils/crypto";

export default function OtpScreenDraft() {
  const { colors } = useTheme();
  const session = useSession();

  const {
    iKey,
    preKey,
    phone,
    markSessionRegistered,
  } = useSession();

  const submit = async (otp: number) => {
    if (!preKey || !iKey) {
      return;
    }

    const pubPreKey = await LibsignalDezireModule.genPubKey(preKey);
    const { signature, vrf } = await LibsignalDezireModule.vxeddsaSign(iKey, pubPreKey);
    const b64Sign = btoa(String.fromCharCode(...signature));
    const b64PreKey = btoa(String.fromCharCode(...pubPreKey));
    const b64Opks = await generateOpks();

    const res = await fetch("https://identity.dkmondal.in/test/register/otp", {
      method: "POST",
      body: JSON.stringify({
        phone: phone.countryCode + phone.number,
        sign: b64Sign,
        signedPreKey: b64PreKey,
        vrf: btoa(String.fromCharCode(...vrf)),
        opks: b64Opks,
        otp,
      }),
    });

    if (res.status === 204) {
      markSessionRegistered();
      router.replace("/");
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      color: colors.onBackground,
    },
    linkText: {
      color: colors.primary,
      textDecorationLine: "underline",
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StyledText style={styles.heading}>Enter OTP</StyledText>
      <StyledText style={styles.description}>
        A one time password has been sent to
      </StyledText>
      <StyledText style={styles.phone}>
        {session.phone.countryCode} {session.phone.number}
      </StyledText>
      <OtpInput
        containerStyle={styles.otp}
        length={6}
        onComplete={(otp) => submit(parseInt(otp, 10))}
      />
      <StyledButton variant="link" style={styles.link}>
        <StyledText style={dynamicStyles.linkText}>Resend OTP</StyledText>
      </StyledButton>
      <StyledButton>
        <StyledText>Continue</StyledText>
      </StyledButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  link: {
    position: "absolute",
    bottom: 48,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    marginTop: 16,
  },
  phone: {
    fontSize: 14,
    fontWeight: "600",
  },
  otp: {
    marginVertical: 32,
  },
});
