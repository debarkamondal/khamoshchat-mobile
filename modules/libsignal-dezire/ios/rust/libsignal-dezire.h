#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

/**
 * Genrates VXEdDSA compatible keypair
 * # Returns
 *
 * A tuple `([u8; 32], [u8; 32])` containing:
 * 1. The Montgomary Private Key
 * 2. The Montgomary Public Key
 *
 */
typedef struct KeyPair {
  uint8_t secret[32];
  uint8_t public_[32];
} KeyPair;

typedef struct VXEdDSAOutput {
  uint8_t signature[96];
  uint8_t vfr[32];
} VXEdDSAOutput;

struct KeyPair gen_keypair(void);

void gen_pubkey(const uint8_t *k, uint8_t *pubkey );

void gen_secret(uint8_t *out);

/**
 * Computes a VXEdDSA signature and generates the associated VRF output.
 *
 * This function implements the signing logic specified in the VXEdDSA protocol (Signal).
 * It produces a deterministic signature and a proof of randomness (v).
 *
 * # Arguments
 *
 * * `k` - The 32-byte Montgomary private key. Note that this is the raw seed, not the clamped scalar.
 * * `M` - A reference to the 32-byte message to be signed.
 * * `z` - A 32-byte high-entropy nonce (randomness). This is crucial for the security of the scheme.
 *
 * # Returns
 *
 * A tuple `([u8; 96], [u8; 32])` containing:
 * 1. The **Signature** (96 bytes): Concatenation of `V || h || s`.
 * 2. The **VRF Output** (32 bytes): The value `v`, which serves as the verifiable random output.
 *
 * # Panics
 *
 * This function will panic if the calculated scalar `r` happens to be zero, which is a
 * statistically negligible event.
 */
struct VXEdDSAOutput vxeddsa_sign(const uint8_t *k,
                                  const uint8_t *M,
                                  const uint8_t *z);

bool vxeddsa_verify(const uint8_t *u,
                    const uint8_t *M,
                    const uint8_t *signature,
                    uint8_t *v_out);
