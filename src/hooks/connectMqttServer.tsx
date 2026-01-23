import mqtt, { MqttClient } from "mqtt";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

const useMqtt = (topic: string) => {
  const [client, setClient] = useState<MqttClient | undefined>();

  useEffect(() => {
    let mqttClient: MqttClient;

    try {
      // Using wss and port 8084 as per previous file content
      mqttClient = mqtt.connect("wss://broker.emqx.io/mqtt", {
        port: 8084,
        protocol: "wss",
        protocolVersion: 5,
        connectTimeout: 5000,
        clientId: `khamosh_chat_${Math.random().toString(16).slice(2, 8)}`, // Unique client ID
        clean: true, // Clean session
      });

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

      mqttClient.on("error", (err) => {
        console.error("MQTT Error:", err);
      });

      setClient(mqttClient);
    } catch (error) {
      console.error("MQTT Connection Error:", error);
    }

    return () => {
      if (mqttClient) {
        // console.log("Disconnecting MQTT client");
        mqttClient.end();
      }
    };
  }, [topic]);

  return client;
};

export default useMqtt;
