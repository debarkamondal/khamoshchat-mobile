import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import StyledTextInput from "@/src/components/StyledTextInput";
import { useTheme } from "@/src/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import * as Contacts from "expo-contacts";
import { View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Chat() {
  const colors = useTheme();
  const { number, id }: { number: string; id: string } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>();

  const fetchChats = () => {};
  const sendMessage = () => {};
  useEffect(() => {
    fetchChats();
    (async () => {
      // console.log(typeof urlParam.id);
      const data = await Contacts.getContactByIdAsync(id.split("/")[0]);
      setName(data?.firstName + " " + data?.lastName);
    })();
  }, []);

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
      <View style={styles.header}>
        <StyledButton onPress={() => router.back()} variant="link">
          <Ionicons
            color={colors.accentPrimary}
            name="chevron-back"
            size={24}
          />
        </StyledButton>
        <StyledText style={styles.image}>
          <Ionicons name="search" size={24} />
        </StyledText>
        <StyledText>{name}</StyledText>
      </View>
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
        <StyledButton
          onPress={() => sendMessage()}
          style={styles.messageButton}
        >
          <StyledText>
            <Ionicons name="send" size={24} />
          </StyledText>
        </StyledButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  image: {
    margin: 8,
  },
  header: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
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
