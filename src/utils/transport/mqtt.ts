/**
 * MQTT transport utilities.
 * Handles message publishing and topic construction.
 */

// TODO: switch to npm import once published: import MqttClient from 'expo-native-mqtt';
import MqttClient from "expo-native-mqtt";

/**
 * Builds an MQTT topic for sending messages.
 * Format: /khamoshchat/<recipient>/<sender>
 */
export function buildTopic(sender: string, recipient: string): string {
    return `/khamoshchat/${encodeURIComponent(recipient)}/${encodeURIComponent(sender)}`;
}

/**
 * Publishes a message payload to an MQTT topic.
 * Returns true if publish succeeded, false on failure.
 */
export async function publishMessage(
    topic: string,
    payload: string
): Promise<boolean> {
    try {
        await MqttClient.publish(topic, payload, 1);
        return true;
    } catch (e) {
        console.error('MQTT publish failed:', e);
        return false;
    }
}

/**
 * Publishes a message to a recipient.
 * Convenience function that combines topic building and publishing.
 * Returns true if publish succeeded, false on failure.
 */
export async function sendToRecipient(
    sender: string,
    recipient: string,
    payload: object
): Promise<boolean> {
    const topic = buildTopic(sender, recipient);
    return publishMessage(topic, JSON.stringify(payload));
}

