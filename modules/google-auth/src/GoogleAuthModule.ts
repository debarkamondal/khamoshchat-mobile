import { NativeModule, requireNativeModule } from "expo";

import type { GoogleSignInResult } from "./GoogleAuth.types";

type GoogleAuthModuleShape = NativeModule & {
  isAvailable(): Promise<boolean>;
  signIn(): Promise<GoogleSignInResult>;
  signOut(): Promise<void>;
};


const GoogleAuthModule = requireNativeModule<GoogleAuthModuleShape>("GoogleAuth");

export default GoogleAuthModule;
