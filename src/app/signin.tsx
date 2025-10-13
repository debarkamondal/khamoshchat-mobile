import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StyledStyledTextInput from "../components/StyledTextInput";
import StyledButton from "../components/StyledButtonInput";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { getColors } from "../static/colors";
import StyledText from "../components/StyledText";
export default function signIn() {
  const colors = getColors();
  const styles = StyleSheet.create({
    helpLink: {
      position: "absolute",
      bottom: 48,
      color: colors.accentPrimary,
    },
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
  });
  return (
    <SafeAreaView style={styles.container}>
      <StyledText style={styles.heading}>
        Welcome to{" "}
        <StyledText style={styles.branding}>KhamoshChat!</StyledText>{" "}
      </StyledText>
      <StyledText style={styles.emoji}>🤫</StyledText>
      <View style={styles.inputContainer}>
        <StyledStyledTextInput
          defaultValue="+91"
          autoComplete="tel-country-code"
        />
        <StyledStyledTextInput
          autoFocus
          style={styles.numberInput}
          textContentType="telephoneNumber"
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="Your Phone number"
        />
      </View>
      <StyledButton style={styles.button}>
        <StyledText>Continue</StyledText>
        <Feather
          size={16}
          style={{ marginTop: 2 }}
          color={colors.textPrimary}
          name="arrow-right"
        />
      </StyledButton>
      <Link style={styles.helpLink} href="/">
        Need help?
      </Link>
    </SafeAreaView>
  );
}
