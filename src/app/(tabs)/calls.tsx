import StyledText from "@/src/components/StyledText";
import { useTheme } from "@/src/hooks/colors";
import { View, StyleSheet } from "react-native";

export default function Calls() {
  const colors = useTheme();
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
