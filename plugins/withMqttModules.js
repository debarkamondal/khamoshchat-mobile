/**
 * Expo config plugin to enable Clang modules (including C++ modules)
 * for the MQTTClient and RNMqttClient pods.
 *
 * The MQTTClient pod's MQTTLog.h uses `@import Foundation;` which
 * requires both -fmodules and -fcxx-modules when compiled from .mm files.
 */
const { withPodfile } = require("@expo/config-plugins");

module.exports = function withMqttModules(config) {
  return withPodfile(config, (podfileConfig) => {
    let podfile = podfileConfig.modResults.contents;

    const snippet = `
    # [withMqttModules] Enable Clang modules for MQTTClient pod
    mqtt_targets = ['MQTTClient', 'RNMqttClient']
    installer.pods_project.targets.each do |target|
      if mqtt_targets.include?(target.name)
        target.build_configurations.each do |bc|
          bc.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          flags = bc.build_settings['OTHER_CFLAGS'] || '$(inherited)'
          unless flags.include?('-fcxx-modules')
            bc.build_settings['OTHER_CFLAGS'] = "\#{flags} -fmodules -fcxx-modules"
          end
        end
      end
    end`;

    // Insert right before the closing `end` of post_install
    const postInstallEndRegex = /(react_native_post_install\([\s\S]*?\n\s*\))\n(\s*end)/;
    if (postInstallEndRegex.test(podfile)) {
      podfile = podfile.replace(
        postInstallEndRegex,
        `$1\n${snippet}\n$2`
      );
    }

    podfileConfig.modResults.contents = podfile;
    return podfileConfig;
  });
};
