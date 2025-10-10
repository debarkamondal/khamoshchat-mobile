import mqtt from "mqtt";
import { useMemo, useState } from "react";
import { Alert } from "react-native";

const connectMqttServer = () => {
  const [isConnected, setIsConnected] = useState(false);
  let client = useMemo(() => {
    return mqtt.connect("ws://broker.emqx.io/mqtt", {
      // let client = mqtt.connect("mqtt://test.mosquitto.org", {
      port: 8083,
      protocol: "ws",
      protocolVersion: 5,
      connectTimeout: 5000,
    });
  }, []);
  client.on("connect", () => {
    setIsConnected(true);
    client.subscribe("/deztest/#", (err) => {
      if (err) {
        Alert.alert(
          "Error",
          "Couldn't connect to the server. Please try again if the issue persists please contact support.",
          [
            {
              text: "OK",
              style: "cancel",
            },
          ],
        );
      }
    });
  });
  client.on("error", (err) => console.log(err));
  return { isConnected, client };
};

export default connectMqttServer;
