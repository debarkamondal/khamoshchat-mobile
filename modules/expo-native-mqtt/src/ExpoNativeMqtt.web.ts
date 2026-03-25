export default {
  connect() { throw new Error('ExpoNativeMqtt is not supported on web'); },
  disconnect() { throw new Error('ExpoNativeMqtt is not supported on web'); },
  subscribe() { throw new Error('ExpoNativeMqtt is not supported on web'); },
  unsubscribe() { throw new Error('ExpoNativeMqtt is not supported on web'); },
  publish() { throw new Error('ExpoNativeMqtt is not supported on web'); },
  addListener() { throw new Error('ExpoNativeMqtt is not supported on web'); }
};
