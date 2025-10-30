import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import useSession from "./../store/session";
import { ThemeProvider, useTheme } from "@/src/hooks/useTheme";
import { Platform } from "react-native";
import { isLiquidGlassAvailable } from "expo-glass-effect";

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // setColors();

  const { isRegistered } = useSession();
  SplashScreen.hide();
  // Use useTheme hook for style context
  // const colors = getColors();

  return (
    <ThemeProvider>
      <InnerLayout isRegistered={isRegistered} />
    </ThemeProvider>
  );
}

function InnerLayout({ isRegistered }: { isRegistered: boolean }) {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isRegistered}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[number]" />
        <Stack.Screen
          name="contacts"
          options={{
            sheetGrabberVisible: true,
            sheetAllowedDetents: Platform.OS === "ios" ? [0.7, 0.95] : [1],
            presentation: Platform.OS === "ios" ? "formSheet" : "modal",
            // headerTransparent: Platform.OS === "ios" ? true : false,
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.backgroundPrimary,
            },
            headerStyle: {
              backgroundColor:
                Platform.OS === "ios"
                  ? "transparent"
                  : colors.backgroundPrimary,
            },
            headerBlurEffect: isLiquidGlassAvailable() ? undefined : "dark", // or based on your color scheme
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isRegistered}>
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
