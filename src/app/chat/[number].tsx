import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import StyledTextInput from "@/src/components/StyledTextInput";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as Contacts from "expo-contacts";
import { View, StyleSheet } from "react-native";
import { sendInitialMessage, receiveInitialMessage } from '@/src/utils/messageHandler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useSession from "@/src/store/session";
import useMqtt from "@/src/hooks/connectMqttServer";

export default function Chat() {
  const { colors } = useTheme();
  const session = useSession();
  const { number, id }: { number: string; id: string } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>();
  const client = useMqtt(session.phone.countryCode + session.phone.number);

  const fetchChats = () => [];


  const sendMessage = async () => {
    if (fetchChats().length === 0) {
      // Logic for initial message (simplified in component, moved to utils)
      // Note: we are passing client which might be undefined, but the utility handles it (sort of, we might need to check client existence before calling if we want to be strict, but the original code had checks scattered. The utility has `if (!client) return;` at the end).
      // However, to match the utility signature we need session, number, client.
      await sendInitialMessage(session, number, client);
    }
  };
  useEffect(() => {
    if (!client) return;
    client.on("message", (topic, message) => {
      const parsedMessage = JSON.parse(message.toString());
      console.log(topic, parsedMessage);
      if (fetchChats().length === 0) {
        (async () => {
          try {
            // Assuming the message payload structure matches what receiveInitialMessage expects
            // The payload sent by sendInitialMessage is { identityKey, ephemeralKey, opkId }
            const sharedSecret = await receiveInitialMessage(session, parsedMessage);
            console.log("Shared Secret:", sharedSecret);
          } catch (e) {
            console.error("Error receiving initial message:", e);
          }
        })();
      }
    });
  }, [client])
  useEffect(() => {
    fetchChats();
    (async () => {
      // console.log(typeof urlParam.id);
      const data = await Contacts.getContactByIdAsync(id.split("/")[0]);
      setName(data?.firstName + " " + data?.lastName);
    })();
  }, []);

  // Theme-dependent styles (memoized by theme)
  const themedStyles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
  }));

  // Insets-dependent styles (memoized by insets)
  const messageBarInsetStyle = useMemo(() => ({
    paddingBottom: insets.bottom,
  }), [insets.bottom]);
  return (
    <SafeAreaView style={themedStyles.container}>
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
          messageBarInsetStyle,
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
