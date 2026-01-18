import { NativeModule, requireNativeModule } from "expo";

import { KeyPair, VXEdDSAOutput, X3DHInitOutput, RatchetEncryptResult } from "./LibsignalDezire.types";

declare class LibsignalDezireModule extends NativeModule {
  genKeyPair(): Promise<KeyPair>;
  genSecret(): Promise<Uint8Array>;
  genPubKey(k: Uint8Array): Promise<Uint8Array>;
  vxeddsaSign(
    k: Uint8Array,
    M: Uint8Array,
  ): Promise<VXEdDSAOutput>;
  vxeddsaVerify(
    u: Uint8Array,
    M: Uint8Array,
    signature: Uint8Array,
  ): Promise<Uint8Array | null>;

  // X3DH
  x3dhInitiator(
    identityPrivate: Uint8Array,
    bobIdentityPublic: Uint8Array,
    bobSpkId: number,
    bobSpkPublic: Uint8Array,
    bobSpkSignature: Uint8Array,
    bobOpkId: number,
    bobOpkPublic: Uint8Array | null,
  ): Promise<X3DHInitOutput | null>;

  x3dhResponder(
    identityPrivate: Uint8Array,
    signedPreKeyPrivate: Uint8Array,
    oneTimePreKeyPrivate: Uint8Array | null,
    aliceIdentityPublic: Uint8Array,
    aliceEphemeralPublic: Uint8Array,
  ): Promise<Uint8Array | null>;

  // Ratchet
  ratchetInitSender(
    sk: Uint8Array,
    receiverPub: Uint8Array,
  ): Promise<number>;

  ratchetInitReceiver(
    sk: Uint8Array,
    receiverPriv: Uint8Array,
    receiverPub: Uint8Array,
  ): Promise<number>;

  ratchetEncrypt(
    statePtr: number,
    plaintext: Uint8Array,
    ad?: Uint8Array,
  ): Promise<RatchetEncryptResult | null>;

  ratchetDecrypt(
    statePtr: number,
    header: Uint8Array,
    ciphertext: Uint8Array,
    ad?: Uint8Array,
  ): Promise<Uint8Array | null>;

  ratchetFree(statePtr: number): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LibsignalDezireModule>("LibsignalDezire");
