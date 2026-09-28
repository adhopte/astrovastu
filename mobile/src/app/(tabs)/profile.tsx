import { Alert, Image, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, errorMessage } from "@/lib/useApi";
import { colors, radius, space } from "@/lib/theme";
import { Button, Card, LotusDivider, Row, Screen, SectionTitle } from "@/components/ui";
import { Txt } from "@/components/Txt";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

const PROVIDER_NAME: Record<string, string> = { google: "Google", facebook: "Facebook", apple: "Apple", email: "Email" };

export default function Profile() {
  const { t } = useTranslation();
  const { user, signOut, deleteAccount, changeLanguage } = useAuth();
  const me = useApi(() => api.me(), [], { refetchOnFocus: true });
  if (!user) return null;

  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const stats = me.data?.stats;

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };
  const remove = () =>
    Alert.alert(t("profile.deleteAccount"), t("profile.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"), style: "destructive", onPress: async () => {
          try {
            await deleteAccount();
            router.replace("/login");
          } catch (e) { Alert.alert(t("common.error"), errorMessage(e, t)); }
        },
      },
    ]);

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: space.sm }}>
        {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatar} /> : (
          <View style={[styles.avatar, styles.initials]}><Txt variant="title" color={colors.cream}>{initials}</Txt></View>
        )}
        <Txt variant="title" center>{user.name}</Txt>
        {user.email ? <Txt variant="caption">{user.email}</Txt> : null}
        {user.providers.length ? <Txt variant="caption">{t("profile.signedInWith", { providers: user.providers.map((p) => PROVIDER_NAME[p] ?? p).join(", ") })}</Txt> : null}
      </Card>

      <SectionTitle title={t("profile.language")} />
      <LanguageSwitcher compact onChange={(l) => { void changeLanguage(l); }} />

      <SectionTitle title={t("profile.stats")} />
      <Row gap={space.md}>
        {([["kundalis", stats?.kundalis], ["plans", stats?.vastu], ["consultations", stats?.consultations]] as const).map(([k, v]) => (
          <Card key={k} style={{ flex: 1, alignItems: "center", paddingVertical: space.md }}>
            <Txt variant="title" color={colors.saffronDeep}>{v ?? "–"}</Txt>
            <Txt variant="caption" center numberOfLines={1}>{t(`profile.${k}`)}</Txt>
          </Card>
        ))}
      </Row>

      <View style={{ gap: space.md, marginTop: space.sm }}>
        <Button kind="outline" icon="logout" title={t("profile.logout")} onPress={logout} />
        <Button kind="ghost" icon="trash" title={t("profile.deleteAccount")} onPress={remove} />
      </View>

      <LotusDivider />
      <View style={{ alignItems: "center", gap: space.xs }}>
        <Logo size={48} />
        <Txt variant="caption">{t("profile.version", { v: Constants.expoConfig?.version ?? "1.0.0" })}</Txt>
        <Txt variant="caption" center style={{ paddingHorizontal: space.lg }}>{t("profile.disclaimer")}</Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 84, height: 84, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.gold },
  initials: { backgroundColor: colors.maroon, alignItems: "center", justifyContent: "center" },
});
