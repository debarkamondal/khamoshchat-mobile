package expo.modules.libsignaldezire

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.ByteBuffer
import java.nio.ByteOrder

class LibsignalDezireModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a
    // string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for
    // clarity.
    // The module will be accessible from `requireNativeModule('LibsignalDezire')` in JavaScript.
    Name("LibsignalDezire")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.

    AsyncFunction("genKeyPair") { genKeyPair() ?: throw Exception("Failed to generate key pair") }

    AsyncFunction("genPubKey") { k: ByteArray -> genPubKey(k) }

    AsyncFunction("genSecret") { genSecret() }

    AsyncFunction("vxeddsaSign") { k: ByteArray, m: ByteArray ->
      if (k.size != 32) {
        throw Exception("Key must be 32 bytes")
      }
      vxeddsaSign(k, m) ?: throw Exception("Signing failed")
    }

    AsyncFunction("vxeddsaVerify") { u: ByteArray, m: ByteArray, signature: ByteArray ->
      if (u.size != 32 || signature.size != 96) {
        throw Exception("Invalid input lengths")
      }
      vxeddsaVerify(u, m, signature)
    }

    AsyncFunction("encodePublicKey") { k: ByteArray -> encodePublicKey(k) }

    // X3DH Initiator with bundled arguments
    // Bundle format: [identityKey:32][spkId:4][spkPublic:32][signature:96][otkId:4][otkPublic:32?]
    AsyncFunction("x3dhInitiator") {
            identityPrivate: ByteArray,
            bobBundle: ByteArray,
            hasOpk: Boolean ->
      val expectedSize = if (hasOpk) 200 else 168
      if (bobBundle.size != expectedSize) {
        throw Exception("Invalid bundle size. Expected $expectedSize, got ${bobBundle.size}")
      }
      if (identityPrivate.size != 32) {
        throw Exception("Identity private key must be 32 bytes")
      }

      // Parse bundle using ByteBuffer for little-endian integers
      val buffer = ByteBuffer.wrap(bobBundle).order(ByteOrder.LITTLE_ENDIAN)

      val bobIdentityPublic = ByteArray(32)
      buffer.get(bobIdentityPublic)

      val bobSpkId = buffer.getInt()

      val bobSpkPublic = ByteArray(32)
      buffer.get(bobSpkPublic)

      val bobSpkSignature = ByteArray(96)
      buffer.get(bobSpkSignature)

      val bobOpkId = buffer.getInt()

      val bobOpkPublic: ByteArray? =
              if (hasOpk) {
                val opk = ByteArray(32)
                buffer.get(opk)
                opk
              } else {
                null
              }

      // Call the original JNI function with individual arguments
      x3dhInitiator(
              identityPrivate,
              bobIdentityPublic,
              bobSpkId,
              bobSpkPublic,
              bobSpkSignature,
              bobOpkId,
              bobOpkPublic
      )
              ?: throw Exception("x3dhInitiator failed")
    }
  }

  companion object {
    init {
      System.loadLibrary("libsignal_dezire")
    }

    @JvmStatic external fun genKeyPair(): Map<String, Any>?

    @JvmStatic external fun genPubKey(k: ByteArray): ByteArray?

    @JvmStatic external fun genSecret(): ByteArray?

    @JvmStatic external fun vxeddsaSign(k: ByteArray, m: ByteArray): Map<String, Any>?

    @JvmStatic
    external fun vxeddsaVerify(u: ByteArray, m: ByteArray, signature: ByteArray): ByteArray?

    @JvmStatic external fun encodePublicKey(k: ByteArray): ByteArray?

    @JvmStatic
    external fun x3dhInitiator(
            identityPrivate: ByteArray,
            bobIdentityPublic: ByteArray,
            bobSpkId: Int,
            bobSpkPublic: ByteArray,
            bobSpkSignature: ByteArray,
            bobOpkId: Int,
            bobOpkPublic: ByteArray?
    ): Map<String, Any>?
  }
}
