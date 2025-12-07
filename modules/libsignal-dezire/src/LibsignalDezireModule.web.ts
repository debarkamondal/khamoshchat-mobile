import { registerWebModule, NativeModule } from 'expo';

import { KeyPair, VXEdDSAOutput } from './LibsignalDezire.types';

class LibsignalDezireModule extends NativeModule {
  async vxeddsaSign(u: Uint8Array, M: Uint8Array, z: Uint8Array): Promise<VXEdDSAOutput> {
    return await this.nativeModule.vxeddsaSign(u, M, z);
  }
  async vxeddsaVerify(u: Uint8Array, M: Uint8Array, signature: Uint8Array): Promise<Uint8Array | null> {
    return await this.nativeModule.vxeddsaVerify(u, M, signature);
  }
  async genKeyPair(): Promise<KeyPair> {
    return await this.nativeModule.genKeyPair();
  }
};

export default registerWebModule(LibsignalDezireModule, 'LibsignalDezireModule');
