/**
 * MQTT transport utilities.
 * Handles message publishing and topic construction.
 */

import MqttClient from '@ecodevstack/react-native-mqtt-client';

/**
 * Builds an MQTT topic for sending messages.
 * Format: /khamoshchat/<recipient>/<sender>
 */
export function buildTopic(sender: string, recipient: string): string {
    return `/khamoshchat/${encodeURIComponent(recipient)}/${encodeURIComponent(sender)}`;
}

/**
 * Publishes a message payload to an MQTT topic.
 */
export function publishMessage(
    topic: string,
    payload: object
): void {
    // Native MQTT client expects message as string
    MqttClient.publish(topic, JSON.stringify(payload), 0);
}

/**
 * Publishes a message to a recipient.
 * Convenience function that combines topic building and publishing.
 */
export function sendToRecipient(
    sender: string,
    recipient: string,
    payload: object
): void {
    const topic = buildTopic(sender, recipient);
    publishMessage(topic, payload);
}
