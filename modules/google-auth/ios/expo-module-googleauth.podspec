Pod::Spec.new do |s|
  s.name           = 'expo-module-googleauth'
  s.version        = '1.0.0'
  s.summary        = 'Google Auth module for KhamoshChat'
  s.description    = 'Native Google Sign-In implementation for iOS'
  s.author         = 'Khamoshi'
  s.homepage       = 'https://github.com/khamoshi-org/khamoshchat-mobile'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleSignIn', '~> 7.0'

  # Swift configuration
  s.source_files = "**/*.{h,m,swift}"
end
