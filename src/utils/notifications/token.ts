import * as Notifications from 'expo-notifications';
import useSession from '@/src/store/useSession';
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { toBase64, toBytes } from "@/src/utils/helpers/encoding";

/**
 * Retrieves the raw FCM or APNs device push token.
 * This does NOT use the Expo push token relay service.
 */
export async function fetchDeviceToken(): Promise<string | null> {
  try {
    // Explicitly getting the device push token, not ExpoPushToken
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get device push token:', error);
    return null;
  }
}

export async function registerTokenWithBackend(
  deviceToken: string,
  platform: 'ios' | 'android'
): Promise<boolean> {
  const session = useSession.getState();
  const phoneStr = `${session.phone.countryCode}${session.phone.number}`;

  // Create signature using Identity Key over the device token
  let signatureStr = "";
  let vrfStr = "";

  if (session.iKey && session.iKey.byteLength > 0) {
    try {
      const fcmBytes = toBytes(deviceToken);
      const { signature, vrf } = await LibsignalDezireModule.vxeddsaSign(session.iKey, fcmBytes);
      signatureStr = toBase64(signature);
      vrfStr = toBase64(vrf);
    } catch (e) {
      console.error("[Push Token] Failed to sign FCM token", e);
    }
  }

  const payload = {
    phone: phoneStr,
    fcmToken: deviceToken,
    signature: signatureStr,
    vrf: vrfStr
  };
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://kchat.dkmondal.in";

  console.log('[Push Token] Registering token with backend:', JSON.stringify(payload, null, 2));

  const { success } = await fetchWithBackoff(`${apiUrl}/register/device/fcm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return success;
}

/**
 * Unregisters the token from the backend, typically called on logout.
 */
export async function unregisterTokenFromBackend(deviceToken: string): Promise<boolean> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://kchat.dkmondal.in";

  const { success } = await fetchWithBackoff(`${apiUrl}/unregister/device/fcm`, {
    method: "POST", // Adjust to actual endpoint semantics
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      device_token: deviceToken,
    })
  });

  return success;
}

/**
 * Wrapper for network calls involving FCM keys to survive connectivity drops when foregrounding
 */
async function fetchWithBackoff(url: string, options: RequestInit, maxRetries = 5) {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return { success: true, response };
      }
      console.warn(`[Token API] Non-OK response (${response.status}) on attempt ${attempt + 1}:`, await response.text());
    } catch (error) {
      console.warn(`[Token API] Network error on attempt ${attempt + 1}:`, error);
    }

    attempt++;
    if (attempt < maxRetries) {
      const jitter = Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      delay = Math.min(delay * 2, 10000); // capped at 10s
    }
  }

  console.error(`[Token API] Failed to reach ${url} after ${maxRetries} attempts`);
  return { success: false };
}

