
# Khamosh 🤫!!!

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-55-blue?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react)](https://reactnative.dev)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-orange.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey)]()
[![Signal Protocol](https://img.shields.io/badge/Encryption-Signal_Protocol-green?logo=signal)](https://signal.org/docs/)

**Khamosh-chat** is an app where staying ***Khamosh*** 🤫 (Hindi: silent) is a sin — because nobody is listening.
A safe & secure world for just the two of you and nobody else.

Built with end-to-end encryption powered by the Signal Protocol, this is a privacy-first chat app that takes your conversations seriously (even if you don't 😏).

> ***Ekdum Khamosh nahi rehneka !!!***

Built with ❤️ in **India**, for the **world**.

---

## Features

### Current
- [x] One-to-one: text messages *(partially working — actively under development)*
- [x] End-to-end encryption via Signal Protocol (X3DH + Double Ratchet)
- [x] Encrypted local storage (SQLCipher)
- [x] Contact syncing
- [x] Dark & light theme support

### Roadmap
- [ ] Voice notes
- [ ] File sharing
- [ ] Voice & video calls (WebRTC)
- [ ] Group chats (many-to-many messaging)
- [ ] Post-quantum security
- [ ] Multi-device support

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Expo](https://expo.dev) (SDK 55) with [Expo Router](https://docs.expo.dev/router/introduction/) |
| **UI** | React Native 0.83, React 19 with Reanimated animations |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Crypto** | [Signal Protocol](https://signal.org/docs/) — X3DH, Double Ratchet, VXEdDSA |
| **Native Crypto Module** | Rust (via [libsignal-dezire](https://github.com/debarkamondal/libsignal-dezire) submodule) |
| **Transport** | MQTT over TLS |
| **Local Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) with SQLCipher encryption |
| **Secure Storage** | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) for key material |

---

## Architecture

```
khamoshchat-mobile/
├── src/
│   ├── app/                  # Expo Router screens & layouts
│   │   ├── (tabs)/           # Tab-based navigation (home, settings)
│   │   ├── chat/             # Chat conversation screen
│   │   ├── register/         # User registration flow
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # Reusable UI components
│   │   ├── ChatBubble.tsx    # Message bubble
│   │   ├── OtpInput.tsx      # OTP verification input
│   │   ├── StyledButton.tsx  # Themed button
│   │   └── ...
│   ├── hooks/                # Custom React hooks (theming, etc.)
│   ├── store/                # Zustand state stores
│   ├── utils/
│   │   ├── crypto/           # Signal protocol implementation
│   │   │   ├── x3dh.ts       # X3DH key agreement
│   │   │   ├── ratchet.ts    # Double Ratchet algorithm
│   │   │   └── ...
│   │   ├── transport/        # MQTT client & messaging transport
│   │   ├── storage/          # SQLite database layer (SQLCipher)
│   │   ├── messaging/        # Message encoding & handling
│   │   └── helpers/          # Utility functions
│   ├── assets/               # Images, fonts, and static assets
│   └── polyfills/            # Platform polyfills
├── modules/
│   └── libsignal-dezire/     # Expo native module (Rust → native bridge)
├── libsignal-dezire/         # Git submodule — Rust crypto library
├── scripts/                  # Cargo build scripts for iOS & Android
└── app.json                  # Expo configuration
```

---

## Getting Started

### Prerequisites

- **Bun** — ([install from bun.sh](https://bun.sh))
- A physical device or emulator/simulator set up for development
- [Set up your development environment](https://docs.expo.dev/get-started/set-up-your-environment/) if this is your first time with Expo

> [!IMPORTANT]
> This project uses an **Expo development build** (not Expo Go). You will need to build a custom dev client before running the app.

### 1. Clone the repository

```bash
git clone https://github.com/debarkamondal/khamoshchat-mobile.git
cd khamoshchat-mobile
```

### 2. Install dependencies

```bash
bun install
```

### 3. (Optional) Clone the native crypto submodule

The prebuilt binaries for the native crypto module ([libsignal-dezire](https://github.com/debarkamondal/libsignal-dezire)) are already included in the repository, so this step is optional. If you want to build the Rust crypto library from source (requires a **Rust toolchain** with cross-compilation targets), initialize the submodule:

```bash
git submodule update --init --recursive
```

### 4. Build & run the dev client

**If you skipped step 3** (using the prebuilt binaries — most users):

```bash
bunx expo run:android    # Android
bunx expo run:ios        # iOS
```

**If you cloned the submodule** (building native module from source):

```bash
bun android      # Build native module + run on Android
bun ios-sim      # Build native module + run on iOS Simulator
bun ios          # Build native module + run on iOS device
```

You can also compile the native binaries without launching the app:

```bash
bun cargo-build-android   # Compile for Android
bun cargo-build-ios       # Compile for iOS
```

---

## Signal Protocol Implementation

The encryption layer follows the [Signal Protocol specification](https://signal.org/docs/):

- **X3DH** — Extended Triple Diffie-Hellman for asynchronous key agreement
- **Double Ratchet** — Forward & backward secrecy for every message
- **VXEdDSA** — For signing & authentication

Cryptographic operations are handled by a custom Rust library ([libsignal-dezire](https://github.com/debarkamondal/libsignal-dezire)) exposed to React Native as an Expo native module.

---

## Backend

The server-side infrastructure uses [VerneMQ](https://vernemq.com/) as the MQTT broker, secured with TLS for all client connections. Messages are relayed in real-time over MQTT — the broker never has access to plaintext message content thanks to the end-to-end encryption handled entirely on the client side.

> The backend is intentionally minimal by design. The broker acts as a dumb pipe — it routes encrypted blobs between clients and that's it. Your messages, your keys, your business 🤫.

---

## Acknowledgements

This project stands on the shoulders of some incredible open-source work:

- **[Signal Protocol](https://signal.org/docs/)** — for pioneering the gold standard in end-to-end encryption
- **[Expo](https://expo.dev)** — for making cross-platform React Native development a joy
- **[VerneMQ](https://vernemq.com/)** — for a rock-solid, scalable MQTT broker
- **[Zustand](https://github.com/pmndrs/zustand)** — for delightfully simple state management
- **[mqtt.js](https://github.com/mqttjs/MQTT.js)** — for the MQTT client that keeps everything connected
---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)** — see the [LICENSE](LICENSE) file for details.

**TL;DR:** You're free to use, modify, and distribute this software, but the source code must remain free and open source. If you run a modified version on a server, you must share the source. Because privacy should be everyone's right, not just a feature 🤫.
