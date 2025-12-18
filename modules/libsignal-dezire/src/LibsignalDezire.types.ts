export type VXEdDSAOutput = {
  signature: Uint8Array;
  vrf: Uint8Array;
}
export type KeyPair = {
  secret: Uint8Array;
  public: Uint8Array;
}
