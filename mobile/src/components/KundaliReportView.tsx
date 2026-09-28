import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { fmtBirth, fmtDate, fmtDegree } from "@/lib/format";
import { currentLang } from "@/i18n";
import { colors, radius, space } from "@/lib/theme";
import type { Chart, Dignity, KundaliReport } from "@/lib/types";
import { Badge, Card, Row, Segmented, SectionTitle, Stars } from "./ui";
import { Txt } from "./Txt";
import { Icon } from "./Icon";
import { KundaliChart } from "./KundaliChart";

type Tab = "chart" | "planets" | "predictions" | "dasha" | "more";

const DIGNITY_STYLE: Record<Dignity, { color: string; bg: string }> = {
  exalted: { color: colors.tulsi, bg: colors.tulsiSoft },
  own: { color: colors.tulsi, bg: colors.tulsiSoft },
  friendly: { color: "#5B7F1E", bg: "#EEF5DA" },
  neutral: { color: colors.inkSoft, bg: colors.sandal },
  enemy: { color: "#A15C00", bg: colors.haldiSoft },
  debilitated: { color: colors.sindoor, bg: colors.sindoorSoft },
};

export function KundaliHeader({ chart, report, name }: { chart: Chart; report: KundaliReport; name: string }) {
  const { t } = useTranslation();
  const b = fmtBirth(chart.input.birthDate, chart.input.birthTime, currentLang());
  const items = [
    [t("kundali.lagna"), report.summary.lagna],
    [t("kundali.moonSign"), report.summary.moonSign],
    [t("kundali.nakshatra"), `${report.summary.nakshatra} (${report.summary.pada})`],
  ];
  return (
    <Card style={{ gap: space.md, backgroundColor: colors.maroon, borderColor: colors.gold }}>
      <View>
        <Txt variant="title" color={colors.goldLight}>{name}</Txt>
        <Txt variant="caption" color={colors.sandal}>{t("kundali.born", { date: b.date, time: b.time, place: chart.input.placeName })}</Txt>
      </View>
      <Row gap={space.sm} style={{ flexWrap: "wrap" }}>
        {items.map(([k, v]) => (
          <View key={k} style={styles.pill}>
            <Txt variant="caption" color={colors.goldLight} style={{ fontSize: 11.5 }}>{k}</Txt>
            <Txt variant="bodyBold" color={colors.cream} style={{ fontSize: 14.5 }}>{v}</Txt>
          </View>
        ))}
      </Row>
    </Card>
  );
}

function ChartTab({ chart, report }: { chart: Chart; report: KundaliReport }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [variant, setVariant] = useState<"d1" | "d9">("d1");
  const size = Math.min(width - space.lg * 2 - 2, 420);
  return (
    <>
      <Segmented value={variant} onChange={setVariant} options={[{ value: "d1", label: t("kundali.rasi") }, { value: "d9", label: t("kundali.navamsa") }]} />
      <View style={{ alignItems: "center" }}><KundaliChart chart={chart} size={size} variant={variant} /></View>
      <Txt variant="caption" center>{t("kundali.chartLegend")} · {t("kundali.ayanamsa")} {fmtDegree(chart.ayanamsa)}</Txt>

      <SectionTitle title={t("kundali.yogas")} />
      {report.yogas.length === 0 ? (
        <Card><Txt>{t("kundali.noYogas")}</Txt></Card>
      ) : report.yogas.map((y) => (
        <Card key={y.key} accent={y.key === "kemadruma" ? colors.haldi : colors.gold}>
          <Txt variant="subheading" color={colors.maroon}>{y.name}</Txt>
          <Txt>{y.desc}</Txt>
        </Card>
      ))}

      <SectionTitle title={t("kundali.doshas")} />
      {report.doshas.map((d) => (
        <Card key={d.key} accent={d.active ? colors.sindoor : colors.tulsi}>
          <Row style={{ alignItems: "flex-start" }}>
            <Icon name={d.active ? "alert" : "check"} color={d.active ? colors.sindoor : colors.tulsi} size={20} />
            <Txt style={{ flex: 1 }}>{d.text}</Txt>
          </Row>
        </Card>
      ))}
    </>
  );
}

