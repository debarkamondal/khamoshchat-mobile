Pod::Spec.new do |s|
  s.name           = 'LibsignalDezire'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"

  s.vendored_libraries = "rust/liblibsignal_dezire.a"
  
  s.public_header_files = "rust/libsignal-dezire.h"
  
end
