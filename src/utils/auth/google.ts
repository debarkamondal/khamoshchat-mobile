import { signIn as googleSignIn, signOut as googleSignOut, GoogleSignInResult } from "@dezire/expo-google-native-oauth";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { generateOpks } from "@/src/utils/crypto/oneTimePreKeys";
import useSession from "@/src/store/useSession";
import { toBase64 } from "@/src/utils/helpers/encoding";

export type AuthenticatedUser = {
  token: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export class GoogleAuthFlowError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GoogleAuthFlowError";
  }
}

function normalizeError(error: unknown): GoogleAuthFlowError {
  if (error instanceof GoogleAuthFlowError) {
    return error;
  }

  if (error instanceof Error) {
    const maybeCode = (error as Error & { code?: unknown }).code;
    return new GoogleAuthFlowError(
      typeof maybeCode === "string" ? maybeCode : "ERR_GOOGLE_AUTH_UNKNOWN",
      error.message,
    );
  }

  return new GoogleAuthFlowError(
    "ERR_GOOGLE_AUTH_UNKNOWN",
    "Something went wrong while signing in with Google.",
  );
}

export async function isGoogleSignInAvailable(): Promise<boolean> {
  return googleSignIn !== undefined;
}

export async function signOutFromGoogle(): Promise<void> {
  await googleSignOut();
}

export async function startGoogleSignIn(): Promise<AuthenticatedUser> {
  let nativeResult: GoogleSignInResult;

  try {
    nativeResult = await googleSignIn();
  } catch (error) {
    throw normalizeError(error);
  }

  return {
    token: nativeResult.idToken ?? "",
    userId: nativeResult.googleUserId ?? nativeResult.email ?? "unknown",
    email: nativeResult.email,
    displayName: nativeResult.displayName,
    avatarUrl: nativeResult.avatarUrl,
  };
}

export async function registerWithGoogleBackend(
  idToken: string,
  phoneDetails: { countryCode: string; number: number }
): Promise<void> {
  const session = useSession.getState();
  const { iKey, preKey } = await session.initSession(phoneDetails);

  const pubIKey = await LibsignalDezireModule.genPubKey(iKey);
  const pubPreKey = await LibsignalDezireModule.genPubKey(preKey);
  const { signature, vrf } = await LibsignalDezireModule.vxeddsaSign(iKey, pubPreKey);

  const b64IKey = toBase64(pubIKey);
  const b64Sign = toBase64(signature);
  const b64PreKey = toBase64(pubPreKey);
  const b64Vrf = toBase64(vrf);
  const b64Opks = await generateOpks();

  const payload = {
    phone: `${phoneDetails.countryCode}${phoneDetails.number}`,
    iKey: b64IKey,
    signedPreKey: b64PreKey,
    sign: b64Sign,
    vrf: b64Vrf,
    opks: b64Opks,
    id_token: idToken,
  };

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

  const res = await fetch(`${apiUrl}/register/google_oauth/id_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to register with Google Backend: HTTP ${res.status}`);
  }
}
