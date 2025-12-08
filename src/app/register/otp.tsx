import { SafeAreaView } from "react-native-safe-area-context";
import StyledText from "../../components/StyledText";
import { useTheme } from "@/src/hooks/useTheme";
import useSession from "@/src/store/session";
import StyledButton from "@/src/components/StyledButton";
import OtpInput from "@/src/components/OtpInput";
import { ed25519 } from "@noble/curves/ed25519.js";
import { StyleSheet } from "react-native";
import { genOtks } from "@/src/utils/otks";
import { router } from "expo-router";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

export default function otp() {
  const colors = useTheme();
  const session = useSession();

  const {
    iKey,
    preKey,
    phone,
    markSessionRegistered: markSesssionRegistered,
  } = useSession();

  const submit = async (otp: number) => {
    if (!preKey || !iKey) return;
    const { signature } = await LibsignalDezireModule.vxeddsaSign(await LibsignalDezireModule.genPubKey(preKey), iKey);
    const b64Sign = btoa(String.fromCharCode(...signature));
    const b64PreKey = btoa(String.fromCharCode(...await LibsignalDezireModule.genPubKey(preKey)));
    const b64Otks = await genOtks();
    const res = await fetch("https://identity.dkmondal.in/test/register/otp", {
      method: "POST",
      body: JSON.stringify({
        phone: phone.countryCode + phone.number,
        sign: b64Sign,
        preKey: b64PreKey,
        otks: b64Otks,
        otp,
      }),
    });
    if (res.status === 204) {
      markSesssionRegistered();
      router.replace("/");
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundPrimary,
      color: colors.textPrimary,
    },
    linkText: {
      color: colors.accentPrimary,
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
        onComplete={(otp) => submit(parseInt(otp))}
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
    fontWeight: 800,
  },
  description: {
    fontSize: 14,
    marginTop: 16,
  },
  phone: {
    fontSize: 14,
    fontWeight: 600,
  },
  otp: {
    marginVertical: 32,
  },
});
