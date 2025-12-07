import { NativeModule, requireNativeModule } from 'expo';

import { KeyPair, LibsignalDezireModuleEvents, VXEdDSAOutput } from './LibsignalDezire.types';

declare class LibsignalDezireModule extends NativeModule<LibsignalDezireModuleEvents> {
  PI: number;
  genKeyPair(): Promise<KeyPair>;
  vxeddsaSign(k: Uint8Array, M: Uint8Array, z: Uint8Array): Promise<VXEdDSAOutput>
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LibsignalDezireModule>('LibsignalDezire');
