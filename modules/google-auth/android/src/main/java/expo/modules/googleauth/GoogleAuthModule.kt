package expo.modules.googleauth

import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val WEB_CLIENT_ID_META = "expo.modules.googleauth.GOOGLE_WEB_CLIENT_ID"

class GoogleAuthModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GoogleAuth")

    AsyncFunction("isAvailable") {
      getWebClientIdOrNull() != null
    }

    AsyncFunction("signIn") Coroutine { ->
      val activity = appContext.currentActivity
        ?: throw GoogleAuthUnavailableException("Google sign-in requires an active Android activity.")
      val webClientId = getWebClientIdOrNull()
        ?: throw GoogleAuthConfigurationException("Missing Google web client ID configuration.")

      val credentialManager = CredentialManager.create(activity)
      val googleIdOption = GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(false)
        .setAutoSelectEnabled(false)
        .setServerClientId(webClientId)
        .setNonce(java.util.UUID.randomUUID().toString())
        .build()

      val request = GetCredentialRequest.Builder()
        .addCredentialOption(googleIdOption)
        .build()

      try {
        val result = credentialManager.getCredential(
          context = activity,
          request = request,
        )
        parseGoogleCredential(result)
      } catch (error: GetCredentialCancellationException) {
        throw GoogleAuthCancelledException()
      } catch (error: GetCredentialException) {
        throw GoogleAuthFailedException(error.message ?: "Google sign-in failed.", error)
      } catch (error: Exception) {
        throw GoogleAuthFailedException(error.message ?: "Unexpected sign-in error.", error)
      }
    }

    AsyncFunction("signOut") Coroutine { ->
      val context = appContext.reactContext
        ?: throw GoogleAuthUnavailableException("Google sign-out requires an active React context.")

      try {
        CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
      } catch (error: ClearCredentialException) {
        throw GoogleAuthFailedException(error.message ?: "Google sign-out failed.", error)
      }
    }
  }

  private fun getWebClientIdOrNull(): String? {
    val context = appContext.reactContext ?: return null
    return context
      .applicationContext
      .packageManager
      .getApplicationInfo(context.packageName, android.content.pm.PackageManager.GET_META_DATA)
      .metaData
      ?.getString(WEB_CLIENT_ID_META)
      ?.takeIf { it.isNotBlank() }
  }

  private fun parseGoogleCredential(response: GetCredentialResponse): Map<String, String?> {
    val credential = response.credential
    if (credential !is CustomCredential) {
      throw GoogleAuthFailedException("Unsupported credential returned by Google sign-in.")
    }

    if (credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
      throw GoogleAuthFailedException("Unexpected Google credential type.")
    }

    try {
      val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
      return mapOf(
        "idToken" to googleCredential.idToken,
        "email" to googleCredential.id,
        "displayName" to googleCredential.displayName,
        "avatarUrl" to googleCredential.profilePictureUri?.toString(),
        "googleUserId" to googleCredential.id,
      )
    } catch (error: GoogleIdTokenParsingException) {
      throw GoogleAuthFailedException("Failed to parse Google sign-in response.", error)
    }
  }
}

private class GoogleAuthUnavailableException(message: String) :
  CodedException("ERR_GOOGLE_AUTH_UNAVAILABLE", message, null)

private class GoogleAuthConfigurationException(message: String) :
  CodedException("ERR_GOOGLE_AUTH_CONFIGURATION", message, null)

private class GoogleAuthCancelledException :
  CodedException("ERR_GOOGLE_AUTH_CANCELLED", "Google sign-in was cancelled.", null)

private class GoogleAuthFailedException(message: String, cause: Throwable? = null) :
  CodedException("ERR_GOOGLE_AUTH_FAILED", message, cause)
