import { create } from "zustand";
import { setItem, getItem, deleteItemAsync } from "expo-secure-store";
import { createJSONStorage, persist } from "zustand/middleware";
import { ed448 } from "@noble/curves/ed448.js";
import { Alert } from "react-native";

type Session = {
  phone: {
    countryCode: string;
    number: number;
  };
  image: string;
  identityKey: Uint8Array[];
  preKey: Uint8Array[];
  isRegistered: boolean;
  // updateImage: (url)=> void
  // updateSignedPreKey: (url)=> string
  createSession: (
    phone: { countryCode: string; number: number },
    image: string,
  ) => void;
};
const useSession = create(
  persist<Session>(
    (set) => ({
      phone: {
        countryCode: "+91",
        number: 0,
      },
      image: "",
      identityKey: [],
      preKey: [],
      isRegistered: false,

      createSession(phone) {
        const iKey = ed448.keygen();
        const preKey = ed448.keygen();
        if (!iKey && !preKey) {
          Alert.alert(
            "Error",
            "Something wrong happened. Couldn't initialize session",
            [
              {
                text: "OK",
                style: "cancel",
              },
            ],
          );
        } else {
          set((state) => {
            {
              return {
                ...state,
                phone,
                identityKey: [iKey.publicKey, iKey.secretKey],
                preKey: [iKey.publicKey, iKey.secretKey],
              };
            }
          });
        }
      },
    }),
    {
      name: "session",
      storage: createJSONStorage(() => ({
        setItem,
        getItem,
        removeItem: deleteItemAsync,
      })),
    },
  ),
);

export default useSession;
