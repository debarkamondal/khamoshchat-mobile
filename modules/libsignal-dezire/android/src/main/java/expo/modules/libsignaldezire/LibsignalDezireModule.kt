package expo.modules.libsignaldezire

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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

    AsyncFunction("genKeyPair") { genKeyPair() }

    AsyncFunction("vxeddsaSign") { k: ByteArray, m: ByteArray, z: ByteArray ->
      vxeddsaSign(k, m, z)
    }

    AsyncFunction("vxeddsaVerify") { u: ByteArray, m: ByteArray, signature: ByteArray ->
      vxeddsaVerify(u, m, signature)
    }
  }

  companion object {
    init {
      System.loadLibrary("libsignal_dezire")
    }

    @JvmStatic external fun genKeyPair(): Map<String, Any>

    @JvmStatic external fun vxeddsaSign(k: ByteArray, m: ByteArray, z: ByteArray): Map<String, Any>

    @JvmStatic
    external fun vxeddsaVerify(u: ByteArray, m: ByteArray, signature: ByteArray): ByteArray?
  }
}
