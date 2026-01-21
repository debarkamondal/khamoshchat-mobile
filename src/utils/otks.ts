import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { setItemAsync } from "expo-secure-store";
const genOtks = async () => {
  const otksPub: string[] = []

  for (let i = 0; i < 25; i++) {
    const keyPair = await LibsignalDezireModule.genKeyPair();
    otksPub.push(btoa(String.fromCharCode(...keyPair.public)))
    await setItemAsync(
      `otks-${i}`,
      btoa(String.fromCharCode(...keyPair.secret)),
    );
  }
  return otksPub;
};
export { genOtks };
