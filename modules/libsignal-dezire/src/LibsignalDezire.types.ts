import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type LibsignalDezireModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type KeyPair = {
  secret: string;
  public: string;
}
export type ChangeEventPayload = {
  value: string;
};

export type LibsignalDezireViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
