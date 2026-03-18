import ExpoModulesCore
import GoogleSignIn

public class GoogleAuthModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GoogleAuth")

    AsyncFunction("isAvailable") { () -> Bool in
      return true
    }

    AsyncFunction("signIn") { (promise: Promise) in
      guard let rootViewController = UIApplication.shared.keyWindow?.rootViewController else {
        promise.reject("ERR_GOOGLE_AUTH_NO_VIEW_CONTROLLER", "Could not find root view controller")
        return
      }

      guard let clientId = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String else {
        promise.reject("ERR_GOOGLE_AUTH_CONFIG", "Missing GIDClientID in Info.plist")
        return
      }
      
      let webClientId = Bundle.main.object(forInfoDictionaryKey: "GIDWebClientID") as? String
      
      let config = GIDConfiguration(clientID: clientId, serverClientID: webClientId)
      GIDSignIn.sharedInstance.configuration = config

      GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { result, error in
        if let error = error {
          let code = (error as NSError).code
          if code == GIDSignInError.canceled.rawValue {
            promise.reject("ERR_GOOGLE_AUTH_CANCELLED", "User cancelled the sign-in flow")
          } else {
            promise.reject("ERR_GOOGLE_AUTH_FAILED", error.localizedDescription)
          }
          return
        }

        guard let user = result?.user else {
          promise.reject("ERR_GOOGLE_AUTH_NO_USER", "Sign-in succeeded but no user was returned")
          return
        }

        let dict: [String: Any?] = [
          "idToken": user.idToken?.tokenString,
          "googleUserId": user.userID,
          "email": user.profile?.email,
          "displayName": user.profile?.name,
          "avatarUrl": user.profile?.imageURL(withDimension: 320)?.absoluteString
        ]
        promise.resolve(dict)
      }
    }

    AsyncFunction("signOut") { 
      GIDSignIn.sharedInstance.signOut()
    }
  }
}
