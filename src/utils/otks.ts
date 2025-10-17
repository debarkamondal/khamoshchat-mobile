import { ed25519 } from "@noble/curves/ed25519.js";
import { setItemAsync } from "expo-secure-store";
const genOtks = async () => {
  const otksPub: { [key: string]: string } = {};

  for (let i = 0; i < 25; i++) {
    const keyPair = ed25519.keygen();
    otksPub[`otks-${i}`] = btoa(String.fromCharCode(...keyPair.secretKey));
    await setItemAsync(
      `otks-${i}`,
      btoa(String.fromCharCode(...keyPair.secretKey)),
    );
  }
  return otksPub;
};
export { genOtks };
