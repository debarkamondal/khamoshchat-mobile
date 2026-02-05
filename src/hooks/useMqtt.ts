import mqtt, { MqttClient } from "mqtt";
import { useEffect } from "react";
import { Alert } from "react-native";
import useMqttStore from "@/src/store/mqtt";
import useSession from "@/src/store/session";
import { X3DHBundle } from "@/src/utils/x3dh";
import { receiveInitialMessage, receiveMessage } from "@/src/utils/messages";
import { initReceiver, decryptMessage, getIdentityKey } from "@/src/utils/ratchet";
import { Buffer } from "buffer";

const useMqtt = (topic: string) => {
    const { setClient } = useMqttStore();
    const session = useSession();

    useEffect(() => {
        if (!topic) return;

        let mqttClient: MqttClient;

        try {
            // Using wss and port 8084
            mqttClient = mqtt.connect("wss://broker.emqx.io/mqtt", {
                port: 8084,
                protocol: "wss",
                protocolVersion: 5,
                connectTimeout: 5000,
                clientId: `khamosh_chat_${Math.random().toString(16).slice(2, 8)}`, // Unique client ID
                clean: true, // Clean session
            });

            // 1. Handle Connection
            mqttClient.on("connect", () => {
                console.log(`Connected to MQTT broker for topic: ${topic}`);
                const topicPath = `/khamoshchat/${encodeURIComponent(topic)}/#`;

                mqttClient.subscribe(topicPath, (err) => {
                    if (err) {
                        console.error("Subscription error:", err);
                        Alert.alert(
                            "Error",
                            "Couldn't connect to the server. Please check your internet connection.",
                            [{ text: "OK", style: 'cancel' }]
                        );
                    }
                });
            });

            // 2. Handle Errors
            mqttClient.on("error", (err) => {
                console.error("MQTT Error:", err);
            });

            // 3. Handle Messages
            const handleMessage = async (msgTopic: string, message: Buffer) => {
                try {
                    const parsedMessage = JSON.parse(message.toString());
                    const payload = parsedMessage as X3DHBundle & { ciphertext: string; header: string };

                    // Extract sender from topic: /khamoshchat/<recipient>/<sender>
                    const topicParts = msgTopic.split('/');
                    const senderPhone = topicParts.length >= 4 ? decodeURIComponent(topicParts[3]) : null;

                    if (senderPhone && payload.identityKey && payload.ephemeralKey && payload.opkId !== undefined) {
                        if (session.isRegistered) {
                            await receiveInitialMessage({
                                session,
                                payload,
                                senderPhone,
                                initReceiver: (sharedSecret, receiverPriv, receiverPub, identityKey) =>
                                    initReceiver(senderPhone, sharedSecret, receiverPriv, receiverPub, identityKey),
                                decrypt: (header, ciphertext, ad) =>
                                    decryptMessage(senderPhone, header, ciphertext, ad)
                            });
                        }
                    } else if (senderPhone && payload.ciphertext && payload.header) {
                        // Subsequent message
                        const identityKey = await getIdentityKey(senderPhone);
                        if (identityKey) {
                            await receiveMessage({
                                session,
                                payload,
                                senderPhone,
                                senderIdentityKey: identityKey,
                                decrypt: (header, ciphertext, ad) => decryptMessage(senderPhone, header, ciphertext, ad)
                            })
                        }
                    }
                } catch (e) {
                    console.error("Global Handler - Error processing message:", e);
                }
            };

            mqttClient.on("message", handleMessage);

            // Update Global Store
            setClient(mqttClient);

        } catch (error) {
            console.error("MQTT Connection Error:", error);
        }

        return () => {
            if (mqttClient) {
                mqttClient.end();
            }
        };
    }, [topic, session, setClient]);
};

export default useMqtt;
