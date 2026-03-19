# @dezire/expo-google-native-oauth

Native Google Sign-In for Expo apps using **GIDSignIn** (iOS) and **CredentialManager** (Android).

## Installation

```bash
bun add @dezire/expo-google-native-oauth
# or
npm install @dezire/expo-google-native-oauth
```

After installing, rebuild your native project:

```bash
npx expo prebuild
```

---

## Google Cloud Console Setup

You need three OAuth 2.0 Client IDs from the [Google Cloud Console](https://console.cloud.google.com/):

| Type | Used for |
|---|---|
| **Android** | Identifies your Android app |
| **iOS** | Identifies your iOS app |
| **Web application** | Signs tokens for your backend server (`webClientId`) |

> [!IMPORTANT]
> The **Web application** Client ID is what makes the ID token verifiable on your backend. Without it you will get `InvalidAudience` errors.

---

## Configuration

Add the plugin to your `app.json` or `app.config.ts`:

```json
{
  "plugins": [
    [
      "@dezire/expo-google-native-oauth",
      {
        "androidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
        "iosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
        "webClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
      }
    ]
  ]
}
```

Or with environment variables in `app.config.ts`:

```typescript
export default {
  plugins: [
    [
      "@dezire/expo-google-native-oauth",
      {
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      },
    ],
  ],
};
```

The config plugin automatically handles:
- Setting `GIDClientID` and `GIDWebClientID` in iOS `Info.plist`
- Setting the reverse-client-ID URL scheme in `CFBundleURLTypes`
- Injecting Android Client ID metadata into `AndroidManifest.xml`

---

## JavaScript API

```typescript
import * as GoogleAuth from '@dezire/expo-google-native-oauth';
```

### `signIn(options?)`

Triggers the native Google Sign-In flow and returns user credentials.

```typescript
try {
  const result = await GoogleAuth.signIn();
  console.log(result.idToken);     // JWT to send to backend
  console.log(result.email);
  console.log(result.displayName);
  console.log(result.avatarUrl);
} catch (e) {
  // Handle error
}
```

**With extra scopes:**

```typescript
const result = await GoogleAuth.signIn({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});
```

### `signOut()`

Signs the user out and clears credentials.

```typescript
await GoogleAuth.signOut();
```

### `isAvailable()`

Returns `true` if the native module is available on the current platform.

```typescript
if (GoogleAuth.isAvailable()) {
  // proceed with sign in
}
```

---

## Return Type

```typescript
type GoogleSignInResult = {
  idToken: string | null;       // JWT — send this to your backend
  googleUserId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};
```

---

## Error Codes

| Code | Description |
|---|---|
| `ERR_GOOGLE_AUTH_CANCELLED` | User dismissed the sign-in dialog |
| `ERR_GOOGLE_AUTH_UNAVAILABLE` | No active Android Activity or React context found |
| `ERR_GOOGLE_AUTH_CONFIGURATION` | Missing `webClientId` — check plugin config |
| `ERR_GOOGLE_AUTH_FAILED` | Generic sign-in failure (see error message for details) |
| `ERR_GOOGLE_AUTH_NO_VIEW_CONTROLLER` | iOS: no root view controller found |
| `ERR_GOOGLE_AUTH_CONFIG` | iOS: `GIDClientID` missing from `Info.plist` |

---

## Platform Requirements

| Platform | Minimum Version |
|---|---|
| iOS | 15.1 |
| Android | API 24 (Android 7.0) |

---

## License

MIT — Debarka Mondal
