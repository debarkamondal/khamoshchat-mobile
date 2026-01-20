import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import StyledText from "../components/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import StyledTextInput from "../components/StyledTextInput";
import Card from "../components/Card";
import { getContacts, SplitContact } from "../hooks/getContacts";
import { Link, router } from "expo-router";

export default function Contacts() {
  const [contacts, setContacts] = useState<SplitContact[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>();
  useEffect(() => {
    (async () => {
      const contacts = await getContacts();
      setContacts(
        contacts && contacts?.length > 0
          ? contacts
          : [
            {
              firstName: "test",
              id: "F57C8277-585D-4327-88A6-B5689FF69DFE-0",
              label: "home",
              lastName: "Haro",
              number: "555-522-8243",
            },
            {
              firstName: "Daniel",
              id: "AB211C5F-9EC9-429F-9466-B9382FF61035-0",
              label: "home",
              lastName: "Higgins",
              number: "555-478-7672",
            },
            {
              firstName: "Daniel",
              id: "AB211C5F-9EC9-429F-9466-B9382FF61035-1",
              label: "mobile",
              lastName: "Higgins",
              number: "(408) 555-5270",
            },
            {
              firstName: "Daniel",
              id: "AB211C5F-9EC9-429F-9466-B9382FF61035-2",
              label: "home fax",
              lastName: "Higgins",
              number: "(408) 555-3514",
            },
            {
              firstName: "David",
              id: "E94CD15C-7964-4A9B-8AC4-10D7CFB791FD-0",
              label: "home",
              lastName: "Taylor",
              number: "555-610-6679",
            },
            {
              firstName: "Hank",
              id: "2E73EE73-C03F-4D5F-B1E8-44E85A70F170-0",
              label: "work",
              lastName: "Zakroff",
              number: "(555) 766-4823",
            },
            {
              firstName: "Hank",
              id: "2E73EE73-C03F-4D5F-B1E8-44E85A70F170-1",
              label: "other",
              lastName: "Zakroff",
              number: "(707) 555-1854",
            },
            {
              firstName: "John",
              id: "410FE041-5C4E-48DA-B4DE-04C15EA3DBAC-0",
              label: "mobile",
              lastName: "Appleseed",
              number: "888-555-5512",
            },
            {
              firstName: "John",
              id: "410FE041-5C4E-48DA-B4DE-04C15EA3DBAC-1",
              label: "home",
              lastName: "Appleseed",
              number: "888-555-1212",
            },
            {
              firstName: "Kate",
              id: "177C371E-701D-42F8-A03B-C61CA31627F6-0",
              label: "mobile",
              lastName: "Bell",
              number: "+91 5555-648583",
            },
            {
              firstName: "Kate",
              id: "177C371E-701D-42F8-A03B-C61CA31627F6-1",
              label: "main",
              lastName: "Bell",
              number: "(415) 555-3695",
            },
          ],
      );
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
