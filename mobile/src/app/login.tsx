import { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { OAUTH } from "@/lib/config";
import { errorMessage } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { colors, gradients, radius, space } from "@/lib/theme";
import type { AuthResponse, Providers } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Mandala } from "@/components/Mandala";
import { Txt } from "@/components/Txt";
import { Button, LotusDivider } from "@/components/ui";
import { AppleMark, FacebookMark, GoogleMark } from "@/components/Icon";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

WebBrowser.maybeCompleteAuthSession();

type Finish = (fn: () => Promise<AuthResponse>) => Promise<void>;

// The OAuth hooks throw when their client id is missing, so each lives in its own
// component that is only mounted when that provider is configured.
function GoogleButton({ finish, busy }: { finish: Finish; busy: boolean }) {
  const { t } = useTranslation();
  const [request, response, prompt] = Google.useIdTokenAuthRequest({
    webClientId: OAUTH.googleWebClientId || undefined,
    iosClientId: OAUTH.googleIosClientId || undefined,
    androidClientId: OAUTH.googleAndroidClientId || undefined,
  });
  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) void finish(() => api.google(response.params.id_token, currentLang()));
  }, [response, finish]);
  return <Button kind="outline" title={t("auth.google")} left={<GoogleMark />} disabled={!request || busy} onPress={() => prompt()} style={styles.social} />;
}

function FacebookButton({ finish, busy }: { finish: Finish; busy: boolean }) {
  const { t } = useTranslation();
  const [request, response, prompt] = Facebook.useAuthRequest({ clientId: OAUTH.facebookAppId });
  useEffect(() => {
    if (response?.type !== "success") return;
    const token = response.authentication?.accessToken ?? response.params.access_token;
    if (token) void finish(() => api.facebook(token, currentLang()));
  }, [response, finish]);
  return <Button kind="outline" title={t("auth.facebook")} left={<FacebookMark />} disabled={!request || busy} onPress={() => prompt()} style={styles.social} />;
}

function AppleButton({ finish, busy }: { finish: Finish; busy: boolean }) {
  const { t } = useTranslation();
  const [available, setAvailable] = useState(false);
  useEffect(() => { AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => {}); }, []);
  if (!available) return null;
  const signIn = async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!cred.identityToken) return;
      const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(" ") || undefined;
      await finish(() => api.apple(cred.identityToken!, name, currentLang()));
    } catch (e) {
      if ((e as { code?: string }).code !== "ERR_REQUEST_CANCELED") Alert.alert(t("auth.failed"), errorMessage(e, t));
    }
  };
  return (
    <Button kind="secondary" title={t("auth.apple")} left={<AppleMark />} disabled={busy} onPress={signIn} style={styles.social} />
  );
}

export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [providers, setProviders] = useState<Providers | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.providers().then(setProviders).catch(() => setProviders({ google: false, facebook: false, apple: false, email: true, demo: false })); }, []);

  const finish: Finish = async (fn) => {
    setBusy(true);
    try {
      await signIn(await fn());
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert(t("auth.failed"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  const hasGoogle = providers?.google && (OAUTH.googleWebClientId || OAUTH.googleIosClientId || OAUTH.googleAndroidClientId);
  const hasFacebook = providers?.facebook && OAUTH.facebookAppId;

  return (
    <LinearGradient colors={gradients.maroon} style={{ flex: 1 }}>
      <View style={styles.mandala} pointerEvents="none"><Mandala size={560} color={colors.goldLight} opacity={0.16} /></View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <LanguageSwitcher compact />
          <View style={styles.logoWrap}><Logo size={148} /></View>
          <Txt variant="display" color={colors.goldLight} center>{t("app.name")}</Txt>
          <Txt color={colors.sandal} center style={{ maxWidth: 300 }}>{t("app.tagline")}</Txt>
        </View>

        <View style={styles.sheet}>
          <Txt variant="title" center>{t("auth.welcome")}</Txt>
          <Txt variant="caption" center>{t("auth.subtitle")}</Txt>
          <View style={{ gap: space.md, marginTop: space.sm }}>
            {Platform.OS === "ios" && providers?.apple ? <AppleButton finish={finish} busy={busy} /> : null}
            {hasGoogle ? <GoogleButton finish={finish} busy={busy} /> : null}
            {hasFacebook ? <FacebookButton finish={finish} busy={busy} /> : null}
            <Button kind="primary" icon="mail" title={t("auth.email")} disabled={busy} onPress={() => router.push("/email-auth")} />
            {providers?.demo ? (
              <>
                <LotusDivider />
                <Button kind="ghost" icon="sparkle" title={t("auth.demo")} loading={busy} onPress={() => finish(() => api.demo(currentLang()))} />
              </>
            ) : null}
          </View>
          <Txt variant="caption" center style={{ marginTop: space.sm, fontSize: 11.5 }}>{t("auth.terms")}</Txt>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: "space-between" },
  mandala: { position: "absolute", top: -110, alignSelf: "center" },
  hero: { alignItems: "center", gap: space.sm, paddingTop: space.lg, paddingHorizontal: space.lg },
  logoWrap: { marginTop: space.lg, marginBottom: space.sm, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  sheet: {
    backgroundColor: colors.cream, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, gap: space.xs,
    borderTopWidth: 3, borderColor: colors.gold,
  },
  social: {},
});
