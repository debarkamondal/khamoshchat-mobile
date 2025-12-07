import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload, KeyPair, VXEdDSAOutput } from './LibsignalDezire.types';

type LibsignalDezireModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class LibsignalDezireModule extends NativeModule<LibsignalDezireModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  async vxeddsaSign(u: Uint8Array, M: Uint8Array, z: Uint8Array): Promise<VXEdDSAOutput> {
    return await this.nativeModule.vxeddsaSign(u,M,z);
  }
  async genKeyPair(): Promise<KeyPair> {
    return await this.nativeModule.genKeyPair();
  }
};

export default registerWebModule(LibsignalDezireModule, 'LibsignalDezireModule');
