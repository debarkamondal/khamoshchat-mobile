import { Platform, PlatformColor, useColorScheme } from "react-native";

let colors: { [key: string]: any } = {};

type colorGroup = {
  [key: string]: {
    ios: string;
    android: string;
    fallback: {
      light: string;
      dark: string;
    };
  };
};

const requiredColors: colorGroup = {
  textPrimary: {
    ios: "label",
    android: "?attr/colorForeground",
    fallback: {
      light: "#FFFFFF",
      dark: "#000000",
    },
  },
  backgroundPrimary: {
    ios: "systemBackground",
    android: "?attr/colorBackground",
    fallback: {
      light: "",
      dark: "",
    },
  },
  accentPrimary: {
    ios: "systemYellow",
    android: "@android:color/holo_orange_light",
    fallback: {
      light: "",
      dark: "",
    },
  },
  border: {
    ios: "separator",
    android: "@android:color/system_neutral1_300",
    fallback: {
      dark: "",
      light: "",
    },
  },
};

const setColors = () => {
  const scheme = useColorScheme();
  const platform = Platform.OS;
  for (let color in requiredColors) {
    if (platform === "ios")
      colors[color] = PlatformColor(requiredColors[color].ios);
    else if (platform === "android")
      colors[color] = PlatformColor(requiredColors[color].android);
    else
      colors[color] = requiredColors[color].fallback[scheme ? scheme : "light"];
  }
};
const getColors = () => {
  return colors;
};

export { getColors, setColors };
