import React, { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import StyledTextInput from "@/src/components/StyledTextInput";
import Card from "@/src/components/Card";
import StyledText from "@/src/components/StyledText";
import { getContacts, SplitContact } from "@/src/utils/helpers/contacts";
import { useThemedStyles } from "@/src/hooks/useTheme";
import { router } from "expo-router";

export default function Contacts() {
  const [contacts, setContacts] = useState<SplitContact[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>();
  useEffect(() => {
    (async () => {
      const contacts = await getContacts();
      setContacts(contacts)
    })();
  }, []);

  const insets = useSafeAreaInsets();
  
  const themedStyles = useThemedStyles((colors) => ({
    contactList: {
      paddingBottom: Platform.OS === "ios" ? insets.bottom + 20 : 12,
    },
    blurView: {
      flex: 1,
      marginTop: Platform.OS === "ios" ? 42 : insets.top || 24,
      marginHorizontal: Platform.OS === "ios" ? 16 : 12,
    },
    phoneNumber: {
      fontSize: 14,
      fontWeight: "300" as const,
      marginVertical: 8,
      color: colors.onSurfaceVariant,
    },
    heading: {
      fontSize: 36,
      fontWeight: "600" as const,
      color: colors.onBackground,
      zIndex: 5,
    },
  }));

  return (
    <SafeAreaView style={themedStyles.blurView}>
      <View style={styles.headingView} collapsable={false}>
        <StyledText style={themedStyles.heading}>Contacts</StyledText>
        <StyledTextInput
          onChangeText={(text) => setSearchTerm(text)}
          style={styles.searchBar}
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
        renderItem={({ item }) => (
          <Card styles={styles.cards}>
            <StyledText>
              <Ionicons name={"search"} size={24} />
            </StyledText>
            <Pressable
              onPress={() => {
                const phone = item.number.replace(/[^0-9+]/g, "");
                router.replace(`/chat/${phone}?id=${item.id}`);
              }}
              style={styles.cardContent}
            >
              {item && (
                <StyledText>
                  {item.firstName} {item.lastName}
                </StyledText>
              )}
              <StyledText style={themedStyles.phoneNumber}>
                {item.number} ({item.label})
              </StyledText>
            </Pressable>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    flex: 0,
    flexDirection: "column",
    marginVertical: 4,
  },
  cards: {
    flex: 0,
    marginVertical: 0,
    flexDirection: "row",
    padding: 4,
    gap: 16,
    alignItems: "center",
  },
  searchBar: {
    flexGrow: 1,
    borderRadius: 25,
    marginVertical: 8,
  },
  headingView: {
    flex: 0,
    marginTop: 8,
  },
});
