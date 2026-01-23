import { SafeAreaView } from "react-native-safe-area-context";
import StyledText from "../../components/StyledText";
import { useTheme } from "@/src/hooks/useTheme";
import useSession from "@/src/store/session";
import StyledButton from "@/src/components/StyledButton";
import OtpInput from "@/src/components/OtpInput";
import { StyleSheet } from "react-native";
import { genOpks } from "@/src/utils/opks";
import { router } from "expo-router";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

export default function otp() {
  const { colors } = useTheme();
  const session = useSession();

  const {
    iKey,
    preKey,
    phone,
    markSessionRegistered: markSesssionRegistered,
  } = useSession();

  const submit = async (otp: number) => {
    if (!preKey || !iKey) return;
    const pubPreKey = await LibsignalDezireModule.genPubKey(preKey)
    const { signature, vrf } = await LibsignalDezireModule.vxeddsaSign(iKey, await LibsignalDezireModule.encodePublicKey(pubPreKey));
    const b64Sign = btoa(String.fromCharCode(...signature));
    const b64PreKey = btoa(String.fromCharCode(...pubPreKey));
    const b64Opks = await genOpks();
    const body = {
      phone: phone.countryCode + phone.number,
      sign: b64Sign,
      signedPreKey: b64PreKey,
      // iKey: btoa(String.fromCharCode(...await LibsignalDezireModule.genPubKey(iKey))),
      vrf: btoa(String.fromCharCode(...vrf)),
      opks: b64Opks,
      otp,

    }
    const res = await fetch("https://identity.dkmondal.in/test/register/otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log(await res.text())
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
