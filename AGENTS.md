# AGENTS.md - KhamoshChat Mobile

This document provides guidance for AI coding agents working in this codebase.

## Project Overview

KhamoshChat is a React Native mobile messaging app built with Expo SDK 54.
It uses the file-based routing system (expo-router) and includes a native Rust
module for Signal protocol cryptography (libsignal-dezire).

## Technology Stack

- **Runtime**: Expo SDK 54 with React 19.1 and React Native 0.81
- **Package Manager**: Bun (use `bun` for all package operations)
- **Routing**: expo-router v6 (file-based routing in `src/app/`)
- **State Management**: Zustand with expo-secure-store persistence
- **Language**: TypeScript with strict mode enabled
- **Native Code**: Expo modules with Rust FFI (libsignal-dezire)

## Build/Lint/Test Commands

```bash
# Development
bun start                    # Start Expo dev server
bun ios-sim                  # Build and run on iOS simulator
bun ios                      # Build and run on iOS device
bun android                  # Build and run on Android

# Linting
bun lint                     # Run ESLint (expo lint)

# Native module builds
bun cargo-build-ios          # Build Rust library for iOS
bun cargo-build-android      # Build Rust library for Android

# Package management
bun install                  # Install dependencies
bun add <package>            # Add a package
```

Note: No test framework is currently configured. If adding tests, use Jest
with `bun test` or configure expo testing utilities.

## Project Structure

```
src/
  app/                    # File-based routes (expo-router)
    (tabs)/               # Tab navigator group
    register/             # Registration flow
    chat/                 # Chat screens
    _layout.tsx           # Root layout
  components/             # Reusable UI components (Styled*)
  hooks/                  # Custom hooks (useTheme, etc.)
  store/                  # Zustand stores
  static/                 # Static data (colors, constants)
  utils/                  # Utility functions
  assets/                 # Images, fonts
  polyfills/              # Platform polyfills
modules/
  libsignal-dezire/       # Native Expo module (Rust FFI)
```

## Code Style Guidelines

### Imports

Order imports as follows (separated by blank lines):
1. React and React Native core
2. Expo packages
3. Third-party packages
4. Internal modules using `@/` path alias
5. Relative imports

```typescript
import React, { useState, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";

import { router } from "expo-router";
import * as Crypto from "expo-crypto";

import { MaterialIcons } from "@expo/vector-icons";

import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import StyledButton from "@/src/components/StyledButton";

import { getContacts } from "./getContacts";
```

### TypeScript

- Strict mode is enabled; avoid `any` types
- Define explicit types for function parameters and return values
- Use type exports alongside value exports: `export { getContacts, SplitContact }`
- Prefer interfaces for object shapes, types for unions/intersections
- Use `Uint8Array` for binary data (crypto operations)

### Naming Conventions

- **Files**: camelCase for utilities/hooks, PascalCase for components
- **Components**: PascalCase (`StyledButton`, `ContactModal`)
- **Hooks**: camelCase with `use` prefix (`useTheme`, `useSession`)
- **Stores**: camelCase with `use` prefix (`useSession`)
- **Types**: PascalCase (`KeyPair`, `SplitContact`, `ThemeColors`)
- **Constants**: UPPER_SNAKE_CASE or camelCase object exports

### Component Patterns

Use functional components with hooks. Export as default for route components:

```typescript
export default function ScreenName() {
  const { colors } = useTheme();
  // ...
}
```

For shared components, use named exports with default:

```typescript
const StyledButton = ({ style, variant = "default", ...props }) => {
  // ...
};
export default StyledButton;
```

### Styling

Use `useThemedStyles` hook for theme-aware styles (memoized):

```typescript
const styles = useThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
  },
}));
```

For dynamic styles based on props/state, use `useMemo` with `StyleSheet.create`:

```typescript
const dynamicStyle = useMemo(
  () => StyleSheet.create({ ... }),
  [colors, insets]
);
```

### Theme Colors

Access colors via the `useTheme` hook. Available semantic colors:
- Text: `textPrimary`, `textSecondary`, `textTertiary`
- Background: `backgroundPrimary`, `backgroundSecondary`, `backgroundTertiary`
- Accent: `accentPrimary`, `accentPrimaryDark`
- Semantic: `success`, `warning`, `error`, `info`
- UI: `card`, `border`, `overlay`, `shadow`

### State Management

Use Zustand stores in `src/store/`. Pattern with secure persistence:

```typescript
const useSession = create(
  persist<SessionType>(
    (set) => ({ ... }),
    {
      name: "session",
      storage: createJSONStorage(() => ({
        setItem,
        getItem,
        removeItem: deleteItemAsync,
      })),
    }
  )
);
export default useSession;
```

### Error Handling

Use `Alert.alert()` for user-facing errors in React Native:

```typescript
Alert.alert("Error", "Description of what went wrong", [
  { text: "OK", style: "cancel" },
]);
```

For async operations, use try/catch and handle errors gracefully.

### Platform-Specific Code

Use `Platform.OS` checks or platform-specific file extensions:
- `contacts.ios.tsx` - iOS-specific implementation
- `contacts.tsx` - Default/Android implementation

```typescript
import { Platform } from "react-native";

const styles = {
  bottom: Platform.OS === "ios" ? insets.bottom + 55 : insets.bottom + 120,
};
```

### Native Modules

The `libsignal-dezire` module provides cryptographic operations:

```typescript
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

const keypair = await LibsignalDezireModule.genKeyPair();
const signature = await LibsignalDezireModule.vxeddsaSign(key, message);
```

### Expo Router

Routes are defined by file structure in `src/app/`:
- `(tabs)/` - Tab group layout
- `[param].tsx` - Dynamic routes
- `_layout.tsx` - Layout wrappers

Use `Stack.Protected` for conditional route guards based on auth state.

## Important Notes

- React Compiler is enabled (`experiments.reactCompiler: true`)
- New Architecture is enabled (`newArchEnabled: true`)
- Typed routes enabled (`experiments.typedRoutes: true`)
- Use `expo-secure-store` for sensitive data persistence
- Avoid direct console.log in production code
