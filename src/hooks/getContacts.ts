import * as Contacts from "expo-contacts";

type SplitContact = {
  id: string;
  firstName: string;
  lastName: string | undefined;
  label: string;
  number: string;
  // digits: string;
};
const getContacts = async (): Promise<SplitContact[] | null> => {
  const splitContacts: SplitContact[] = [];
  const { status } = await Contacts.requestPermissionsAsync();
  if (status === "granted") {
    const { data } = await Contacts.getContactsAsync({
      fields: ["firstName", "lastName", "phoneNumbers"],
      sort: "firstName",
    });
    for (let i = 0; i < data.length; i++) {
      // Check for both undefined and null, and ensure it's an array
      const contact = data[i];

      if (
        contact.phoneNumbers &&
        contact.phoneNumbers.length !== undefined &&
        contact.phoneNumbers.length > 0
      ) {
        for (
          let j = 0;
          data[i].phoneNumbers && j < contact.phoneNumbers.length;
          j++
        ) {
          const numbers = contact.phoneNumbers[j];
          if (!numbers.number) continue;
          splitContacts.push({
            firstName: contact.firstName ?? (numbers.number as string),
            lastName: contact.lastName,
            id: contact.id + "-" + j,
            number: numbers.number,
            label: numbers.label,
          });
        }
      }
    }
  }
  return splitContacts;
};

export { getContacts, SplitContact };
