import { FlatList, Pressable, StyleSheet, View } from "react-native";
import StyledText from "../components/StyledText";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import StyledTextInput from "../components/StyledTextInput";
import Card from "../components/Card";
import { getContacts, SplitContact } from "../hooks/getContacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, router } from "expo-router";

export default function Contacts() {
  const [contacts, setContacts] = useState<SplitContact[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>();
  useEffect(() => {
    (async () => {
      const contacts = await getContacts();
      setContacts(contacts);
    })();
  }, []);
  const insets = useSafeAreaInsets();
  const dynamicStyle = StyleSheet.create({
    contactList: {
      paddingBottom: insets.bottom + 20,
    },
  });

  return (
    <>
      <View style={styles.headingView} collapsable={false}>
        <StyledText style={styles.heading}>Contacts</StyledText>
        <StyledTextInput
          style={styles.searchBar}
          onChangeText={(text) => setSearchTerm(text)}
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
        contentContainerStyle={dynamicStyle.contactList}
        renderItem={({ item }) => (
          <Card styles={styles.cards}>
            <StyledText>
              <Ionicons name={"search"} size={24} />
            </StyledText>
            <Pressable
              onPress={() =>
                router.replace(`/chat/${item.number}?id=${item.id}`)
              }
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
    </>
  );
}
const styles = StyleSheet.create({
  phoneNumber: {
    fontSize: 14,
    fontWeight: 300,
    marginVertical: 4,
  },
  cardContent: {
    flex: 0,
    marginVertical: 4,
  },
  cards: {
    flex: 0,
    marginHorizontal: 12,
    flexDirection: "row",
    padding: 8,
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
  headingView: {
    flex: 1,
    marginTop: 42,
    marginHorizontal: 16,
  },
  heading: {
    fontSize: 36,
    fontWeight: 600,
    zIndex: 5,
  },
});
