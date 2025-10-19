import { Platform, StyleProp, StyleSheet, View } from "react-native";
import { ReactNode } from "react";
import { ViewStyle } from "react-native/Libraries/StyleSheet/StyleSheetTypes";
export default function Card({
  children,
  styles,
}: {
  styles?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={StyleSheet.flatten([fixedStyle.default, styles])}>
      {children}
    </View>
  );
}
const fixedStyle = StyleSheet.create({
  default: {
    marginVertical: 4,
    padding: 4,
    borderRadius: 8,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)",
  },
});
