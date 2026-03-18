const { withAndroidManifest, withInfoPlist, withPlugins } = require("@expo/config-plugins");

const SERVER_CLIENT_ID_META = "expo.modules.googleauth.GOOGLE_SERVER_CLIENT_ID";
const ANDROID_CLIENT_ID_META = "expo.modules.googleauth.GOOGLE_ANDROID_CLIENT_ID";

function withAndroidGoogleAuth(config, props) {
  return withAndroidManifest(config, (manifestConfig) => {
    const androidManifest = manifestConfig.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (!application) {
      throw new Error("[withGoogleAuth] Android application manifest entry not found.");
    }

    const serverClientId = props.serverClientId || config.extra?.googleAuth?.serverClientId;
    const androidClientId = props.androidClientId || config.extra?.googleAuth?.androidClientId;

    application["meta-data"] = application["meta-data"] || [];

    upsertMetaData(application["meta-data"], SERVER_CLIENT_ID_META, serverClientId || "");
    upsertMetaData(application["meta-data"], ANDROID_CLIENT_ID_META, androidClientId || "");

    manifestConfig.modResults = androidManifest;
    return manifestConfig;
  });
}

function withIosGoogleAuth(config, props) {
  return withInfoPlist(config, (infoConfig) => {
    const iosClientId = props.iosClientId || config.extra?.googleAuth?.iosClientId;

    if (!iosClientId) {
      return infoConfig;
    }

    // Add GIDClientID for Google Sign-In SDK
    infoConfig.modResults.GIDClientID = iosClientId;

    const serverClientId = props.serverClientId || config.extra?.googleAuth?.serverClientId;
    if (serverClientId) {
      infoConfig.modResults.GIDServerClientID = serverClientId;
    }

    // Add URL scheme for Google Sign-In (reversed client ID)
    const reversedClientId = iosClientId.split(".").reverse().join(".");

    if (!infoConfig.modResults.CFBundleURLTypes) {
      infoConfig.modResults.CFBundleURLTypes = [];
    }

    const existingIndex = infoConfig.modResults.CFBundleURLTypes.findIndex(
      (type) => type.CFBundleURLSchemes?.includes(reversedClientId)
    );

    if (existingIndex === -1) {
      infoConfig.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: [reversedClientId],
      });
    }

    return infoConfig;
  });
}

module.exports = function withGoogleAuth(config, props = {}) {
  return withPlugins(config, [
    [withAndroidGoogleAuth, props],
    [withIosGoogleAuth, props],
  ]);
};

function upsertMetaData(metaDataEntries, name, value) {
  const existing = metaDataEntries.find((entry) => entry.$["android:name"] === name);
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
