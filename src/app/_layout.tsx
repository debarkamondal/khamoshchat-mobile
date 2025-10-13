import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import useSession from "./../store/session";
import { setColors } from "../static/colors";

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  setColors();
  const { isRegistered } = useSession();
  if (!isRegistered) SplashScreen.hide();

  return (
    <Stack>
      <Stack.Protected guard={isRegistered}>
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isRegistered}>
        <Stack.Screen name="signin" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
