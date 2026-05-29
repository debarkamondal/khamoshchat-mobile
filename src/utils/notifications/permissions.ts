import * as Notifications from 'expo-notifications';

/**
 * Requests push notification permissions from the user.
 * On Android 12 and below, this is usually automatically granted.
 * On Android 13+ and iOS, this will prompt the user.
 */
export async function requestNotificationPermission(): Promise<Notifications.PermissionStatus> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus;
}

