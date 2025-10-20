import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import StyledTextInput from "@/src/components/StyledTextInput";
import { getColors } from "@/src/static/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Chat() {
  const colors = getColors();
  const urlParam = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const fetchChats = () => {};
  useEffect(() => fetchChats(), []);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    messageBar: {
      paddingBottom: insets.bottom,
    },
  });
  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StyledText>Chat: {urlParam.number}</StyledText>
      <View
        style={StyleSheet.flatten([
          dynamicStyles.messageBar,
          styles.messageBar,
        ])}
      >
        <StyledTextInput
          style={styles.messageInput}
          placeholder={"Send message"}
        />
        <StyledButton onPress={() => {}} style={styles.messageButton}>
          <StyledText>
            <Ionicons name="send" size={24} />
          </StyledText>
        </StyledButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageButton: {
    paddingHorizontal: 10,
    padding: 10,
    margin: 4,
    borderRadius: 25,
  },
  messageBar: {
    flex: 0,
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    flexDirection: "row",
  },
  messageInput: {
    borderRadius: 25,
    padding: 12,
    flexGrow: 1,
    margin: 4,
  },
});
