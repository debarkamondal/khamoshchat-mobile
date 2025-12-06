// use curve25519_dalek::edwards::EdwardsPoint;
// use curve25519_dalek::scalar::Scalar;
use rand_core::{OsRng, RngCore};

use libsignal_dezire::vxeddsa::{vxeddsa_sign, vxeddsa_verify};
use x25519_dalek::{PublicKey, StaticSecret};

// Import the function under test

#[test]
fn test_vxeddsa_sign_produces_signature() {
    // Generate secret and public key
    let secret = StaticSecret::random_from_rng(&mut OsRng);
    let public = PublicKey::from(&secret);

    // Fixed test message
    let mut message = [0u8; 32];

    // Random nonce
    let mut nonce = [0u8; 32];
    OsRng.fill_bytes(&mut nonce);

    // Call the function
    let signature = vxeddsa_sign(secret.to_bytes(), &message, &nonce);
    message[31] = 6;

    let res = vxeddsa_verify(public.to_bytes(), &message, &signature.0);

    println!("vfr1 {:?}", signature.1);
    println!("vfr2 {:?}", res);
}
