import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { getConsultation, logActivity } from "@/lib/store";
import { useLocal } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { colors, gradients, radius, space } from "@/lib/theme";
import { Button, Card, ErrorView, Loading, Row, Screen, Segmented, SectionTitle } from "@/components/ui";
import { Txt } from "@/components/Txt";
import { Icon } from "@/components/Icon";
import { Mandala } from "@/components/Mandala";
import { KundaliReportView } from "@/components/KundaliReportView";
import { VastuReportView } from "@/components/VastuReportView";

export default function CombinedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<"vastu" | "astro">("vastu");
  const { data, error, loading, reload } = useLocal(() => {
    const detail = getConsultation(id, currentLang());
    if (detail) logActivity("consultation.view", { type: "consultation", id });
    return detail;
  }, [id, i18n.language]);
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error || !data) return <Screen scroll={false}><ErrorView message={error ?? t("common.error")} onRetry={reload} /></Screen>;
  const { kundali, vastu, combined } = data;

  return (
    <Screen>
      {combined && (
        <LinearGradient colors={gradients.maroon} style={{ borderRadius: radius.lg, padding: space.lg, gap: space.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.gold }}>
          <View style={{ position: "absolute", right: -70, top: -70 }} pointerEvents="none"><Mandala size={240} color={colors.goldLight} opacity={0.2} /></View>
          <Txt variant="caption" color={colors.goldLight}>{t("both.personalised")}</Txt>
          <Txt variant="title" color={colors.cream}>{combined.title}</Txt>
          {combined.paragraphs.map((p, i) => <Txt key={i} color={colors.sandal}>{p}</Txt>)}
          <Txt variant="label" color={colors.goldLight}>{t("both.favourable")}</Txt>
          <Row style={{ flexWrap: "wrap" }}>
            {combined.favourableZones.map((z) => (
              <View key={z} style={{ backgroundColor: colors.goldLight, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 3 }}>
                <Txt variant="label" color={colors.maroonDeep}>{t(`zone.${z}`) === z ? z : `${t(`zone.${z}`)} · ${z}`}</Txt>
              </View>
            ))}
          </Row>
        </LinearGradient>
      )}
      {combined && combined.alerts.length > 0 && (
        <Card accent={colors.sindoor}>
          <Row><Icon name="alert" color={colors.sindoor} /><Txt variant="subheading">{t("both.alerts")}</Txt></Row>
          {combined.alerts.map((a, i) => <Txt key={i}>{a}</Txt>)}
        </Card>
      )}
      {combined && combined.supports.length > 0 && (
        <Card accent={colors.tulsi}>
          <Row><Icon name="check" color={colors.tulsi} /><Txt variant="subheading">{t("both.supports")}</Txt></Row>
          {combined.supports.map((a, i) => <Txt key={i}>{a}</Txt>)}
        </Card>
      )}

      <SectionTitle title={t("both.title")} />
      <Segmented value={tab} onChange={setTab} options={[{ value: "vastu", label: t("history.vastu") }, { value: "astro", label: t("history.astro") }]} />
      {tab === "vastu" && vastu && (
        <>
          <VastuReportView title={vastu.title} hasImage={vastu.hasImage} imageUri={vastu.imageUri} input={vastu.input} report={vastu.report} />
          <Button kind="outline" title={t("both.openVastu")} onPress={() => router.push(`/vastu/${vastu.id}`)} />
        </>
      )}
      {tab === "astro" && kundali && (
        <>
          <KundaliReportView chart={kundali.chart} report={kundali.report} name={kundali.name} />
          <Button kind="outline" title={t("both.openKundali")} onPress={() => router.push(`/astro/${kundali.id}`)} />
        </>
      )}
    </Screen>
  );
}
