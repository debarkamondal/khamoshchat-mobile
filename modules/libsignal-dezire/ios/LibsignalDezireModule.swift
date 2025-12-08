import ExpoModulesCore

public class LibsignalDezireModule: Module {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    public func definition() -> ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('LibsignalDezire')` in JavaScript.
        Name("LibsignalDezire")

        // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
        AsyncFunction("vxeddsaSign") { (uData: Data, MData: Data, zData: Data) -> [String: Data] in
            let u = [UInt8](uData)
            let M = [UInt8](MData)
            let z = [UInt8](zData)

            guard u.count == 32, M.count == 32, z.count == 32 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Inputs must be 32 bytes"])
            }
            var output = vxeddsa_sign(u, M, z)

            // Access the C-tuples/arrays.
            let signature = withUnsafePointer(to: &output.signature) {
                Data(bytes: $0, count: 96)
            }
            let vfr_output = withUnsafePointer(to: &output.vfr) {
                Data(bytes: $0, count: 32)
            }

            return [
                "signature": signature,
                "vfr": vfr_output,
            ]
        }
        AsyncFunction("genPubkey") { (kData: Data) -> Data in
            let k = [UInt8](kData)
            var pubkey = [UInt8](repeating: 0, count: 32)
            gen_pubkey(k, &pubkey)

            return Data(pubkey)
        }
        AsyncFunction("genKeyPair") { () -> [String: Data] in
            var keys = gen_keypair()

            // Access the C-tuples/arrays.
            let secretData = withUnsafePointer(to: &keys.secret) {
                Data(bytes: $0, count: 32)
            }
            let publicData = withUnsafePointer(to: &keys.public_) {
                Data(bytes: $0, count: 32)
            }

            return [
                "secret": secretData,
                "public": publicData,
            ]
        }

        AsyncFunction("vxeddsaVerify") { (uData: Data, MData: Data, signatureData: Data) -> Data? in
            let u = [UInt8](uData)
            let M = [UInt8](MData)
            let signature = [UInt8](signatureData)

            guard u.count == 32, M.count == 32, signature.count == 96 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid input lengths"])
            }

            var v_out = [UInt8](repeating: 0, count: 32)
            let isValid = vxeddsa_verify(u, M, signature, &v_out)

            if isValid {
                return Data(v_out)
            } else {
                return nil
            }
        }

        // Enables the module to be used as a native view. Definition components that are accepted as part of the
        // view definition: Prop, Events.

    }
}
