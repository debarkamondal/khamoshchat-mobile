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
        AsyncFunction("vxeddsaSign") { (uData: Data, MData: Data) -> [String: Data] in
            let u = [UInt8](uData)
            let M = [UInt8](MData)

            guard u.count == 32 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Key must be 32 bytes"])
            }
            
            let outputPtr = UnsafeMutablePointer<VXEdDSAOutput>.allocate(capacity: 1)
            defer { outputPtr.deallocate() }
            
            let result = vxeddsa_sign_ffi(u, M, M.count, outputPtr)
            
            if result != 0 {
                throw NSError(
                    domain: "LibsignalDezire", code: 2,
                    userInfo: [NSLocalizedDescriptionKey: "Signing failed"])
            }

            // Access the C-tuples/arrays.
            let signature = withUnsafePointer(to: &outputPtr.pointee.signature) {
                Data(bytes: $0, count: 96)
            }
            let vrf_output = withUnsafePointer(to: &outputPtr.pointee.vrf) {
                Data(bytes: $0, count: 32)
            }

            return [
                "signature": signature,
                "vrf": vrf_output,
            ]
        }
        AsyncFunction("genPubKey") { (kData: Data) -> Data in
            let k = [UInt8](kData)
            var pubkey = [UInt8](repeating: 0, count: 32)
            gen_pubkey_ffi(k, &pubkey)

            return Data(pubkey)
        }

        AsyncFunction("genSecret") { () -> Data in
            var secret = [UInt8](repeating: 0, count: 32)
            gen_secret_ffi(&secret)
            return Data(secret)
        }
        AsyncFunction("genKeyPair") { () -> [String: Data] in
            var keys = gen_keypair_ffi()

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

            guard u.count == 32, signature.count == 96 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid input lengths"])
            }

            var v_out = [UInt8](repeating: 0, count: 32)
            let isValid = vxeddsa_verify_ffi(u, M, M.count, signature, &v_out)

            if isValid {
                return Data(v_out)
            } else {
                return nil
            }
        }

        // X3DH Initiator (Alice)
        AsyncFunction("x3dhInitiator") { (
            identityPrivate: Data,
            bobIdentityPublic: Data,
            bobSpkId: UInt32,
            bobSpkPublic: Data,
            bobSpkSignature: Data,
            bobOpkId: UInt32,
            bobOpkPublic: Data?,
            hasOpk: Bool
        ) -> [String: Any] in
            guard identityPrivate.count == 32,
                  bobIdentityPublic.count == 32,
                  bobSpkPublic.count == 32,
                  bobSpkSignature.count == 96 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid input lengths"])
            }

            if hasOpk {
                guard let opk = bobOpkPublic, opk.count == 32 else {
                    throw NSError(
                        domain: "LibsignalDezire", code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "One-time prekey must be 32 bytes when hasOpk is true"])
                }
            }

            let outputPtr = UnsafeMutablePointer<X3DHInitOutput>.allocate(capacity: 1)
            defer { outputPtr.deallocate() }

            let identityPrivateBytes = [UInt8](identityPrivate)
            let bobIdentityPublicBytes = [UInt8](bobIdentityPublic)
            let bobSpkPublicBytes = [UInt8](bobSpkPublic)
            let bobSpkSignatureBytes = [UInt8](bobSpkSignature)
            let bobOpkPublicBytes: [UInt8]? = bobOpkPublic.map { [UInt8]($0) }

            let status = x3dh_initiator_ffi(
                identityPrivateBytes,
                bobIdentityPublicBytes,
                bobSpkId,
                bobSpkPublicBytes,
                bobSpkSignatureBytes,
                bobOpkId,
                bobOpkPublicBytes,
                hasOpk,
                outputPtr
            )

            let sharedSecret = withUnsafePointer(to: &outputPtr.pointee.shared_secret) {
                Data(bytes: $0, count: 32)
            }
            let ephemeralPublic = withUnsafePointer(to: &outputPtr.pointee.ephemeral_public) {
                Data(bytes: $0, count: 32)
            }

            return [
                "sharedSecret": sharedSecret,
                "ephemeralPublic": ephemeralPublic,
                "status": status
            ]
        }

        // X3DH Responder (Bob)
        AsyncFunction("x3dhResponder") { (
            identityPrivate: Data,
            signedPrekeyPrivate: Data,
            oneTimePrekeyPrivate: Data?,
            hasOpk: Bool,
            aliceIdentityPublic: Data,
            aliceEphemeralPublic: Data
        ) -> [String: Any] in
            guard identityPrivate.count == 32,
                  signedPrekeyPrivate.count == 32,
                  aliceIdentityPublic.count == 32,
                  aliceEphemeralPublic.count == 32 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid input lengths"])
            }

            if hasOpk {
                guard let opk = oneTimePrekeyPrivate, opk.count == 32 else {
                    throw NSError(
                        domain: "LibsignalDezire", code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "One-time prekey must be 32 bytes when hasOpk is true"])
                }
            }

            var sharedSecretOut = [UInt8](repeating: 0, count: 32)

            let identityPrivateBytes = [UInt8](identityPrivate)
            let signedPrekeyPrivateBytes = [UInt8](signedPrekeyPrivate)
            let oneTimePrekeyPrivateBytes: [UInt8]? = oneTimePrekeyPrivate.map { [UInt8]($0) }
            let aliceIdentityPublicBytes = [UInt8](aliceIdentityPublic)
            let aliceEphemeralPublicBytes = [UInt8](aliceEphemeralPublic)

            let status = x3dh_responder_ffi(
                identityPrivateBytes,
                signedPrekeyPrivateBytes,
                oneTimePrekeyPrivateBytes,
                hasOpk,
                aliceIdentityPublicBytes,
                aliceEphemeralPublicBytes,
                &sharedSecretOut
            )

            return [
                "sharedSecret": Data(sharedSecretOut),
                "status": status
            ]
        }

        // Encode Public Key (prepends 0x05 for Curve25519)
        AsyncFunction("encodePublicKey") { (keyData: Data) -> Data in
            guard keyData.count == 32 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Key must be 32 bytes"])
            }

            let keyBytes = [UInt8](keyData)
            var out = [UInt8](repeating: 0, count: 33)
            encode_public_key_ffi(keyBytes, &out)

            return Data(out)
        }

    }
}
