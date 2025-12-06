import { NativeModule, requireNativeModule } from 'expo';

import { KeyPair, LibsignalDezireModuleEvents } from './LibsignalDezire.types';

declare class LibsignalDezireModule extends NativeModule<LibsignalDezireModuleEvents> {
  PI: number;
  genKeyPair(): Promise<KeyPair>;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LibsignalDezireModule>('LibsignalDezire');
