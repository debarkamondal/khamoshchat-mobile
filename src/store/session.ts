import { create } from "zustand";
import { setItem, getItem, deleteItemAsync } from "expo-secure-store";
import { createJSONStorage, persist } from "zustand/middleware";
import { Alert } from "react-native";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

type Session = {
  phone: {
    countryCode: string;
    number: number;
  };
  image: string;
  iKey: { secret: Uint8Array; public: Uint8Array };
  preKey: { secret: Uint8Array; public: Uint8Array };
  isRegistered: boolean;
  initSession: (phone: {
    countryCode: string;
    number: number;
  }) => Promise<{ secret: Uint8Array; public: Uint8Array }>;
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
      isRegistered: true,
      iKey: { secret: new Uint8Array(), public: new Uint8Array() },
      preKey: { secret: new Uint8Array(), public: new Uint8Array() },

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
              iKey: { public: new Uint8Array(), secret: new Uint8Array() },
              preKey: { public: new Uint8Array(), secret: new Uint8Array() },
            };
          }
        });
      },
      initSession: async (phone) => {
        await deleteItemAsync("otks");
        const iKey = await LibsignalDezireModule.genKeyPair()
        const preKey = await LibsignalDezireModule.genKeyPair();
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
                  public: iKey.public,
                  secret: iKey.secret,
                },
                preKey: {
                  public: preKey.public,
                  secret: preKey.secret,
                },
              };
            }
          });
        }
        return {
          public: iKey.public,
          secret: iKey.secret,
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
