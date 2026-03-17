import { NativeModule, requireNativeModule } from "expo";
import { Platform } from "react-native";

import type { GoogleSignInResult } from "./GoogleAuth.types";

type GoogleAuthModuleShape = NativeModule & {
  isAvailable(): Promise<boolean>;
  signIn(): Promise<GoogleSignInResult>;
  signOut(): Promise<void>;
};

const unsupportedModule = {
  isAvailable: async () => false,
  signIn: async () => {
    throw new Error("Google OAuth is only supported on Android in this build.");
  },
  signOut: async () => {
    throw new Error("Google OAuth is only supported on Android in this build.");
  },
} as unknown as GoogleAuthModuleShape;

const GoogleAuthModule =
  Platform.OS === "android"
    ? requireNativeModule<GoogleAuthModuleShape>("GoogleAuth")
    : unsupportedModule;

export default GoogleAuthModule;
