import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { MaterialIcons as iconFont } from "@expo/vector-icons";
import { getColors } from "@/src/static/colors";

export default function TabLayout() {
  const colors = getColors();
  return (
    <NativeTabs
      tintColor={colors.accentPrimary}
      backgroundColor={colors.backgroundPrimary}
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
