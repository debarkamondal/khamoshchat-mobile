import Mqtt from "@ecodevstack/react-native-mqtt-client";
import { useEffect } from "react";
import { Alert } from "react-native";
import useMqttStore from "@/src/store/useMqttStore";
import useSession from "@/src/store/useSession";
import { X3DHBundle, initReceiver, decryptMessage, getIdentityKey } from "@/src/utils/crypto";
import { receiveInitialMessage, receiveMessage } from "@/src/utils/messaging";

const useMqtt = (topic: string) => {
    const { setClient, setConnected } = useMqttStore();
    const session = useSession();

    useEffect(() => {
        if (!topic) return;

        let subscriptions: { remove: () => void }[] = [];

        const initMqtt = async () => {
            try {
                // 1. Handle Messages
                const messageSub = Mqtt.addListener("onMqttMessageReceived", async (data: { topic: string; message: string }) => {
                    try {
                        const parsedMessage = JSON.parse(data.message);
                        const payload = parsedMessage as X3DHBundle & { ciphertext: string; header: string };
                        
                        console.log("MQTT Received Message:", data.topic, payload);

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
                const connectSub = Mqtt.addListener("onMqttConnected", () => {
                    console.log(`Connected to MQTT broker for topic: ${topic}`);
                    setConnected(true);

                    const topicPath = `/khamoshchat/${encodeURIComponent(topic)}/#`;
                    Mqtt.subscribe(topicPath, 0);
                });
                subscriptions.push(connectSub);

                const disconnectSub = Mqtt.addListener("onMqttDisconnected", () => {
                    console.log("MQTT Client disconnected.");
                    setConnected(false);
                });
                subscriptions.push(disconnectSub);

                const errorSub = Mqtt.addListener("onMqttError", (err) => {
                    console.error("MQTT Error:", err);
                });
                subscriptions.push(errorSub);

                // 3. Connect (port 8883 for SSL)
                // Note: The library seems to expect a full broker URL
                console.log(`****************************************************${process.env.EXPO_PUBLIC_MQTT_URL}`)
                await Mqtt.connect(`${process.env.EXPO_PUBLIC_MQTT_URL}`, "dezire", "test1234");
                setClient(Mqtt);

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
            Mqtt.disconnect();
            setConnected(false);
            setClient(undefined);
        };
    }, [topic, session, setClient, setConnected]);
};

export default useMqtt;
