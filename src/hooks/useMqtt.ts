// TODO: switch to npm import once published: import MqttClient from 'expo-native-mqtt';
import MqttClient from "expo-native-mqtt";
import { useEffect } from "react";
import { Alert } from "react-native";
import useMqttStore from "@/src/store/useMqttStore";
import useSession, { Session } from "@/src/store/useSession";
import { processIncomingMessage } from "@/src/utils/messaging";
import {
    saveToInbox,
    markInboxProcessed,
    incrementInboxRetry,
    getPendingInboxEntries,
} from "@/src/utils/storage";

/**
 * Processes a single inbox entry.
 * On failure, increments its retry counter (auto-fails after MAX_RETRIES).
 */
async function processInboxEntry(
    session: Session,
    entry: { id: number; topic: string; payload: string }
): Promise<void> {
    try {
        await processIncomingMessage(session, entry.topic, entry.payload);
        await markInboxProcessed(entry.id);
    } catch (e) {
        console.error(`Failed to process inbox entry ${entry.id}:`, e);
        await incrementInboxRetry(entry.id);
    }
}

/**
 * Retries all pending inbox entries.
 * Call this on app foreground resume.
 */
export async function processInboxRetries(session: Session): Promise<void> {
    try {
        const pending = await getPendingInboxEntries();
        for (const entry of pending) {
            await processInboxEntry(session, entry);
        }
    } catch (e) {
        console.error('Failed to process inbox retries:', e);
    }
}

const useMqtt = (topic: string) => {
    const setClient = useMqttStore(s => s.setClient);
    const setConnected = useMqttStore(s => s.setConnected);
    const session = useSession();

    useEffect(() => {
        if (!topic) return;

        let subscriptions: { remove: () => void }[] = [];

        const initMqtt = async () => {
            try {
                // 1. Handle Messages — ciphertext-first: save raw payload to inbox
                //    BEFORE any crypto, because CocoaMQTT auto-ACKs QoS 1 and the
                //    broker will never redeliver if our processing fails.
                const messageSub = MqttClient.addListener(
                    "onMqttMessageReceived",
                    async (data: { topic: string; payload: string }) => {
                        let inboxId: number | null = null;
                        try {
                            // Step 1: Save raw ciphertext to inbox (fast, no crypto)
                            inboxId = await saveToInbox(data.topic, data.payload);

                            // Step 2: Attempt full processing
                            await processIncomingMessage(session, data.topic, data.payload);

                            // Step 3: Mark as done
                            await markInboxProcessed(inboxId);
                        } catch (e) {
                            console.error("Failed to process MQTT message:", e);
                            // Entry stays 'pending' in inbox — will be retried on next
                            // app foreground via processInboxRetries()
                        }
                    }
                );
                subscriptions.push(messageSub);

                // 2. Handle Connection/Error Events
                const connectSub = MqttClient.addListener("onMqttConnected", async () => {
                    console.log(`Connected to MQTT broker for topic: ${topic}`);
                    setConnected(true);

                    const topicPath = `/khamoshchat/${encodeURIComponent(topic)}/#`;
                    try {
                        await MqttClient.subscribe(topicPath, 1);
                        console.log(`Subscribed to ${topicPath}`);
                    } catch (e) {
                        console.error(`Failed to subscribe to ${topicPath}:`, e);
                    }
                });
                subscriptions.push(connectSub);

                const disconnectSub = MqttClient.addListener("onMqttDisconnected", () => {
                    console.log("MQTT Client disconnected.");
                    setConnected(false);
                });
                subscriptions.push(disconnectSub);

                const errorSub = MqttClient.addListener("onMqttError", (err: unknown) => {
                    console.error("MQTT Error:", err);
                });
                subscriptions.push(errorSub);

                // 3. Connect
                const clientId = `khamoshchat-${session.phone.countryCode.replace('+', '')}-${session.phone.number}`;
                await MqttClient.connect(
                    `${process.env.EXPO_PUBLIC_MQTT_URL}`,
                    "dezire",
                    "test1234",
                    {
                        clientId,
                        cleanSession: false,
                        autoReconnect: true,
                        reconnectDelay: 5000,
                    }
                );
                setClient(MqttClient);

            } catch (error) {
                console.error("MQTT Connection Error:", error);
                Alert.alert(
                    "Error",
                    "Couldn't connect to the messaging server.",
                    [{ text: "OK", style: 'cancel' }]
                );
            }
        };

        initMqtt();

        return () => {
            subscriptions.forEach(sub => sub.remove());
            MqttClient.disconnect();
            setConnected(false);
            setClient(undefined);
        };
    }, [topic, session, setClient, setConnected]);
};

export default useMqtt;
