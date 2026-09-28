import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/lib/profile";
import { listConsultations } from "@/lib/store";
import { useLocal } from "@/lib/useApi";
import { fmtDate } from "@/lib/format";
import type { ConsultationSummary } from "@/lib/types";
import { currentLang } from "@/i18n";
import { colors, gradients, radius, shadow, space } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import { Mandala } from "@/components/Mandala";
import { Txt } from "@/components/Txt";
import { Icon } from "@/components/Icon";
import { Card, LotusDivider, Row, Screen, SectionTitle } from "@/components/ui";
import { ConsultationRow } from "@/components/ConsultationRow";

/** Kundali diamond motif for the astro card. */
function AstroArt() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Path d="M4 4h56v56H4z M4 4l56 56 M60 4 4 60 M32 4l28 28-28 28L4 32z" stroke={colors.goldLight} strokeWidth={2.2} fill="none" />
      <Circle cx={32} cy={20} r={3.5} fill={colors.goldLight} />
    </Svg>
  );
}

/** 16-spoke compass motif for the vastu card. */
function VastuArt() {
  return (
    <Svg width={64} height={64} viewBox="-32 -32 64 64">
      <Circle r={28} stroke={colors.goldLight} strokeWidth={2.2} fill="none" />
      {Array.from({ length: 16 }, (_, i) => (
        <Path key={i} d={`M0 0 L0 ${i % 4 === 0 ? -28 : -18}`} stroke={colors.goldLight} strokeWidth={i % 4 === 0 ? 2.4 : 1.2} transform={`rotate(${i * 22.5})`} />
      ))}
      <Path d="M0 -24 L5 -6 L-5 -6 Z" fill={colors.goldLight} />
    </Svg>
  );
}

function BothArt() {
  return (
    <View style={{ flexDirection: "row", marginLeft: -8 }}>
      <View style={{ transform: [{ scale: 0.72 }], marginRight: -24 }}><AstroArt /></View>
      <View style={{ transform: [{ scale: 0.72 }] }}><VastuArt /></View>
    </View>
  );
}

function ConsultCard({ title, desc, art, colorsGrad, onPress }: { title: string; desc: string; art: React.ReactNode; colorsGrad: readonly [string, string, ...string[]]; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <LinearGradient colors={colorsGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.consult, shadow]}>
        <View style={styles.consultMandala} pointerEvents="none"><Mandala size={200} color={colors.goldLight} opacity={0.22} /></View>
        <View style={styles.art}>{art}</View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title" color={colors.cream} style={{ fontSize: 20 }}>{title}</Txt>
          <Txt color={colors.goldPale} style={{ fontSize: 14, lineHeight: 20 }}>{desc}</Txt>
        </View>
        <Icon name="chevronRight" color={colors.goldLight} />
      </LinearGradient>
    </Pressable>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const recent = useLocal(() => listConsultations(), [], { refetchOnFocus: true });
  const lang = currentLang();

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <LinearGradient colors={gradients.maroon} style={styles.header}>
        <View style={styles.headerMandala} pointerEvents="none"><Mandala size={340} color={colors.goldLight} opacity={0.18} /></View>
        <SafeAreaView edges={["top"]}>
          <Row style={{ padding: space.lg, paddingBottom: space.xl }} gap={space.md}>
            <Logo size={62} />
            <View style={{ flex: 1 }}>
              <Txt variant="caption" color={colors.goldLight}>{t("app.blessing")} · {fmtDate(new Date().toISOString(), lang, { weekday: "long", day: "numeric", month: "long" })}</Txt>
              <Txt variant="title" color={colors.cream} numberOfLines={1}>{t("home.greeting", { name: profile?.name.split(" ")[0] ?? "" })}</Txt>
            </View>
          </Row>
        </SafeAreaView>
      </LinearGradient>

      <Screen edges={[]} contentStyle={{ paddingTop: space.lg }}>
        <Txt variant="subheading" color={colors.maroon}>{t("home.question")}</Txt>
        <ConsultCard title={t("home.astro")} desc={t("home.astroDesc")} art={<AstroArt />} colorsGrad={gradients.sunrise} onPress={() => router.push("/astro/new")} />
        <ConsultCard title={t("home.vastu")} desc={t("home.vastuDesc")} art={<VastuArt />} colorsGrad={["#2F6E5A", "#1D4A3C"]} onPress={() => router.push("/vastu/new")} />
        <ConsultCard title={t("home.both")} desc={t("home.bothDesc")} art={<BothArt />} colorsGrad={["#8E2A1E", "#4A0D0D"]} onPress={() => router.push("/both/new")} />

        <LotusDivider />
        <Txt variant="caption" center style={{ fontStyle: i18n.language === "en" ? "italic" : "normal", paddingHorizontal: space.lg }}>{t("home.quote")}</Txt>

        {recent.data && recent.data.length > 0 ? (
          <>
            <SectionTitle
              title={t("home.recent")}
              right={<Pressable onPress={() => router.push("/(tabs)/history")}><Txt variant="label" color={colors.saffronDeep}>{t("home.seeAll")}</Txt></Pressable>}
            />
            <Card style={{ paddingVertical: space.sm }}>
              {recent.data.slice(0, 4).map((c: ConsultationSummary) => <ConsultationRow key={c.id} item={c} />)}
            </Card>
          </>
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, overflow: "hidden", borderBottomWidth: 3, borderColor: colors.gold },
  headerMandala: { position: "absolute", right: -90, top: -60 },
  consult: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.lg, overflow: "hidden", minHeight: 108, borderWidth: 1, borderColor: "rgba(244,215,123,0.45)" },
  consultMandala: { position: "absolute", right: -60, top: -50 },
  art: { width: 68, height: 68, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "rgba(0,0,0,0.12)" },
});
