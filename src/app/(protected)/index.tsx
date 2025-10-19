import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import { getColors } from "@/src/static/colors";
import { Link } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function Index() {
  const colors = getColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundPrimary,
    },
  });
  return (
    <View style={styles.container}>
      <StyledText>Tab Home</StyledText>
      <StyledButton>
        {/* <StyledText>Contact</StyledText> */}
        <Link href={"/contacts"}>Open modal</Link>
      </StyledButton>
    </View>
  );
}
