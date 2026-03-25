Pod::Spec.new do |s|
  s.name           = 'ExpoNativeMqtt'
  s.version        = '1.0.0'
  s.summary        = 'Native MQTT client for Expo'
  s.description    = 'Native MQTT client for Expo using CocoaMQTT internally'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.0'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'CocoaMQTT', '~> 2.1'

  s.source_files = "**/*.{h,m,mm,swift}"
end