function PlanetsTab({ chart, report }: { chart: Chart; report: KundaliReport }) {
  const { t } = useTranslation();
  const L = report.labels;
  return (
    <Card style={{ padding: 0, overflow: "hidden", gap: 0 }}>
      <View style={[styles.tr, styles.th]}>
        <Txt variant="label" color={colors.cream} style={styles.c1}>{t("kundali.planet")}</Txt>
        <Txt variant="label" color={colors.cream} style={styles.c2}>{t("kundali.sign")}</Txt>
        <Txt variant="label" color={colors.cream} style={styles.c3}>{t("kundali.house")}</Txt>
      </View>
      <View style={[styles.tr, { backgroundColor: colors.saffronSoft }]}>
        <Txt variant="bodyBold" style={styles.c1}>{t("kundali.lagna")}</Txt>
        <View style={styles.c2}>
          <Txt>{L.signs[chart.ascendant.sign]} {fmtDegree(chart.ascendant.degreeInSign)}</Txt>
          <Txt variant="caption">{L.nakshatras[chart.ascendant.nakshatra]} · {t("kundali.pada")} {chart.ascendant.pada}</Txt>
        </View>
        <Txt variant="bodyBold" style={styles.c3}>1</Txt>
      </View>
      {chart.planets.map((p, i) => (
        <View key={p.id} style={[styles.tr, i % 2 ? { backgroundColor: "rgba(243,224,188,0.35)" } : null]}>
          <View style={styles.c1}>
            <Txt variant="bodyBold">{L.planets[p.id]}</Txt>
            <Row gap={4} style={{ flexWrap: "wrap" }}>
              <Badge label={t(`dignity.${p.dignity}`)} {...DIGNITY_STYLE[p.dignity]} />
              {p.retrograde && p.id !== "rahu" && p.id !== "ketu" ? <Badge label={t("kundali.retro")} color={colors.peacock} bg="#DDEBF2" /> : null}
              {p.combust ? <Badge label={t("kundali.combust")} color={colors.saffronDeep} bg={colors.saffronSoft} /> : null}
            </Row>
          </View>
          <View style={styles.c2}>
            <Txt>{L.signs[p.sign]} {fmtDegree(p.degreeInSign)}</Txt>
            <Txt variant="caption">{L.nakshatras[p.nakshatra]} · {t("kundali.pada")} {p.pada}</Txt>
          </View>
          <Txt variant="bodyBold" style={styles.c3}>{p.house}</Txt>
        </View>
      ))}
      <Txt variant="caption" style={{ padding: space.md }}>{t("kundali.legend")}</Txt>
    </Card>
  );
}

function Section({ title, rating, paragraphs, initiallyOpen }: { title: string; rating?: number; paragraphs: string[]; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  return (
    <Card>
      <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{title}</Txt>
          {rating != null ? <Stars value={rating} /> : null}
        </View>
        <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}><Icon name="chevronRight" color={colors.saffronDeep} /></View>
      </Pressable>
      {open && paragraphs.map((p, i) => <Txt key={i} style={{ marginTop: i === 0 ? space.xs : 0 }}>{p}</Txt>)}
    </Card>
  );
}

function PredictionsTab({ report }: { report: KundaliReport }) {
  return (
    <>
      {report.sections.map((s, i) => <Section key={s.key} title={s.title} rating={s.rating} paragraphs={s.paragraphs} initiallyOpen={i === 0} />)}
      <Txt variant="caption" center style={{ paddingHorizontal: space.md }}>{report.disclaimer}</Txt>
    </>
  );
}

