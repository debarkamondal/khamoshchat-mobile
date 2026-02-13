import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Platform, FlatList, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getChatThreads, subscribeToChatList, ChatThread } from "@/src/utils/storage";
import StyledTextInput from "@/src/components/StyledTextInput";

export default function Index() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter threads based on search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(query)) ||
        t.phone.toLowerCase().includes(query) ||
        (t.last_message && t.last_message.toLowerCase().includes(query))
    );
  }, [threads, searchQuery]);

  // Load chat threads and subscribe to updates
  useEffect(() => {
    let isMounted = true;

    getChatThreads().then(t => {
      if (isMounted) setThreads(t);
    });

    const unsubscribe = subscribeToChatList(() => {
      getChatThreads().then(t => {
        if (isMounted) setThreads(t);
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  // Theme-dependent styles
  const themedStyles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    headerSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    chatTitle: {
      fontSize: 32,
      fontWeight: "700" as const,
      color: colors.textPrimary,
      marginBottom: 12,
      marginTop: 12,
    },
    searchContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      borderWidth: 0,
      paddingVertical: 8,
    },
    threadItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  // FAB position style
  const contactButtonStyle = useMemo(() => ({
    position: "absolute" as const,
    bottom: Platform.OS === "ios" ? insets.bottom + 55 : insets.bottom + 120,
    right: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 50,
  }), [insets.bottom]);

  const renderThread = useCallback(({ item }: { item: ChatThread }) => (
    <Pressable
      style={themedStyles.threadItem}
      onPress={() => router.push({ pathname: "/chat/[number]", params: { number: item.phone } })}
    >
      <View style={themedStyles.avatar}>
        <StyledText>
          <MaterialCommunityIcons name="account" size={28} />
        </StyledText>
      </View>
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <StyledText style={styles.threadName} numberOfLines={1}>
            {item.name || item.phone}
          </StyledText>
          <StyledText style={[styles.threadTime, { color: colors.textTertiary }]}>
            {formatTime(item.last_message_at)}
          </StyledText>
        </View>
        <StyledText
          style={[styles.threadPreview, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.last_message || ''}
        </StyledText>
      </View>
    </Pressable>
  ), [themedStyles, colors, formatTime]);

  const ListHeader = useMemo(() => (
    <View style={themedStyles.headerSection}>
      <StyledText style={themedStyles.chatTitle}>Chat</StyledText>
      <View style={themedStyles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary as string} />
        <StyledTextInput
          style={themedStyles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor={colors.textTertiary as string}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary as string} />
          </Pressable>
        )}
      </View>
    </View>
  ), [themedStyles, colors, searchQuery]);

  return (
    <SafeAreaView style={themedStyles.container} edges={['top']}>
      {threads.length === 0 ? (
        <View style={themedStyles.emptyContainer}>
          {ListHeader}
          <StyledText style={{ color: colors.textTertiary }}>
            No conversations yet
          </StyledText>
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item.phone}
          renderItem={renderThread}
          ListHeaderComponent={ListHeader}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <StyledButton
        style={contactButtonStyle}
        onPress={() => router.push("/contacts")}
      >
        <StyledText>
          <MaterialCommunityIcons name="contacts" size={28} />
        </StyledText>
      </StyledButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  threadName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  threadTime: {
    fontSize: 12,
  },
  threadPreview: {
    fontSize: 14,
  },
});
