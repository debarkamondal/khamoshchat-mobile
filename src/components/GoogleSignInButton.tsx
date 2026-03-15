import { useEffect } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { Color } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import StyledText from "@/src/components/StyledText";
import { useTheme } from "@/src/hooks/useTheme";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_WEB_CLIENT_ID";

export default function GoogleSignInButton() {
    const { colors } = useTheme();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB,
        clientSecret: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET_WEB,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID,
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { authentication } = response;
            console.log("Google auth success:", authentication);
            Alert.alert(
                "Google Sign-In",
                "Signed in successfully! Check console for token details.",
            );
        } else if (response?.type === "error") {
            console.error("Google auth error:", response.error);
            Alert.alert("Sign-In Error", response.error?.message ?? "Something went wrong.");
        }
    }, [response]);

    return (
        <Pressable
            disabled={!request}
            onPress={() => promptAsync()}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: Platform.select({
                        ios: Color.ios.secondarySystemBackground,
                        android: Color.android.dynamic.surfaceContainerLow,
                        default: "#FFFFFF",
                    }),
                    borderColor: Platform.select({
                        ios: Color.ios.separator,
                        android: Color.android.dynamic.outlineVariant,
                        default: "#DADCE0",
                    }),
                    opacity: pressed ? 0.7 : !request ? 0.5 : 1,
                    transform: pressed ? [{ scale: 0.97 }] : [{ scale: 1 }],
                },
            ]}
        >
            <View style={styles.googleIconContainer}>
                <StyledText style={styles.googleG}>G</StyledText>
            </View>
            <StyledText
                style={[
                    styles.label,
                    {
                        color: Platform.select({
                            ios: Color.ios.label,
                            android: Color.android.dynamic.onSurface,
                            default: "#1F1F1F",
                        }),
                    },
                ]}
            >
                Sign in with Google
            </StyledText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "70%",
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderCurve: "continuous",
    },
    googleIconContainer: {
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    googleG: {
        fontSize: 18,
        fontWeight: "700",
        color: "#4285F4",
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
    },
});
