import React, { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import StyledTextInput from "@/src/components/StyledTextInput";
import Card from "@/src/components/Card";
import StyledText from "@/src/components/StyledText";
import { getContacts, SplitContact } from "@/src/utils/helpers/contacts";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import { router } from "expo-router";

export default function Contacts() {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<SplitContact[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>();

  useEffect(() => {
    (async () => {
      const contacts = await getContacts();
      setContacts(contacts);
    })();
  }, []);

  const insets = useSafeAreaInsets();
  
  const themedStyles = useThemedStyles((colors) => ({
    contactList: {
      paddingBottom: Platform.OS === "ios" ? insets.bottom + 20 : 12,
      paddingHorizontal: 4,
    },
    blurView: {
      flex: 1,
      marginTop: Platform.OS === "ios" ? 42 : insets.top || 24,
      marginHorizontal: Platform.OS === "ios" ? 16 : 12,
    },
    pressableCard: {
      marginVertical: 4,
      borderRadius: 12,
      overflow: "hidden" as const,
    },
    cardPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    cards: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      padding: 12,
      marginVertical: 0,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryContainer,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 14,
    },
    avatarText: {
      color: colors.onPrimaryContainer,
      fontSize: 15,
      fontWeight: "700" as const,
    },
    cardContent: {
      flex: 1,
      flexDirection: "column" as const,
      justifyContent: "center" as const,
    },
    contactName: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: colors.onBackground,
    },
    phoneNumber: {
      fontSize: 13,
      fontWeight: "400" as const,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    chevronIcon: {
      opacity: 0.6,
      marginLeft: 8,
    },
    heading: {
      fontSize: 32,
      fontWeight: "700" as const,
      color: colors.onBackground,
      zIndex: 5,
    },
    searchBar: {
      flexGrow: 1,
      borderRadius: 25,
      marginVertical: 8,
    },
    headingView: {
      flex: 0,
      marginTop: 8,
      marginBottom: 12,
    },
  }));

  const getInitials = (contact: SplitContact) => {
    const first = contact.firstName?.[0] || "";
    const last = contact.lastName?.[0] || "";
    if (first && /[^a-zA-Z]/.test(first) && !contact.lastName) {
      return "?";
    }
    const initials = (first + last).trim().toUpperCase();
    return initials || "?";
  };

  return (
    <SafeAreaView style={themedStyles.blurView}>
      <View style={themedStyles.headingView} collapsable={false}>
        <StyledText style={themedStyles.heading}>Contacts</StyledText>
        <StyledTextInput
          onChangeText={(text) => setSearchTerm(text)}
          style={themedStyles.searchBar}
          placeholder="Search contacts"
        />
      </View>
      <FlatList
        data={
          searchTerm
            ? contacts?.filter(
                (contact) =>
                  contact.number.startsWith(searchTerm) ||
                  contact.firstName
                    .toLowerCase()
                    .startsWith(searchTerm.toLowerCase()),
              )
            : contacts
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={themedStyles.contactList}
        scrollEnabled={true}
        renderItem={({ item }) => {
          const initials = getInitials(item);
          return (
            <Pressable
              onPress={() => {
                const phone = item.number.replace(/[^0-9+]/g, "");
                router.replace({ pathname: "/chat/[userId]", params: { userId: phone, id: item.id } });
              }}
              style={({ pressed }) => [
                themedStyles.pressableCard,
                pressed && themedStyles.cardPressed
              ]}
            >
              <Card styles={themedStyles.cards}>
                <View style={themedStyles.avatar}>
                  {initials === "?" ? (
                    <Ionicons name="person" size={18} color={colors.onPrimaryContainer as string} />
                  ) : (
                    <StyledText style={themedStyles.avatarText}>{initials}</StyledText>
                  )}
                </View>
                <View style={themedStyles.cardContent}>
                  <StyledText style={themedStyles.contactName}>
                    {item.firstName} {item.lastName || ""}
                  </StyledText>
                  <StyledText style={themedStyles.phoneNumber}>
                    {item.number} {item.label ? `• ${item.label}` : ""}
                  </StyledText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.onSurfaceVariant as string}
                  style={themedStyles.chevronIcon}
                />
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
