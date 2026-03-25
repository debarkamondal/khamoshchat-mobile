import { requireNativeModule, EventEmitter, Subscription } from 'expo-modules-core';
import { MqttConnectOptions, MqttEventName } from './ExpoNativeMqtt.types';

const ExpoNativeMqtt = requireNativeModule('ExpoNativeMqtt');
const emitter = new EventEmitter(ExpoNativeMqtt);

export default {
  // Methods
  connect(brokerUrl: string, username?: string, password?: string, options?: MqttConnectOptions): Promise<string> {
    return ExpoNativeMqtt.connect(brokerUrl, username || null, password || null, options || {});
  },

  disconnect(): Promise<string> {
    return ExpoNativeMqtt.disconnect();
  },

  subscribe(topic: string, qos: number = 0): Promise<string> {
    return ExpoNativeMqtt.subscribe(topic, qos);
  },

  unsubscribe(topic: string): Promise<string> {
    return ExpoNativeMqtt.unsubscribe(topic);
  },

  publish(topic: string, message: string, qos: number = 0, retained: boolean = false): Promise<string> {
    return ExpoNativeMqtt.publish(topic, message, qos, retained);
  },

  // Events
  addListener(eventName: MqttEventName, listener: (event: any) => void): Subscription {
    return emitter.addListener(eventName, listener);
  }
};
