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
        // Bundle format: [identityKey:32][spkId:4][spkPublic:32][signature:96][opkId:4][opkPublic:32?]
        // Total: 168 bytes (without OPK) or 200 bytes (with OPK)
        AsyncFunction("x3dhInitiator") { (
            identityPrivate: Data,
            bobBundle: Data,
            hasOpk: Bool
        ) -> [String: Data] in
            // Validate bundle size
            let expectedSize = hasOpk ? 200 : 168
            guard bobBundle.count == expectedSize else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid bundle size. Expected \(expectedSize), got \(bobBundle.count)"])
            }
            
            guard identityPrivate.count == 32 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Identity private key must be 32 bytes"])
            }
            
            // Parse bundle
            let bobIdentityPublic = [UInt8](bobBundle.subdata(in: 0..<32))
            let bobSpkId = bobBundle.subdata(in: 32..<36).withUnsafeBytes { $0.load(as: UInt32.self) }
            let bobSpkPublic = [UInt8](bobBundle.subdata(in: 36..<68))
            let bobSpkSignature = [UInt8](bobBundle.subdata(in: 68..<164))
            let bobOpkId = bobBundle.subdata(in: 164..<168).withUnsafeBytes { $0.load(as: UInt32.self) }
            let bobOpkPublic: [UInt8] = hasOpk ? [UInt8](bobBundle.subdata(in: 168..<200)) : [UInt8](repeating: 0, count: 32)
            let identityPrivateBytes = [UInt8](identityPrivate)

            let outputPtr = UnsafeMutablePointer<X3DHInitOutput>.allocate(capacity: 1)
            defer { outputPtr.deallocate() }

            // Build and call FFI using withUnsafeBytes to avoid tuple conversions
            var bundleInput = X3DHBundleInput()
            withUnsafeMutableBytes(of: &bundleInput.identity_public) { ptr in
                _ = bobIdentityPublic.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            bundleInput.spk_id = bobSpkId
            withUnsafeMutableBytes(of: &bundleInput.spk_public) { ptr in
                _ = bobSpkPublic.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            withUnsafeMutableBytes(of: &bundleInput.spk_signature) { ptr in
                _ = bobSpkSignature.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 96)
                }
            }
            bundleInput.opk_id = bobOpkId
            withUnsafeMutableBytes(of: &bundleInput.opk_public) { ptr in
                _ = bobOpkPublic.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            bundleInput.has_opk = hasOpk

            identityPrivateBytes.withUnsafeBytes { idPrivPtr in
                let idPriv = idPrivPtr.baseAddress!.assumingMemoryBound(to: UInt8.self)
                x3dh_initiator_ffi(idPriv, &bundleInput, outputPtr)
            }

            let sharedSecret = withUnsafePointer(to: &outputPtr.pointee.shared_secret) {
                Data(bytes: $0, count: 32)
            }
            let ephemeralPublic = withUnsafePointer(to: &outputPtr.pointee.ephemeral_public) {
                Data(bytes: $0, count: 32)
            }
            let status = outputPtr.pointee.status

            if status != 0 {
                throw NSError(
                    domain: "LibsignalDezire", code: Int(status),
                    userInfo: [NSLocalizedDescriptionKey: "X3DH initiator failed with status \(status)"])
            }

            return [
                "sharedSecret": sharedSecret,
                "ephemeralPublic": ephemeralPublic
            ]
        }

        // X3DH Responder (Bob)
        AsyncFunction("x3dhResponder") { (
            identityPrivate: Data,
            signedPrekeyPrivate: Data,
            oneTimePrekeyPrivate: Data?,
            aliceIdentityPublic: Data,
            aliceEphemeralPublic: Data
        ) -> [String: Data] in
            guard identityPrivate.count == 32,
                  signedPrekeyPrivate.count == 32,
                  aliceIdentityPublic.count == 32,
                  aliceEphemeralPublic.count == 32 else {
                throw NSError(
                    domain: "LibsignalDezire", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid input lengths"])
            }

            let hasOpk = oneTimePrekeyPrivate != nil && oneTimePrekeyPrivate!.count == 32

            if hasOpk {
                guard let opk = oneTimePrekeyPrivate, opk.count == 32 else {
                    throw NSError(
                        domain: "LibsignalDezire", code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "One-time prekey must be 32 bytes when provided"])
                }
            }

            // Convert to byte arrays
            let identityPrivateBytes = [UInt8](identityPrivate)
            let spkPrivateBytes = [UInt8](signedPrekeyPrivate)
            let opkPrivateBytes: [UInt8] = oneTimePrekeyPrivate != nil ? [UInt8](oneTimePrekeyPrivate!) : [UInt8](repeating: 0, count: 32)
            let aliceIdPubBytes = [UInt8](aliceIdentityPublic)
            let aliceEkPubBytes = [UInt8](aliceEphemeralPublic)

            let outputPtr = UnsafeMutablePointer<X3DHResponderOutput>.allocate(capacity: 1)
            defer { outputPtr.deallocate() }

            // Build responder input using memcpy
            var responderInput = X3DHResponderInput()
            withUnsafeMutableBytes(of: &responderInput.identity_private) { ptr in
                _ = identityPrivateBytes.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            withUnsafeMutableBytes(of: &responderInput.spk_private) { ptr in
                _ = spkPrivateBytes.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            withUnsafeMutableBytes(of: &responderInput.opk_private) { ptr in
                _ = opkPrivateBytes.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            responderInput.has_opk = hasOpk

            // Build alice keys using memcpy
            var aliceKeys = X3DHAliceKeys()
            withUnsafeMutableBytes(of: &aliceKeys.identity_public) { ptr in
                _ = aliceIdPubBytes.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }
            withUnsafeMutableBytes(of: &aliceKeys.ephemeral_public) { ptr in
                _ = aliceEkPubBytes.withUnsafeBytes { src in
                    memcpy(ptr.baseAddress!, src.baseAddress!, 32)
                }
            }

            x3dh_responder_ffi(&responderInput, &aliceKeys, outputPtr)

            let sharedSecret = withUnsafePointer(to: &outputPtr.pointee.shared_secret) {
                Data(bytes: $0, count: 32)
            }
            let status = outputPtr.pointee.status

            if status != 0 {
                throw NSError(
                    domain: "LibsignalDezire", code: Int(status),
                    userInfo: [NSLocalizedDescriptionKey: "X3DH responder failed with status \(status)"])
            }

            return [
                "sharedSecret": sharedSecret
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
