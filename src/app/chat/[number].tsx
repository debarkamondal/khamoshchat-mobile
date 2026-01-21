import StyledButton from "@/src/components/StyledButton";
import StyledText from "@/src/components/StyledText";
import StyledTextInput from "@/src/components/StyledTextInput";
import { useTheme, useThemedStyles } from "@/src/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as Contacts from "expo-contacts";
import { Buffer } from "buffer";
import { View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useSession from "@/src/store/session";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";

export default function Chat() {
  const { colors } = useTheme();
  const session = useSession();
  const { number, id }: { number: string; id: string } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>();

  const fetchChats = () => [];

  // Helper function to serialize Bob's key bundle
  const serializeBobBundle = (
    identityKey: Uint8Array,
    spkId: number,
    spkPublic: Uint8Array,
    signature: Uint8Array,
    otkId: number,
    otkPublic: Uint8Array | null,
    hasOpk: boolean
  ): Uint8Array => {
    const size = hasOpk ? 200 : 168;
    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set(identityKey, 0);           // 0-31: identityKey (32 bytes)
    view.setUint32(32, spkId, true);     // 32-35: spkId (4 bytes, little-endian)
    bytes.set(spkPublic, 36);            // 36-67: spkPublic (32 bytes)
    bytes.set(signature, 68);            // 68-163: signature (96 bytes)
    view.setUint32(164, otkId, true);    // 164-167: otkId (4 bytes, little-endian)
    if (hasOpk && otkPublic) {
      bytes.set(otkPublic, 168);         // 168-199: otkPublic (32 bytes)
    }
    return bytes;
  };

  type PreKeyBundle = {
    identityKey: string;
    signature: string;
    signedPreKey: string;
    otk: {
      id: number;
      key: string;
    };
  };

  const sendMessage = async () => {
    const sign = await LibsignalDezireModule.vxeddsaSign(session.preKey, new TextEncoder().encode(number))
    const body = {
      phone: session.phone.countryCode + session.phone.number,
      signature: Buffer.from(sign.signature).toString('base64'),
      vrf: Buffer.from(sign.vrf).toString('base64'),
    };
    console.log(body);

    let preKeyBundle: PreKeyBundle | undefined;
    if (fetchChats().length === 0) {
      const res = await fetch(`https://identity.dkmondal.in/test/bundle/${number}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        preKeyBundle = await res.json();
      } else {
        console.log("Failed to fetch bundle:", await res.text());
      }
    }

    if (preKeyBundle) {
      const hasOpk = true;
      const bobBundle = serializeBobBundle(
        Buffer.from(preKeyBundle.identityKey, 'base64'),
        1, // spkId - hardcoded for now, adjust as needed
        Buffer.from(preKeyBundle.signedPreKey, 'base64'),
        Buffer.from(preKeyBundle.signature, 'base64'),
        preKeyBundle.otk.id,
        Buffer.from(preKeyBundle.otk.key, 'base64'),
        hasOpk
      );

      const result = await LibsignalDezireModule.x3dhInitiator(
        session.iKey,
        bobBundle,
        hasOpk
      );
      console.log("x3dhInitiator result:", result);
    }
  };
  useEffect(() => {
    fetchChats();
    (async () => {
      // console.log(typeof urlParam.id);
      const data = await Contacts.getContactByIdAsync(id.split("/")[0]);
      setName(data?.firstName + " " + data?.lastName);
    })();
  }, []);

  // Theme-dependent styles (memoized by theme)
  const themedStyles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
  }));

  // Insets-dependent styles (memoized by insets)
  const messageBarInsetStyle = useMemo(() => ({
    paddingBottom: insets.bottom,
  }), [insets.bottom]);
  return (
    <SafeAreaView style={themedStyles.container}>
      <View style={styles.header}>
        <StyledButton onPress={() => router.back()} variant="link">
          <Ionicons
            color={colors.accentPrimary}
            name="chevron-back"
            size={24}
          />
        </StyledButton>
        <StyledText style={styles.image}>
          <Ionicons name="search" size={24} />
        </StyledText>
        <StyledText>{name}</StyledText>
      </View>
      <View
        style={StyleSheet.flatten([
          messageBarInsetStyle,
          styles.messageBar,
        ])}
      >
        <StyledTextInput
          style={styles.messageInput}
          placeholder={"Send message"}
        />
        <StyledButton
          onPress={() => sendMessage()}
          style={styles.messageButton}
        >
          <StyledText>
            <Ionicons name="send" size={24} />
          </StyledText>
        </StyledButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  image: {
    margin: 8,
  },
  header: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    margin: 4,
    borderRadius: 25,
  },
  messageBar: {
    flex: 0,
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    flexDirection: "row",
  },
  messageInput: {
    borderRadius: 25,
    padding: 12,
    flexGrow: 1,
    margin: 4,
  },
});
