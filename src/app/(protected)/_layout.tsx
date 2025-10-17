import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { MaterialIcons as iconFont } from "@expo/vector-icons";

// import { useEffect } from 'react';
// import useSession from "@/src/store/session";

export default function TabLayout() {
  // const { markSessionUnregistered } = useSession();
  // markSessionUnregistered();

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
