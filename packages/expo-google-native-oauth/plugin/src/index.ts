import {
  withAndroidManifest,
  withInfoPlist,
  withPlugins,
  ConfigPlugin,
} from "@expo/config-plugins";

const WEB_CLIENT_ID_META = "expo.modules.googleauth.GOOGLE_WEB_CLIENT_ID";
const ANDROID_CLIENT_ID_META = "expo.modules.googleauth.GOOGLE_ANDROID_CLIENT_ID";

export type GoogleAuthPluginProps = {
  androidClientId: string;
  iosClientId: string;
  webClientId?: string;
};

const withAndroidGoogleAuth: ConfigPlugin<GoogleAuthPluginProps> = (
  config,
  props
) => {
  return withAndroidManifest(config, (manifestConfig) => {
    const androidManifest = manifestConfig.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (!application) {
      throw new Error(
        "[withGoogleAuth] Android application manifest entry not found."
      );
    }

    const androidClientId = props.androidClientId || config.extra?.googleAuth?.androidClientId;
    const webClientId = props.webClientId || config.extra?.googleAuth?.webClientId;

    application["meta-data"] = application["meta-data"] || [];

    upsertMetaData(
      application["meta-data"],
      WEB_CLIENT_ID_META,
      webClientId || ""
    );
    upsertMetaData(
      application["meta-data"],
      ANDROID_CLIENT_ID_META,
      androidClientId || ""
    );

    manifestConfig.modResults = androidManifest;
    return manifestConfig;
  });
};

const withIosGoogleAuth: ConfigPlugin<GoogleAuthPluginProps> = (
  config,
  props
) => {
  return withInfoPlist(config, (infoConfig) => {
    const iosClientId = props.iosClientId || config.extra?.googleAuth?.iosClientId;

    if (!iosClientId) {
      return infoConfig;
    }

    // Add GIDClientID for Google Sign-In SDK
    infoConfig.modResults.GIDClientID = iosClientId;

    const webClientId = props.webClientId || config.extra?.googleAuth?.webClientId;
    
    if (webClientId) {
      // Set the Web Client ID properly for backend auth
      infoConfig.modResults.GIDWebClientID = webClientId;
    }

    // Add URL scheme for Google Sign-In (reversed client ID)
    const reversedClientId = iosClientId.split(".").reverse().join(".");

    if (!infoConfig.modResults.CFBundleURLTypes) {
      infoConfig.modResults.CFBundleURLTypes = [];
    }

    const existingIndex = infoConfig.modResults.CFBundleURLTypes.findIndex(
      (type: any) => type.CFBundleURLSchemes?.includes(reversedClientId)
    );

    if (existingIndex === -1) {
      infoConfig.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: [reversedClientId],
      });
    }

    return infoConfig;
  });
};

const withGoogleAuth: ConfigPlugin<GoogleAuthPluginProps> = (config, props) => {
  return withPlugins(config, [
    [withAndroidGoogleAuth, props],
    [withIosGoogleAuth, props],
  ]);
};

export default withGoogleAuth;

function upsertMetaData(metaDataEntries: any[], name: string, value: string) {
  const existing = metaDataEntries.find(
    (entry) => entry.$["android:name"] === name
  );
  if (existing) {
    existing.$["android:value"] = value;
    return;
  }

  metaDataEntries.push({
    $: {
      "android:name": name,
      "android:value": value,
    },
  });
}
