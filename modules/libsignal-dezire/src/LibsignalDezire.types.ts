import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type LibsignalDezireModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type VXEdDSAOutput = {
  signature: Uint8Array;
  vfr: Uint8Array;
}
export type KeyPair = {
  secret: Uint8Array;
  public: Uint8Array;
}
export type ChangeEventPayload = {
  value: string;
};

export type LibsignalDezireViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
