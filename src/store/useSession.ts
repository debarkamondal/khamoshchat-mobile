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
  devKey: Uint8Array;
  isAuthenticated: boolean;
  authProvider: AuthProvider;
  googleOauthToken: string | null;
  userId: string | null;
  deviceId: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  pushToken: string | null;
  pushTokenRegistered: boolean;
  setPushToken: (token: string | null) => void;
  setPushTokenRegistered: (registered: boolean) => void;
  initSession: (phone: PhoneIdentity) => Promise<{ iKey: Uint8Array; preKey: Uint8Array; devKey: Uint8Array }>;
  clearSession: () => Promise<void>;
  markDeviceRegistered: (deviceId: string) => void;
  setAuthenticatedUser: (payload: {
    token: string;
    userId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  }) => void;

};

const useSession = create(
  persist<Session>(
    (set) => ({
      phone: {
        countryCode: "+91",
        number: 0,
      },
      isAuthenticated: false,
      authProvider: null,
      googleOauthToken: null,
      userId: null,
      deviceId: null,
      email: null,
      displayName: null,
      avatarUrl: null,
      pushToken: null,
      pushTokenRegistered: false,
      iKey: new Uint8Array(),
      preKey: new Uint8Array(),
      devKey: new Uint8Array(),

      setPushToken: (token) => {
        set({ pushToken: token });
      },
      setPushTokenRegistered: (registered) => {
        set({ pushTokenRegistered: registered });
      },
      markDeviceRegistered: (deviceId) => {
        set({ isAuthenticated: true, deviceId });
      },
      setAuthenticatedUser: ({ token, userId, email, displayName, avatarUrl }) => {
        set({
          isAuthenticated: false,
          authProvider: "google",
          googleOauthToken: token,
          userId,
          email,
          displayName,
          avatarUrl,
        });
      },

      clearSession: async () => {
        set({
          isAuthenticated: false,
          authProvider: null,
          googleOauthToken: null,
          userId: null,
          deviceId: null,
          email: null,
          displayName: null,
          avatarUrl: null,
          pushTokenRegistered: false,
          phone: { countryCode: "", number: 0 },
          iKey: new Uint8Array(),
          preKey: new Uint8Array(),
          devKey: new Uint8Array(),
        });
      },
      initSession: async (phone) => {
        await deleteItemAsync("opks");
        const iKey = await LibsignalDezireModule.genSecret();
        const preKey = await LibsignalDezireModule.genSecret();
        const devKey = await LibsignalDezireModule.genSecret();
        if (!iKey || !preKey || !devKey) {
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
            devKey,
          });
        }
        return {
          iKey,
          preKey,
          devKey,
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

        if (merged.devKey && !(merged.devKey instanceof Uint8Array)) {
          merged.devKey = new Uint8Array(Object.values(merged.devKey));
        } else if (!merged.devKey) {
          merged.devKey = new Uint8Array();
        }

        merged.isAuthenticated = Boolean(merged.googleOauthToken && merged.userId && merged.deviceId);
        merged.authProvider = merged.authProvider ?? null;
        merged.email = merged.email ?? null;
        merged.displayName = merged.displayName ?? null;
        merged.avatarUrl = merged.avatarUrl ?? null;
        merged.deviceId = merged.deviceId ?? null;
        merged.pushToken = merged.pushToken ?? null;
        merged.pushTokenRegistered = merged.pushTokenRegistered ?? false;

        return merged;
      },
    },
  ),
);

export default useSession;
