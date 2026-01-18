export type VXEdDSAOutput = {
  signature: Uint8Array;
  vrf: Uint8Array;
}
export type KeyPair = {
  secret: Uint8Array;
  public: Uint8Array;
}

export type X3DHInitOutput = {
  shared_secret: Uint8Array;
  ephemeral_public: Uint8Array;
};

export type RatchetEncryptResult = {
  header: Uint8Array;
  ciphertext: Uint8Array;
};
