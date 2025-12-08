import { NativeModule, requireNativeModule } from "expo";

import { KeyPair, VXEdDSAOutput } from "./LibsignalDezire.types";

declare class LibsignalDezireModule extends NativeModule {
  genKeyPair(): Promise<KeyPair>;
  genPubKey(k: Uint8Array): Promise<Uint8Array>;
  genSecret(): Promise<Uint8Array>;
  vxeddsaSign(
    k: Uint8Array,
    M: Uint8Array,
    z: Uint8Array,
  ): Promise<VXEdDSAOutput>;
  vxeddsaVerify(
    u: Uint8Array,
    M: Uint8Array,
    signature: Uint8Array,
  ): Promise<Uint8Array | null>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LibsignalDezireModule>("LibsignalDezire");
