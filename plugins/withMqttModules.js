/**
 * Expo config plugin to enable modular headers for MqttCocoaAsyncSocket.
 *
 * CocoaMQTT depends on MqttCocoaAsyncSocket, which requires :modular_headers => true
 * when building with static frameworks libraries on iOS.
 */
const { withPodfile, withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withMqttModules(config) {
  // 1) iOS podfile update
  config = withPodfile(config, (podfileConfig) => {
    let podfile = podfileConfig.modResults.contents;

    const snippet = `\n  # [withMqttModules] Enable modular headers for CocoaMQTT dependency\n  pod 'MqttCocoaAsyncSocket', :modular_headers => true`;

    const expoModulesRegex = /(use_expo_modules!)/;
    if (expoModulesRegex.test(podfile)) {
      podfile = podfile.replace(expoModulesRegex, `$1${snippet}`);
    }

    podfileConfig.modResults.contents = podfile;
    return podfileConfig;
  });

  // 2) Android build.gradle update
  config = withAppBuildGradle(config, (gradleConfig) => {
    let buildGradle = gradleConfig.modResults.contents;

    const packagingSnippet = `
    packaging {
        resources {
            excludes += "**/INDEX.LIST"
            excludes += "**/io.netty.versions.properties"
            excludes += "META-INF/io.netty.versions.properties"
        }
    }
`;

    // Inject right inside the android { block
    const androidRegex = /(android\s*\{)/;
    if (androidRegex.test(buildGradle)) {
      buildGradle = buildGradle.replace(androidRegex, `$1${packagingSnippet}`);
    }

    gradleConfig.modResults.contents = buildGradle;
    return gradleConfig;
  });

  return config;
};
