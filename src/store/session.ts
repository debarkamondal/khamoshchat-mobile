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
  iKey: Uint8Array;
  preKey: Uint8Array;
  isRegistered: boolean;
  initSession: (phone: {
    countryCode: string;
    number: number;
  }) => Promise<{ iKey: Uint8Array; preKey: Uint8Array }>;
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
      iKey: new Uint8Array(),
      preKey: new Uint8Array(),

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
              iKey: new Uint8Array(),
              preKey: new Uint8Array(),
            };
          }
        });
      },
      initSession: async (phone) => {
        await deleteItemAsync("otks");
        const iKey = await LibsignalDezireModule.genSecret()
        const preKey = await LibsignalDezireModule.genSecret();
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
                iKey,
                preKey,
              };
            }
          });
        }
        return {
          iKey,
          preKey,
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
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as object),
        } as Session;

        if (merged.iKey && !(merged.iKey instanceof Uint8Array)) {
          merged.iKey = new Uint8Array(Object.values(merged.iKey));
        }

        if (merged.preKey && !(merged.preKey instanceof Uint8Array)) {
          merged.preKey = new Uint8Array(Object.values(merged.preKey));
        }

        return merged;
      },
    },
  ),
);

export default useSession;
