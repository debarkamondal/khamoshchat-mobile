/**
 * Expo config plugin to enable modular headers for MqttCocoaAsyncSocket.
 *
 * CocoaMQTT depends on MqttCocoaAsyncSocket, which requires :modular_headers => true
 * when building with static frameworks libraries on iOS.
 */
const { withPodfile, withGradleProperties } = require("@expo/config-plugins");

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

  // 2) Android gradle.properties update
  config = withGradleProperties(config, (propertiesConfig) => {
    let properties = propertiesConfig.modResults;

    const existingExclude = properties.find(p => p.name === 'android.packagingOptions.excludes');
    if (existingExclude) {
      if (!existingExclude.value.includes('**/INDEX.LIST')) {
        existingExclude.value += ',**/INDEX.LIST';
      }
    } else {
      properties.push({
        name: 'android.packagingOptions.excludes',
        value: '**/INDEX.LIST',
        type: 'property'
      });
    }

    propertiesConfig.modResults = properties;
    return propertiesConfig;
  });

  return config;
};
