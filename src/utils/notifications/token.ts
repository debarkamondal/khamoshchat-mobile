import * as Notifications from 'expo-notifications';
import useSession from '@/src/store/useSession';
import { apiRequest, ApiError } from '@/src/utils/transport/api';

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

async function apiRequestWithBackoff<T>(
  path: string,
  options: any,
  maxRetries = 5
): Promise<T> {
  let attempt = 0;
  let delay = 1000;
  while (attempt < maxRetries) {
    try {
      return await apiRequest<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw error;
      }
      attempt++;
      if (attempt >= maxRetries) throw error;
      const jitter = Math.random() * 500;
      await new Promise(r => setTimeout(r, delay + jitter));
      delay = Math.min(delay * 2, 10000);
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts`);
}

export async function registerTokenWithBackend(
  deviceToken: string
): Promise<boolean> {
  const session = useSession.getState();
  try {
    await apiRequestWithBackoff("/register/device/fcm", {
      method: "POST",
      authenticated: true,
      body: {
        device_id: session.deviceId,
        fcmToken: deviceToken,
      },
    });
    return true;
  } catch (e) {
    console.error("[Push Token] Failed to register FCM token:", e);
    return false;
  }
}
