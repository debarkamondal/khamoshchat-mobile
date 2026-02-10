/**
 * MQTT transport utilities.
 * Handles message publishing and topic construction.
 */

import { MqttClient } from 'mqtt';

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
    client: MqttClient,
    topic: string,
    payload: object
): void {
    client.publish(topic, JSON.stringify(payload));
}

/**
 * Publishes a message to a recipient.
 * Convenience function that combines topic building and publishing.
 */
export function sendToRecipient(
    client: MqttClient,
    sender: string,
    recipient: string,
    payload: object
): void {
    const topic = buildTopic(sender, recipient);
    publishMessage(client, topic, payload);
}
