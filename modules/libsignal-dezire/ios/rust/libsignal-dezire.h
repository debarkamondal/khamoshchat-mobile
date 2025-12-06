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

struct KeyPair gen_keypair(void);
