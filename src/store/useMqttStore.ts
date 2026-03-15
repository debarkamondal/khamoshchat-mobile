import { create } from "zustand";
import Mqtt from "@ecodevstack/react-native-mqtt-client";

export type MqttStore = {
    client: typeof Mqtt | undefined;
    setClient: (client: typeof Mqtt | undefined) => void;
    isConnected: boolean;
    setConnected: (connected: boolean) => void;
};

const useMqttStore = create<MqttStore>((set) => ({
    client: undefined,
    setClient: (client) => set({ client }),
    isConnected: false,
    setConnected: (isConnected) => set({ isConnected }),
}));

export default useMqttStore;
