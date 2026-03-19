import ExpoGoogleNativeOauthModule from './ExpoGoogleNativeOauthModule';
import { SignInOptions, GoogleSignInResult } from './ExpoGoogleNativeOauth.types';

/**
 * Checks if the Google Auth native module is available on the device.
 */
export function isAvailable(): boolean {
  return ExpoGoogleNativeOauthModule.isAvailable();
}

/**
 * Initiates the Google native sign-in flow.
 * 
 * @param options Optional configuration including `scopes` for additional authorization.
 * @returns A promise resolving to the Google sign-in payload with the user's ID token.
 */
export async function signIn(options?: SignInOptions): Promise<GoogleSignInResult> {
  return await ExpoGoogleNativeOauthModule.signIn(options || {});
}

/**
 * Signs the user out of the current Google session, dropping credentials.
 */
export async function signOut(): Promise<void> {
  return await ExpoGoogleNativeOauthModule.signOut();
}

export { SignInOptions, GoogleSignInResult };
