export type MqttEventName =
  | 'onMqttConnected'
  | 'onMqttDisconnected'
  | 'onMqttMessageReceived'
  | 'onMqttError'
  | 'onMqttSubscribed'
  | 'onMqttUnsubscribed'
  | 'onMqttReconnecting';

export interface MqttConnectOptions {
  clientId?: string;
  cleanSession?: boolean; // default: false (enables offline delivery)
  autoReconnect?: boolean; // default: true
  reconnectDelay?: number; // ms, default: 5000
  keepAlive?: number; // seconds, default: 60
}

export interface MqttMessage {
  topic: string;
  payload: string;
  qos: number;
  retained: boolean;
}
