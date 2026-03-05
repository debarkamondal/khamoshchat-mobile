import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "@/src/hooks/useTheme";

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <NativeTabs
      tintColor={colors.onPrimary}
      backgroundColor={colors.surface}
      indicatorColor={colors.primaryContainer}
      iconColor={{
        default: colors.onSurfaceVariant,
        selected: colors.onPrimaryContainer as string,
      }}
      labelStyle={{
        default: { color: colors.onSurfaceVariant },
        selected: { color: colors.onPrimaryContainer as string, fontWeight: "600" },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person" md="person_outline" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="groups">
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
        <NativeTabs.Trigger.Label>Groups</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calls">
        <NativeTabs.Trigger.Icon sf="phone" md="call" />
        <NativeTabs.Trigger.Label>Calls</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
