// TODO: switch to npm import once published: import MqttClient from 'expo-native-mqtt';
import MqttClient from "expo-native-mqtt";
import { useEffect } from "react";
import { Alert } from "react-native";
import useMqttStore from "@/src/store/useMqttStore";
import useSession from "@/src/store/useSession";
import { X3DHBundle, initReceiver, decryptMessage, getIdentityKey } from "@/src/utils/crypto";
import { receiveInitialMessage, receiveMessage } from "@/src/utils/messaging";

const useMqtt = (topic: string) => {
    const setClient = useMqttStore(s => s.setClient);
    const setConnected = useMqttStore(s => s.setConnected);
    const session = useSession();

    useEffect(() => {
        if (!topic) return;

        let subscriptions: { remove: () => void }[] = [];

        const initMqtt = async () => {
            try {
                // 1. Handle Messages
                const messageSub = MqttClient.addListener("onMqttMessageReceived", async (data: { topic: string; payload: string }) => {
                    try {
                        const parsedMessage = JSON.parse(data.payload);
                        const payload = parsedMessage as X3DHBundle & { ciphertext: string; header: string };


                        // Extract sender from topic: /khamoshchat/<recipient>/<sender>
                        const topicParts = data.topic.split('/');
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
                });
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

                const errorSub = MqttClient.addListener("onMqttError", (err: any) => {
                    console.error("MQTT Error:", err);
                });
                subscriptions.push(errorSub);

                // 3. Connect (port 8883 for SSL)
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
    }, [topic, session.isRegistered, session.preKey, session.iKey, session.phone, setClient, setConnected]);
};

export default useMqtt;
