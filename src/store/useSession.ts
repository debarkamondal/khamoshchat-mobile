import { create } from "zustand";
import { setItemAsync, getItemAsync, deleteItemAsync, AFTER_FIRST_UNLOCK } from "expo-secure-store";
import { createJSONStorage, persist } from "zustand/middleware";
import { Alert } from "react-native";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

type PhoneIdentity = {
  countryCode: string;
  number: number;
};

type AuthProvider = "google" | null;

export type Session = {
  phone: PhoneIdentity;
  iKey: Uint8Array;
  preKey: Uint8Array;
  isRegistered: boolean;
  isAuthenticated: boolean;
  authProvider: AuthProvider;
  authToken: string | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  initSession: (phone: PhoneIdentity) => Promise<{ iKey: Uint8Array; preKey: Uint8Array }>;
  clearSession: () => Promise<void>;
  markSessionRegistered: () => void;
  markSessionUnregistered: () => void;
  setAuthenticatedUser: (payload: {
    token: string;
    userId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  }) => void;
  clearAuthenticatedUser: () => Promise<void>;
};

const useSession = create(
  persist<Session>(
    (set) => ({
      phone: {
        countryCode: "+91",
        number: 0,
      },
      isRegistered: false,
      isAuthenticated: false,
      authProvider: null,
      authToken: null,
      userId: null,
      email: null,
      displayName: null,
      avatarUrl: null,
      iKey: new Uint8Array(),
      preKey: new Uint8Array(),

      markSessionUnregistered: () => {
        set({ isRegistered: false });
      },
      markSessionRegistered: () => {
        set({ isRegistered: true });
      },
      setAuthenticatedUser: ({ token, userId, email, displayName, avatarUrl }) => {
        set({
          isAuthenticated: true,
          isRegistered: true,
          authProvider: "google",
          authToken: token,
          userId,
          email,
          displayName,
          avatarUrl,
        });
      },
      clearAuthenticatedUser: async () => {
        set({
          isAuthenticated: false,
          isRegistered: false,
          authProvider: null,
          authToken: null,
          userId: null,
          email: null,
          displayName: null,
          avatarUrl: null,
        });
      },
      clearSession: async () => {
        set({
          isRegistered: false,
          isAuthenticated: false,
          authProvider: null,
          authToken: null,
          userId: null,
          email: null,
          displayName: null,
          avatarUrl: null,
          phone: { countryCode: "", number: 0 },
          iKey: new Uint8Array(),
          preKey: new Uint8Array(),
        });
      },
      initSession: async (phone) => {
        await deleteItemAsync("opks");
        const iKey = await LibsignalDezireModule.genSecret();
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
          set({
            phone,
            iKey,
            preKey,
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
        setItem: (key: string, value: string) =>
          setItemAsync(key, value, { keychainAccessible: AFTER_FIRST_UNLOCK }),
        getItem: (key: string) => getItemAsync(key),
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

        merged.isAuthenticated = Boolean(merged.authToken && merged.userId);
        merged.isRegistered = merged.isRegistered || merged.isAuthenticated;
        merged.authProvider = merged.authProvider ?? null;
        merged.email = merged.email ?? null;
        merged.displayName = merged.displayName ?? null;
        merged.avatarUrl = merged.avatarUrl ?? null;

        return merged;
      },
    },
  ),
);

export default useSession;
