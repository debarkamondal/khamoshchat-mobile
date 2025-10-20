import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { MaterialIcons as iconFont } from "@expo/vector-icons";
import { getColors } from "@/src/static/colors";
import { PlatformColor, useColorScheme } from "react-native";

export default function TabLayout() {
  const colors = getColors();
  const scheme = useColorScheme();
  return (
    <NativeTabs
      tintColor={colors.accentPrimary}
      backgroundColor={
        scheme === "dark"
          ? PlatformColor("@android:color/system_accent1_900")
          : PlatformColor("@android:color/system_accent1_400")
      }
      indicatorColor={
        scheme === "dark"
          ? PlatformColor("@android:color/system_accent1_800")
          : PlatformColor("@android:color/system_accent1_500")
      }
    >
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
