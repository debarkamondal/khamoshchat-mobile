import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload, KeyPair } from './LibsignalDezire.types';

type LibsignalDezireModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class LibsignalDezireModule extends NativeModule<LibsignalDezireModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  async genKeyPair(): Promise<KeyPair> {
    return await this.nativeModule.genKeyPair();
  }
};

export default registerWebModule(LibsignalDezireModule, 'LibsignalDezireModule');
