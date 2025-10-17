import * as Crypto from "expo-crypto";

if (typeof global.crypto === "undefined") {
  global.crypto = {
    getRandomValues: (array) => {
      // Expo Crypto fills array with random bytes in place
      return Crypto.getRandomValues(array);
    },
  };
}
