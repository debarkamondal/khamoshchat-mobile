import { create } from "zustand";
import { MqttClient } from "mqtt";

export type MqttStore = {
    client: MqttClient | undefined;
    setClient: (client: MqttClient | undefined) => void;
};

const useMqttStore = create<MqttStore>((set) => ({
    client: undefined,
    setClient: (client) => set({ client }),
}));

export default useMqttStore;
