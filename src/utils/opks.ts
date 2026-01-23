import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { setItemAsync } from "expo-secure-store";
const genOpks = async () => {
  const opksPub: string[] = []

  for (let i = 0; i < 25; i++) {
    const keyPair = await LibsignalDezireModule.genKeyPair();
    opksPub.push(btoa(String.fromCharCode(...keyPair.public)))
    await setItemAsync(
      `opks-${i}`,
      btoa(String.fromCharCode(...keyPair.secret)),
    );
  }
  return opksPub;
};
export { genOpks };
