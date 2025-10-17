import StyledText from "@/src/components/StyledText";
import { getColors } from "@/src/static/colors";
import { View, StyleSheet } from "react-native";

export default function Groups() {
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
      <StyledText>Coming Soon !!!</StyledText>
    </View>
  );
}
