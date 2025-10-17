import { create } from "zustand";
import { setItem, getItem, deleteItemAsync } from "expo-secure-store";
import { createJSONStorage, persist } from "zustand/middleware";
import { ed25519 } from "@noble/curves/ed25519.js";
import { Alert } from "react-native";

type Session = {
  phone: {
    countryCode: string;
    number: number;
  };
  image: string;
  iKey: { private: Uint8Array; public: Uint8Array };
  preKey: { private: Uint8Array; public: Uint8Array };
  isRegistered: boolean;
  initSession: (phone: {
    countryCode: string;
    number: number;
  }) => Promise<{ private: Uint8Array; public: Uint8Array }>;
  clearSession: () => Promise<void>;
  markSessionRegistered: () => void;
  markSessionUnregistered: () => void;
};
const useSession = create(
  persist<Session>(
    (set) => ({
      phone: {
        countryCode: "+91",
        number: 0,
      },
      image: "",
      isRegistered: false,
      iKey: { private: new Uint8Array(), public: new Uint8Array() },
      preKey: { private: new Uint8Array(), public: new Uint8Array() },

      markSessionUnregistered: () => {
        set((state) => {
          return {
            ...state,
            isRegistered: false,
          };
        });
      },
      markSessionRegistered: () => {
        set((state) => {
          return {
            ...state,
            isRegistered: true,
          };
        });
      },
      clearSession: async () => {
        set((state) => {
          {
            return {
              ...state,
              otks: [],
              isRegistered: false,
              phone: { countryCode: "", number: 0 },
              iKey: { public: new Uint8Array(), private: new Uint8Array() },
              preKey: { public: new Uint8Array(), private: new Uint8Array() },
            };
          }
        });
      },
      initSession: async (phone) => {
        await deleteItemAsync("otks");
        const iKey = ed25519.keygen();
        const preKey = ed25519.keygen();
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
                iKey: {
                  public: iKey.publicKey,
                  private: iKey.secretKey,
                },
                preKey: {
                  public: preKey.publicKey,
                  private: preKey.secretKey,
                },
              };
            }
          });
        }
        return {
          public: iKey.publicKey,
          private: iKey.secretKey,
        };
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
