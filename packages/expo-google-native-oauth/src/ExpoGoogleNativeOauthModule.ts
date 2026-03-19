import { requireNativeModule } from 'expo-modules-core';

import { GoogleSignInResult, SignInOptions } from './ExpoGoogleNativeOauth.types';

declare class ExpoGoogleNativeOauthModule {
  isAvailable(): boolean;
  signIn(options: SignInOptions): Promise<GoogleSignInResult>;
  signOut(): Promise<void>;
}

let _module: ExpoGoogleNativeOauthModule | null = null;

function getModule(): ExpoGoogleNativeOauthModule {
  if (!_module) {
    _module = requireNativeModule<ExpoGoogleNativeOauthModule>('ExpoGoogleNativeOauth');
  }
  return _module;
}

export default {
  isAvailable: () => getModule().isAvailable(),
  signIn: (options: SignInOptions) => getModule().signIn(options),
  signOut: () => getModule().signOut(),
};
