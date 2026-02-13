import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { MaterialIcons as iconFont } from "@expo/vector-icons";
import { useTheme } from "@/src/hooks/useTheme";

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <NativeTabs
      tintColor={colors.tabBarIndicator}
      backgroundColor={colors.tabBarBackground}
      indicatorColor={colors.accentBackground}

    >
      <NativeTabs.Trigger name="index">
        <Label>Chats</Label>
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