function DashaTab({ report }: { report: KundaliReport }) {
  const { t } = useTranslation();
  const lang = currentLang();
  const [open, setOpen] = useState<string | null>(report.dashas.find((d) => d.current)?.start ?? null);
  const narrative = report.sections.find((s) => s.key === "dasha");
  return (
    <>
      {narrative ? <Card accent={colors.saffron}>{narrative.paragraphs.map((p, i) => <Txt key={i}>{p}</Txt>)}</Card> : null}
      <SectionTitle title={t("kundali.mahadasha")} />
      {report.dashas.map((d) => {
        const expanded = open === d.start;
        return (
          <Card key={d.start} accent={d.current ? colors.saffron : undefined} style={d.current ? { backgroundColor: colors.saffronSoft } : undefined}>
            <Pressable onPress={() => setOpen(expanded ? null : d.start)} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Row><Txt variant="subheading">{d.name}</Txt>{d.current ? <Badge label={t("kundali.current")} color={colors.white} bg={colors.saffron} /> : null}</Row>
                <Txt variant="caption">{fmtDate(d.start, lang)} – {fmtDate(d.end, lang)}</Txt>
              </View>
              <View style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}><Icon name="chevronRight" color={colors.inkMuted} size={18} /></View>
            </Pressable>
            {expanded && (
              <View style={{ marginTop: space.xs, gap: 2 }}>
                <Txt variant="label">{t("kundali.antardasha")}</Txt>
                {d.antardashas.map((a) => (
                  <Row key={a.start} style={[styles.antar, a.current && { backgroundColor: colors.white, borderColor: colors.saffron }]}>
                    <Txt variant={a.current ? "bodyBold" : "body"} style={{ flex: 1 }}>{d.name.split(" ")[0]} / {a.name}</Txt>
                    <Txt variant="caption">{fmtDate(a.start, lang, { month: "short", year: "numeric" })} – {fmtDate(a.end, lang, { month: "short", year: "numeric" })}</Txt>
                  </Row>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </>
  );
}

function MoreTab({ report }: { report: KundaliReport }) {
  const { t } = useTranslation();
  const P = report.panchang;
  const rows: [string, string][] = [
    [t("kundali.tithi"), `${P.tithi} (${P.paksha})`], [t("kundali.vara"), P.vara], [t("kundali.nakshatra"), P.nakshatra],
    [t("kundali.yoga"), P.yoga], [t("kundali.karana"), P.karana], [t("kundali.sunSign"), report.summary.sunSign],
  ];
  const remedies = report.sections.find((s) => s.key === "remedies");
  return (
    <>
      <SectionTitle title={t("kundali.panchang")} />
      <Card style={{ gap: 0, paddingVertical: space.sm }}>
        {rows.map(([k, v], i) => (
          <Row key={k} style={[{ paddingVertical: space.sm }, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <Txt variant="label" style={{ width: 110 }}>{k}</Txt>
            <Txt variant="bodyBold" style={{ flex: 1 }}>{v}</Txt>
          </Row>
        ))}
      </Card>
      <SectionTitle title={t("kundali.remedies")} />
      {remedies ? <Card accent={colors.gold}>{remedies.paragraphs.map((p, i) => <Txt key={i}>{p}</Txt>)}</Card> : null}
      {report.remedies.map((r) => (
        <Card key={r.planet}>
          <Txt variant="subheading" color={colors.maroon}>{r.name}</Txt>
          {([["gem", r.gem], ["mantra", r.mantra], ["day", r.day], ["color", r.color], ["charity", r.charity]] as const).map(([k, v]) => (
            <Row key={k} style={{ alignItems: "flex-start" }}>
              <Txt variant="label" style={{ width: 90 }}>{t(`kundali.${k}`)}</Txt>
              <Txt style={{ flex: 1 }}>{v}</Txt>
            </Row>
          ))}
        </Card>
      ))}
    </>
  );
}

export function KundaliReportView({ chart, report, name }: { chart: Chart; report: KundaliReport; name: string }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("predictions");
  return (
    <>
      <KundaliHeader chart={chart} report={report} name={name} />
      <Segmented
        scrollable
        value={tab}
        onChange={setTab}
        options={[
          { value: "predictions", label: t("kundali.predictions") },
          { value: "chart", label: t("kundali.chart") },
          { value: "planets", label: t("kundali.planets") },
          { value: "dasha", label: t("kundali.dasha") },
          { value: "more", label: t("kundali.more") },
        ]}
      />
      {tab === "chart" && <ChartTab chart={chart} report={report} />}
      {tab === "planets" && <PlanetsTab chart={chart} report={report} />}
      {tab === "predictions" && <PredictionsTab report={report} />}
      {tab === "dasha" && <DashaTab report={report} />}
      {tab === "more" && <MoreTab report={report} />}
    </>
  );
}

const styles = StyleSheet.create({
  pill: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(244,215,123,0.35)" },
  tr: { flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, paddingVertical: space.sm, gap: space.sm },
  th: { backgroundColor: colors.maroon },
  c1: { flex: 1.25 },
  c2: { flex: 1.5 },
  c3: { width: 40, textAlign: "center" },
  antar: { paddingHorizontal: space.sm, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: "transparent" },
});
