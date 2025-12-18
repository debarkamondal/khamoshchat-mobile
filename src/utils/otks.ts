import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { setItemAsync } from "expo-secure-store";
const genOtks = async () => {
  const otksPub: { [key: string]: string } = {};

  for (let i = 0; i < 25; i++) {
    const keyPair = await LibsignalDezireModule.genKeyPair();
    otksPub[`otks-${i}`] = btoa(String.fromCharCode(...keyPair.public));
    await setItemAsync(
      `otks-${i}`,
      btoa(String.fromCharCode(...keyPair.secret)),
    );
  }
  return otksPub;
};
export { genOtks };
