export type SignInOptions = {
  /**
   * Additional OAuth scopes to request during sign-in.
   * By default, Google SDK requests basic profile and email.
   * For further access (such as Drive or Calendar), add the proper scopes here.
   */
  scopes?: string[];
};

export type GoogleSignInResult = {
  /**
   * The JWT ID token to send to your backend.
   */
  idToken: string | null;
  /**
   * The user's Google ID.
   */
  googleUserId: string;
  /**
   * The user's email address.
   */
  email: string | null;
  /**
   * The user's display name.
   */
  displayName: string | null;
  /**
   * The URL to the user's Google profile picture.
   */
  avatarUrl: string | null;
};
