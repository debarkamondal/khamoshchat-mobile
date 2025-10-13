import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { MaterialIcons as iconFont } from "@expo/vector-icons";

import * as SplashScreen from "expo-splash-screen";
// import { useEffect } from 'react';
import connectMqttServer from "./../../hooks/connectMqttServer";

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

export default async function TabLayout() {
  const { isConnected } = connectMqttServer();
  if (isConnected) SplashScreen.hide();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Personal</Label>
        <Icon src={<VectorIcon family={iconFont} name="person-outline" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="groups">
        <Icon src={<VectorIcon family={iconFont} name="group" />} />
        <Label>Groups</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calls">
        <Icon src={<VectorIcon family={iconFont} name="call" />} />
        <Label>Calls</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
