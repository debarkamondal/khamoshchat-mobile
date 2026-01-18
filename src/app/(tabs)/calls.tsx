import StyledText from "@/src/components/StyledText";
import { useThemedStyles } from "@/src/hooks/useTheme";
import { View } from "react-native";

export default function Calls() {
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundPrimary,
    },
  }));
  return (
    <View style={styles.container}>
      <StyledText>Coming Soon !!!</StyledText>
    </View>
  );
}

