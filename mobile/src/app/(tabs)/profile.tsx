import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/lib/profile";
import { clearAllData, getStats, logActivity } from "@/lib/store";
import { useLocal } from "@/lib/useApi";
import { colors, radius, space } from "@/lib/theme";
import { Button, Card, Field, LotusDivider, Row, Screen, SectionTitle } from "@/components/ui";
import { Txt } from "@/components/Txt";
import { Icon } from "@/components/Icon";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

export default function Profile() {
  const { t } = useTranslation();
  const { profile, updateName, changeLanguage } = useProfile();
  const stats = useLocal(() => getStats(), [], { refetchOnFocus: true });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  if (!profile) return null;

  const initials = profile.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const saveName = () => {
    if (name.trim()) updateName(name.trim());
    setEditing(false);
  };

  const reset = () =>
    Alert.alert(t("profile.resetData"), t("profile.resetConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          clearAllData();
          logActivity("data.reset");
          router.replace("/welcome");
        },
      },
    ]);

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: space.sm }}>
        <View style={[styles.avatar, styles.initials]}>
          <Txt variant="title" color={colors.cream}>{initials}</Txt>
        </View>
        {editing ? (
          <View style={{ width: "100%", gap: space.sm }}>
            <Field label={t("auth.name")} value={name} onChangeText={setName} autoFocus onSubmitEditing={saveName} />
            <Row gap={space.sm}>
              <Button kind="outline" title={t("common.cancel")} onPress={() => { setEditing(false); setName(profile.name); }} style={{ flex: 1 }} />
              <Button title={t("common.save")} onPress={saveName} style={{ flex: 1 }} />
            </Row>
          </View>
        ) : (
          <Row gap={space.sm}>
            <Txt variant="title" center>{profile.name}</Txt>
            <Pressable hitSlop={10} onPress={() => setEditing(true)} accessibilityLabel={t("common.edit")}>
              <Icon name="edit" size={18} color={colors.inkMuted} />
            </Pressable>
          </Row>
        )}
      </Card>

      <SectionTitle title={t("profile.language")} />
      <LanguageSwitcher compact onChange={(l) => { void changeLanguage(l); }} />

      <SectionTitle title={t("profile.stats")} />
      <Row gap={space.md}>
        {(["kundalis", "plans", "consultations"] as const).map((k) => (
          <Card key={k} style={{ flex: 1, alignItems: "center", paddingVertical: space.md }}>
            <Txt variant="title" color={colors.saffronDeep}>{stats.data ? stats.data[k === "plans" ? "vastu" : k] : "–"}</Txt>
            <Txt variant="caption" center numberOfLines={1}>{t(`profile.${k}`)}</Txt>
          </Card>
        ))}
      </Row>

      <View style={{ gap: space.md, marginTop: space.sm }}>
        <Button kind="ghost" icon="trash" title={t("profile.resetData")} onPress={reset} />
      </View>

      <LotusDivider />
      <View style={{ alignItems: "center", gap: space.xs }}>
        <Logo size={48} />
        <Txt variant="caption">{t("profile.version", { v: Constants.expoConfig?.version ?? "1.0.0" })}</Txt>
        <Txt variant="caption" center style={{ paddingHorizontal: space.lg }}>{t("profile.offlineNote")}</Txt>
        <Txt variant="caption" center style={{ paddingHorizontal: space.lg }}>{t("profile.disclaimer")}</Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 84, height: 84, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.gold },
  initials: { backgroundColor: colors.maroon, alignItems: "center", justifyContent: "center" },
});
