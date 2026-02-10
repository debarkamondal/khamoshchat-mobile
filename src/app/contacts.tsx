import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import StyledText from "../components/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import StyledTextInput from "../components/StyledTextInput";
import Card from "../components/Card";
import { getContacts, SplitContact } from "@/src/utils/helpers/contacts";
import { Link, router } from "expo-router";

export default function Contacts() {
  const [contacts, setContacts] = useState<SplitContact[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>();
  useEffect(() => {
    (async () => {
      const contacts = await getContacts();
      setContacts(contacts)
    })();
  }, []);
  return (
    <SafeAreaView style={styles.blurView}>
      {/* Things inside the SafeAreaView is same for android and ios can be copied */}
      <StyledText style={styles.heading}>Contacts</StyledText>
      <StyledTextInput
        onChangeText={(text) => setSearchTerm(text)}
        style={styles.searchBar}
        placeholder="Search contacts"
      />
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
        contentContainerStyle={styles.contactList}
        scrollEnabled={true}
        renderItem={({ item }) => (
          <Card styles={styles.cards}>
            <StyledText>
              <Ionicons name={"search"} size={24} />
            </StyledText>
            <Pressable
              onPress={() => {
                const phone = item.number.replace(/(?!^\+)\D/g, "");
                router.replace(`/chat/${phone}?id=${item.id}`);
              }}
              style={styles.cardContent}
            >
              {item && (
                <StyledText>
                  {item.firstName} {item.lastName}
                </StyledText>
              )}
              <StyledText style={styles.phoneNumber}>
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
  contactList: {
    paddingBottom: 12,
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: 300,
    marginVertical: 8,
  },
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
  iconContainer: {
    backgroundColor: "red",
    borderRadius: 25,
    padding: 4,
    paddingHorizontal: 4,
  },
  // searchView: {
  //   marginBottom: 8,
  //   marginTop: 8,
  //   gap: 4,
  //   flex: 0,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  // },
  blurView: {
    flex: 0,
    marginTop: Platform.OS === "ios" ? 42 : 24,
    marginHorizontal: Platform.OS === "ios" ? 16 : 12,
  },
  heading: {
    fontSize: 36,
    fontWeight: 600,
    zIndex: 5,
  },
});
