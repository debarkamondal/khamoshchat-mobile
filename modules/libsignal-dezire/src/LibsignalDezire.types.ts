export type VXEdDSAOutput = {
  signature: Uint8Array;
  vrf: Uint8Array;
}
export type KeyPair = {
  secret: Uint8Array;
  public: Uint8Array;
}

export type X3DHInitOutput = {
  sharedSecret: Uint8Array;
  ephemeralPublic: Uint8Array;
};

export type X3DHResponderOutput = {
  sharedSecret: Uint8Array;
  status: number;
};

export type RatchetEncryptResult = {
  header: Uint8Array;
  ciphertext: Uint8Array;
};
