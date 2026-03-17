import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import useSession from "./../store/useSession";
import { Platform } from "react-native";
import { ThemeProvider, useTheme } from "@/src/hooks/useTheme";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import useMqtt from "@/src/hooks/useMqtt";
import { openPrimaryDatabase } from "@/src/utils/storage";

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated } = useSession();
  SplashScreen.hide();

  return (
    <ThemeProvider>
      <InnerLayout isAuthenticated={isAuthenticated} />
    </ThemeProvider>
  );
}

function InnerLayout({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { colors } = useTheme();
  const session = useSession();
  const hasMessagingIdentity = Boolean(
    session.phone.countryCode && session.phone.number,
  );
  const topic = hasMessagingIdentity
    ? session.phone.countryCode + session.phone.number
    : "";

  // Consolidated hook handles connection + store sync + message listening
  useMqtt(isAuthenticated && hasMessagingIdentity ? topic : "");

  // Open primary database for chat list
  useEffect(() => {
    if (isAuthenticated) {
      openPrimaryDatabase().catch(e =>
        console.warn('Failed to open primary database', e)
      );
    }
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[number]" />
        <Stack.Screen
          name="contacts"
          options={{
            sheetGrabberVisible: true,
            sheetAllowedDetents: Platform.OS === "ios" ? [0.7, 0.95] : [1],
            presentation: Platform.OS === "ios" ? "formSheet" : "modal",
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background as string,
            },
            headerStyle: {
              backgroundColor:
                Platform.OS === "ios"
                  ? "transparent"
                  : colors.background as string,
            },
            headerBlurEffect: isLiquidGlassAvailable() ? undefined : "dark",
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="register/index" />
      </Stack.Protected>
    </Stack>
  );
}
