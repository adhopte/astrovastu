import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { colors, radius, space } from "@/lib/theme";
import { RATING_COLOR, ROOM_COLOR } from "@/lib/vastu";
import type { VastuInput, VastuReport, Zone } from "@/lib/types";
import { Badge, Card, Chip, Row, ScoreRing, SectionTitle } from "./ui";
import { Txt } from "./Txt";
import { Icon } from "./Icon";
import { PlanCanvas } from "./PlanCanvas";
import { useAuthedImage } from "./useAuthedImage";

const STATUS_STYLE = {
  good: { color: colors.tulsi, bg: colors.tulsiSoft },
  neutral: { color: "#8A6D00", bg: colors.haldiSoft },
  afflicted: { color: colors.sindoor, bg: colors.sindoorSoft },
  empty: { color: colors.inkMuted, bg: colors.sandal },
} as const;

export function VastuReportView({ vastuId, title, hasImage, input, report, localImageUri }: {
  vastuId: string; title: string; hasImage: boolean; input: VastuInput; report: VastuReport; localImageUri?: string | null;
}) {
  const { t } = useTranslation();
  const [showGrid, setShowGrid] = useState(true);
  const remote = useAuthedImage(hasImage && !localImageUri ? api.vastuImageUrl(vastuId) : null);
  const source = localImageUri ? { uri: localImageUri } : remote;
  const statuses = Object.fromEntries(report.zones.map((z) => [z.zone, z.status])) as Record<Zone, "good" | "neutral" | "afflicted" | "empty">;

  return (
    <>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
        <ScoreRing score={report.score} size={108} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="label">{t("vastu.score")}</Txt>
          <Txt variant="heading">{title}</Txt>
          <Txt>{report.verdict}</Txt>
        </View>
      </Card>

      <SectionTitle title={t("vastu.grid")} right={<Chip label={t("vastu.showGrid")} active={showGrid} onPress={() => setShowGrid(!showGrid)} />} />
      {hasImage || localImageUri ? (
        <PlanCanvas source={source} aspectRatio={input.grid.aspectRatio} center={input.grid.center} northAngle={input.grid.northAngle} rooms={input.rooms} statuses={statuses} showGrid={showGrid} />
      ) : (
        <PlanCanvas source={null} aspectRatio={1} center={input.grid.center} northAngle={input.grid.northAngle} rooms={input.rooms} statuses={statuses} />
      )}
      <Row style={{ flexWrap: "wrap", justifyContent: "center" }} gap={space.md}>
        {(["good", "neutral", "afflicted"] as const).map((s) => (
          <Row key={s} gap={4}><View style={[styles.legend, { backgroundColor: STATUS_STYLE[s].color }]} /><Txt variant="caption">{t(`vastu.zoneStatus.${s}`)}</Txt></Row>
        ))}
      </Row>

      <SectionTitle title={t("vastu.findings")} />
      {report.findings.map((f, i) => {
        const rc = RATING_COLOR[f.rating];
        return (
          <Card key={f.id ?? i} accent={rc.fg}>
            <Row>
              <View style={[styles.roomDot, { backgroundColor: ROOM_COLOR[f.type] }]} />
              <View style={{ flex: 1 }}>
                <Txt variant="subheading">{f.label ? `${f.name} · ${f.label}` : f.name}</Txt>
                <Txt variant="caption">{f.zoneName}</Txt>
              </View>
              <Badge label={f.ratingLabel} color={rc.fg} bg={rc.bg} />
            </Row>
            <Txt>{f.finding}</Txt>
            <Txt variant="caption" color={colors.tulsi}>✦ {f.ideal}</Txt>
            {f.remedies.length > 0 && (
              <View style={styles.remedy}>
                <Txt variant="label" color={colors.maroon}>{t("vastu.remedies")}</Txt>
                {f.remedies.map((r, j) => <Txt key={j}>🪔 {r}</Txt>)}
              </View>
            )}
          </Card>
        );
      })}

      {report.missing.length > 0 && (
        <Card accent={colors.inkMuted}>
          <Txt variant="label">{t("vastu.missing")}</Txt>
          {report.missing.map((m, i) => <Txt key={i} variant="caption">• {m}</Txt>)}
        </Card>
      )}

      <SectionTitle title={t("vastu.zones")} />
      <View style={styles.zoneGrid}>
        {report.zones.map((z) => {
          const st = STATUS_STYLE[z.status];
          return (
            <View key={z.zone} style={[styles.zoneCell, { borderColor: st.color, backgroundColor: st.bg }]}>
              <Row gap={6}>
                <Txt variant="bodyBold" color={colors.maroon}>{z.zone}</Txt>
                <Txt variant="caption" style={{ flex: 1 }} numberOfLines={1}>{z.element}</Txt>
              </Row>
              <Txt variant="caption" numberOfLines={3}>{z.attr}</Txt>
              {z.rooms.length > 0 && <Txt variant="label" color={st.color} numberOfLines={2}>{z.rooms.map((r) => t(`room.${r}`)).join(", ")}</Txt>}
            </View>
          );
        })}
      </View>
      <Card accent={report.center.afflicted ? colors.sindoor : colors.saffron}>
        <Row><Icon name="target" color={colors.saffronDeep} /><Txt variant="subheading">{t("vastu.center")}</Txt></Row>
        <Txt>{report.center.note}</Txt>
      </Card>

      <SectionTitle title={t("vastu.tips")} />
      <Card>{report.tips.map((tip, i) => <Txt key={i}>🪷 {tip}</Txt>)}</Card>
      <Txt variant="caption" center style={{ paddingHorizontal: space.md }}>{report.disclaimer}</Txt>
    </>
  );
}

const styles = StyleSheet.create({
  legend: { width: 12, height: 12, borderRadius: 3 },
  roomDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.white },
  remedy: { backgroundColor: colors.goldPale, borderRadius: radius.md, padding: space.md, gap: 4 },
  zoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  zoneCell: { width: "48.5%", borderWidth: 1, borderRadius: radius.md, padding: space.sm, gap: 2, flexGrow: 1 },
});
