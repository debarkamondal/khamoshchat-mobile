import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import StyledTextInput from "@/src/components/StyledTextInput";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Contacts from "expo-contacts";
import { View, StyleSheet, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, KeyboardAvoidingView, Platform, Keyboard, Alert } from "react-native";
import { sendInitialMessage, sendMessage } from '@/src/utils/messaging';
import {
  openChatDatabase,
  closeChatDatabase,
  getMessages,
  subscribeToMessages,
  Message,
  DatabaseKeyMismatchError,
  StorageError,
} from '@/src/utils/storage';
import ChatBubble from "@/src/components/ChatBubble";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useSession from "@/src/store/useSession";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') return;

    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height + 8);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    const initChat = async (attempt = 0) => {
      try {
        await openChatDatabase(number);
        if (!isMounted) return;

        const msgs = await getMessages(number);
        if (isMounted) {
          setChatMessages(msgs);
          setDbError(null);
        }
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof DatabaseKeyMismatchError) {
          setDbError(
            'Chat history could not be decrypted and may be unrecoverable.'
          );
        } else if (error instanceof StorageError && error.recoverable && attempt < 3) {
          // Transient error — retry with backoff
          setTimeout(() => initChat(attempt + 1), 500 * (attempt + 1));
        } else {
          setDbError('Failed to load chat history. Please try again.');
          console.error('Failed to init chat DB:', error);
        }
      }
    };

    initChat();

    // Subscribe to live message updates
    const unsubscribe = subscribeToMessages((updatedChatId) => {
      if (updatedChatId === number && isMounted) {
        getMessages(number)
          .then(setChatMessages)
          .catch(e => console.error('Failed to refresh messages:', e));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      closeChatDatabase(number).catch(() => {});
    };
  }, [number]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    if (dbError) {
      Alert.alert('Cannot Send', 'Chat history is unavailable. Please restart the app.');
      return;
    }

    // Clear input immediately — message will be saved to DB with 'pending' status
    setMessage("");
    scrollToBottom();

    try {
      // Check if we already have a session with this user
      let hasSession = await isRatchetInitialized(number);
      if (!hasSession) {
        await loadRatchetSession(number);
        hasSession = await isRatchetInitialized(number);
      }

      if (hasSession) {
        const identityKey = await getIdentityKey(number);
        if (!identityKey) {
          console.warn('Session broken: missing identity key. Clearing session and retrying.');
          await clearSession(number);
          hasSession = false;
        } else {
          await sendMessage({
            session,
            number,
            message: msg,
            encrypt: (plaintext, ad) => encryptMessage(number, plaintext, ad),
            recipientIdentityKey: identityKey,
          });
        }
      }

      if (!hasSession) {
        await sendInitialMessage({
          session,
          number,
          message: msg,
          initSender: (sharedSecret, receiverPub, identityKey) =>
            initSender(number, sharedSecret, receiverPub, identityKey),
          encrypt: (plaintext, ad) => encryptMessage(number, plaintext, ad),
        });
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      Alert.alert('Send Failed', 'Your message could not be sent. Please try again.');
    }
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
      backgroundColor: colors.background,
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
      backgroundColor: colors.surface,
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
    paddingBottom: keyboardHeight > 0 && Platform.OS !== 'ios' ? 8 : insets.bottom,
  }), [insets.bottom, keyboardHeight]);

  const content = (
    <>
      <View style={styles.header}>
        <StyledButton onPress={() => router.back()} variant="link">
          <Ionicons
            color={colors.primary}
            name="chevron-back"
            size={24}
          />
        </StyledButton>
        <StyledText style={styles.image}>
          <Ionicons name="person-circle-outline" size={32} />
        </StyledText>
        <StyledText style={styles.headerTitle}>{name || number}</StyledText>
      </View>

      {dbError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <StyledText style={{ color: colors.error, textAlign: 'center' }}>
            {dbError}
          </StyledText>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={themedStyles.messageContainer}
          data={[...chatMessages].reverse()}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} />
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
          onScroll={onScroll}
          scrollEventThrottle={100}
        />
      )}

      {showScrollButton && (
        <Pressable
          style={themedStyles.scrollToBottomButton}
          onPress={scrollToBottom}
        >
          <Ionicons name="chevron-down" size={24} color={colors.onBackground} />
        </Pressable>
      )}

      <View
        style={StyleSheet.flatten([
          messageBarInsetStyle,
          styles.messageBar,
          { backgroundColor: colors.background }
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
          <Ionicons name="send" size={24} color={colors.onPrimary as string} />
        </StyledButton>
      </View>
    </>
  );

  return (
    <SafeAreaView style={themedStyles.container} edges={['top']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          style={themedStyles.container}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={[themedStyles.container, { paddingBottom: keyboardHeight }]}>
          {content}
        </View>
      )}
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
    width: '100%', // Constrain width to prevent horizontal overflow
    alignItems: "center",
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)', // Optional separation line
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
