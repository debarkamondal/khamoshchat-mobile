import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import StyledTextInput from "@/src/components/StyledTextInput";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Contacts from "expo-contacts";
import { View, StyleSheet, Alert, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable } from "react-native";
import { sendInitialMessage, sendMessage } from '@/src/utils/messaging';
import { openChatDatabase, closeChatDatabase, getMessages, subscribeToMessages, Message } from '@/src/utils/storage';
import ChatBubble from "@/src/components/ChatBubble";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useSession from "@/src/store/useSession";
import useMqttStore from "@/src/store/useMqttStore";
import {
  initSender,
  encryptMessage,
  isRatchetInitialized,
  getIdentityKey,
  loadRatchetSession,
  clearSession
} from "@/src/utils/crypto";


export default function Chat() {
  const [name, setName] = useState<string>();
  const [message, setMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  // Track scroll position — in inverted list, offset 0 = bottom (latest messages)
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    // In inverted list, scrolling "up" (to older messages) increases offset
    setShowScrollButton(contentOffset.y > 150);
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const { number, id }: { number: string; id: string } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const session = useSession();
  const { client } = useMqttStore();

  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      try {
        // 1. Open Connection & Keep it open while screen is active
        await openChatDatabase(number);
        if (!isMounted) return;
        console.log(`DB connection kept open for ${number}`);

        // 2. Initial Fetch (now that DB is open, it won't close it)
        const msgs = await getMessages(number);
        if (isMounted) setChatMessages(msgs);
      } catch (error) {
        console.error("Failed to init chat DB:", error);
      }
    };

    initChat();

    // 3. Subscribe to updates
    const unsubscribe = subscribeToMessages((updatedChatId) => {
      if (updatedChatId === number && isMounted) {
        getMessages(number).then(setChatMessages);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      // 4. Close connection when leaving screen
      closeChatDatabase(number).then(() => console.log(`DB connection closed for ${number}`));
    };
  }, [number]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;

    // Check if we already have a session with this user
    let hasSession = await isRatchetInitialized(number);
    if (!hasSession) {
      // Try loading from storage
      await loadRatchetSession(number);
      hasSession = await isRatchetInitialized(number);
    }

    if (hasSession) {
      // Check for identity key integrity
      const identityKey = await getIdentityKey(number);

      if (!identityKey) {
        console.warn("Session broken: missing identity key. Clearing session and retrying as initial message.");
        await clearSession(number);
        hasSession = false;
      } else {
        // Send subsequent message
        await sendMessage({
          session,
          number,
          message: msg,
          client,
          encrypt: (plaintext, ad) => encryptMessage(number, plaintext, ad),
          recipientIdentityKey: identityKey
        });
      }
    }

    if (!hasSession) {
      // Send initial X3DH message
      await sendInitialMessage({
        session,
        number,
        message: msg,
        client,
        initSender: (sharedSecret, receiverPub, identityKey) => initSender(number, sharedSecret, receiverPub, identityKey),
        encrypt: (plaintext, ad) => encryptMessage(number, plaintext, ad)
      });
    }
    setMessage("");
    // Inverted list auto-shows new items at bottom, just ensure we're scrolled there
    scrollToBottom();
  };

  useEffect(() => {
    (async () => {
      if (id) {
        const data = await Contacts.getContactByIdAsync(id.split("/")[0]);
        setName(data?.firstName + " " + (data?.lastName || ""));
      } else {
        setName(number);
      }
    })();
  }, [id, number]);

  // Theme-dependent styles (memoized by theme)
  const themedStyles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    messageContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    scrollToBottomButton: {
      position: 'absolute',
      right: 16,
      bottom: 80,
      width: 40,
      height: 40,
      borderRadius: 20,
      borderCurve: 'continuous',
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
  }));

  // Insets-dependent styles (memoized by insets)
  const messageBarInsetStyle = useMemo(() => ({
    paddingBottom: insets.bottom,
  }), [insets.bottom]);

  return (
    <SafeAreaView style={themedStyles.container} edges={['top']}>
      <View style={styles.header}>
        <StyledButton onPress={() => router.back()} variant="link">
          <Ionicons
            color={colors.brandAccent}
            name="chevron-back"
            size={24}
          />
        </StyledButton>
        <StyledText style={styles.image}>
          <Ionicons name="person-circle-outline" size={32} />
        </StyledText>
        <StyledText style={styles.headerTitle}>{name || number}</StyledText>
      </View>

      <FlatList
        ref={flatListRef}
        style={themedStyles.messageContainer}
        data={[...chatMessages].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} />
        )}
        contentContainerStyle={{ paddingTop: 100 }} // Space for input bar (top in inverted = bottom visually)
        onScroll={onScroll}
        scrollEventThrottle={100}
      />

      {showScrollButton && (
        <Pressable
          style={themedStyles.scrollToBottomButton}
          onPress={scrollToBottom}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
      )}

      <View
        style={StyleSheet.flatten([
          messageBarInsetStyle,
          styles.messageBar,
          { backgroundColor: colors.backgroundPrimary } // Ensure background covers list
        ])}
      >
        <StyledTextInput
          style={styles.messageInput}
          placeholder={"Send message"}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <StyledButton
          onPress={() => handleSendMessage(message)}
          style={styles.messageButton}
        >
          <StyledText>
            <Ionicons name="send" size={24} color={colors.textPrimary} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    width: '100%', // Constrain width to prevent horizontal overflow
    alignItems: "center",
    flexDirection: "row",
  },
  messageInput: {
    borderRadius: 25,
    padding: 12,
    flex: 1, // Ensure shrinking when content overflows
    margin: 4,
    maxHeight: 120, // Prevent infinite growth
    alignSelf: 'center', // Keep centered vertically within input bar
  },
});
