import { create } from "zustand";
// TODO: switch to npm import once published: import MqttClient from 'expo-native-mqtt';
import MqttClient from "@/modules/expo-native-mqtt";

export type MqttStore = {
    client: typeof MqttClient | undefined;
    setClient: (client: typeof MqttClient | undefined) => void;
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
