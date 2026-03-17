export type GoogleSignInResult = {
  idToken: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  googleUserId: string | null;
};
