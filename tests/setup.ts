import '@testing-library/jest-native/extend-expect';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32)),
  digestStringAsync: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-native-mqtt
jest.mock('expo-native-mqtt', () => {
  return {
    NativeMqttClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      onMessage: jest.fn(),
    })),
  };
});

// Mock libsignal-dezire (the Rust FFI module)
jest.mock('@/modules/libsignal-dezire/src/LibsignalDezireModule', () => ({
  genKeyPair: jest.fn().mockResolvedValue({
    pubKey: new Uint8Array(32),
    privKey: new Uint8Array(32),
  }),
  vxeddsaSign: jest.fn().mockResolvedValue(new Uint8Array(64)),
  vxeddsaVerify: jest.fn().mockResolvedValue(true),
  x3dhInitiator: jest.fn().mockResolvedValue({
    sharedSecret: new Uint8Array(32),
    ephemeralPubKey: new Uint8Array(32),
  }),
  x3dhResponder: jest.fn().mockResolvedValue(new Uint8Array(32)),
  ratchetInitSender: jest.fn().mockResolvedValue('mock-session-id-123'),
  ratchetInitReceiver: jest.fn().mockResolvedValue('mock-session-id-123'),
  ratchetEncrypt: jest.fn().mockResolvedValue({
    ciphertext: new Uint8Array(32),
    type: 1,
  }),
  ratchetDecrypt: jest.fn().mockResolvedValue(new Uint8Array(32)),
  ratchetFree: jest.fn(),
}));
