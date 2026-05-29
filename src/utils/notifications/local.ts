import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Initializes notification categories and channels.
 * Must be called as early as possible on app startup.
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    // High importance needed to display notifications clearly
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFCC00', 
      showBadge: true,
    });
  }
}

/**
 * Present a local notification representing a decrypted message.
 */
export async function showMessageNotification(sender: string, body: string, data: Record<string, any> = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Message from ${sender}`, // Potentially look up friendly name
      body: body,
      data: { sender, ...data },      // Passes the data along to tap handler
      sound: true,                    // Default notification sound
    },
    trigger: null,                    // Null triggers immediately
  });
}

