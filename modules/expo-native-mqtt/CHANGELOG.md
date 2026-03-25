# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-25

### Added
- Initial release of `expo-native-mqtt`
- Android implementation using HiveMQ MQTT Client
- iOS implementation using CocoaMQTT
- Support for persistent sessions (`cleanSession: false`) for offline message delivery
- Automatic background reconnection and resubscription handled at native layer
