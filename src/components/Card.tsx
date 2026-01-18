import { StyleProp, StyleSheet, View } from "react-native";
import { ReactNode } from "react";
import { ViewStyle } from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import { useThemedStyles } from "@/src/hooks/useTheme";

export default function Card({
  children,
  styles,
}: {
  styles?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const themedStyle = useThemedStyles((colors) => ({
    default: {
      marginVertical: 4,
      padding: 4,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
  }));
  return (
    <View style={StyleSheet.flatten([themedStyle.default, styles])}>
      {children}
    </View>
  );
}
