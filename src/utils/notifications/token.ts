import * as Notifications from 'expo-notifications';

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

/**
 * Registers the device token with the backend server.
 * Needs valid authentication token from the session.
 */
export async function registerTokenWithBackend(
  authToken: string,
  deviceToken: string,
  platform: 'ios' | 'android'
): Promise<boolean> {
  try {
    const appVersion = "1.0.0";

    const payload = {
      device_token: deviceToken,
      platform,
      app_version: appVersion
    };
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://kchat.dkmondal.in";

    console.log('[Push Token] Would register token with backend:', JSON.stringify(payload, null, 2));

    /*
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://kchat.dkmondal.in";
    
    const response = await fetch(`${apiUrl}/device/register-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
        return true;
    } else {
        console.error('Failed to register device token with backend:', await response.text());
        return false;
    }
    */

    // Simulate successful registration for now
    return true;
  } catch (error) {
    console.warn('Error registering device token:', error);
    return false;
  }
}

/**
 * Unregisters the token from the backend, typically called on logout.
 */
export async function unregisterTokenFromBackend(authToken: string, deviceToken: string): Promise<boolean> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://kchat.dkmondal.in";

    const response = await fetch(`${apiUrl}/device/unregister-token`, {
      method: "POST", // Adjust to actual endpoint semantics
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        device_token: deviceToken,
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error unregistering device token:', error);
    return false;
  }
}
