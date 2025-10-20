import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import { getColors } from "@/src/static/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const colors = getColors();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundPrimary,
    },
    contactButton: {
      position: "absolute",
      bottom: Platform.OS === "ios"? insets.bottom + 55: insets.bottom + 120,
      right: 10,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 50,
    },
  });
  return (
    <View style={styles.container}>
      <StyledText>Tab Home</StyledText>
      <StyledButton
        style={styles.contactButton}
        onPress={() => router.push("/contacts")}
      >
        <StyledText>
          <MaterialCommunityIcons name="contacts" size={28} />
        </StyledText>
      </StyledButton>
    </View>
  );
}
