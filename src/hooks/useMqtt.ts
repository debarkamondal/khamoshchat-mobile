import mqtt, { MqttClient } from "mqtt";
import { useEffect } from "react";
import { Alert } from "react-native";
import useMqttStore from "@/src/store/mqtt";
import useSession from "@/src/store/session";
import { X3DHBundle } from "@/src/utils/x3dh";
import { receiveMessage } from "@/src/utils/messages";
import { useRatchet } from "@/src/hooks/useRatchet";
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

            // 3. Handle Messages (Consolidated from useGlobalMqttHandler)
            const handleMessage = async (msgTopic: string, message: Buffer) => {
                try {
                    const parsedMessage = JSON.parse(message.toString());
                    const payload = parsedMessage as X3DHBundle & { ciphertext: string; header: string };

                    // Extract sender from topic: /khamoshchat/<recipient>/<sender>
                    const topicParts = msgTopic.split('/');
                    const senderPhone = topicParts.length >= 4 ? decodeURIComponent(topicParts[3]) : null;

                    if (senderPhone && payload.identityKey && payload.ephemeralKey && payload.opkId !== undefined) {
                        if (session.isRegistered) {
                            const LibsignalDezireModule = (await import("@/modules/libsignal-dezire/src/LibsignalDezireModule")).default;
                            const SecureStore = await import("expo-secure-store");
                            const storeKey = `ratchet_state_${senderPhone.substring(1)}`;

                            // Closure to hold the ratchet UUID
                            let ratchetUuid: string | null = null;

                            const initReceiver = async (sharedSecret: Uint8Array, receiverPriv: Uint8Array, receiverPub: Uint8Array) => {
                                ratchetUuid = await LibsignalDezireModule.ratchetInitReceiver(sharedSecret, receiverPriv, receiverPub);
                                return ratchetUuid;
                            };

                            const decrypt = async (header: Uint8Array, ciphertext: Uint8Array, ad?: Uint8Array) => {
                                if (!ratchetUuid) return null;
                                const plaintext = await LibsignalDezireModule.ratchetDecrypt(ratchetUuid, header, ciphertext, ad);
                                if (plaintext) {
                                    const serialized = await LibsignalDezireModule.ratchetSerialize(ratchetUuid);
                                    await SecureStore.setItemAsync(storeKey, serialized);
                                }
                                return plaintext;
                            };

                            await receiveMessage({
                                session,
                                payload,
                                senderPhone,
                                initReceiver,
                                decrypt
                            });
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
                // console.log("Disconnecting MQTT client");
                mqttClient.end();
            }
            // Clear client from store on unmount/cleanup
            // Note: If you want to persist the client across re-renders where topic doesn't change, 
            // this effect handles that (it only re-runs on topic change). 
            // setClient(undefined); 
        };
    }, [topic, session, setClient]);
};

export default useMqtt;
