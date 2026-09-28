import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { deleteKundali, deleteVastu, listActivity, listConsultations, listKundalis, listVastu } from "@/lib/store";
import { useLocal } from "@/lib/useApi";
import { fmtBirth, fmtDate, fmtDateTime } from "@/lib/format";
import { currentLang } from "@/i18n";
import { colors, radius, space } from "@/lib/theme";
import type { ActivityItem } from "@/lib/types";
import { Button, Card, ErrorView, Loading, Row, Screen, Segmented, scoreColor } from "@/components/ui";
import { Txt } from "@/components/Txt";
import { Icon, IconName } from "@/components/Icon";
import { ConsultationRow } from "@/components/ConsultationRow";

type Tab = "consultations" | "kundalis" | "plans" | "activity";

const ACTION_ICON: Record<string, IconName> = { profile: "user", kundali: "planet", vastu: "compass", consultation: "sparkle", data: "trash" };

function Empty() {
  const { t } = useTranslation();
  return <Txt variant="caption" center style={{ padding: space.xl }}>{t("common.empty")}</Txt>;
}

function confirmDelete(t: (k: string) => string, onYes: () => void) {
  Alert.alert(t("common.delete"), t("common.confirmDelete"), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("common.delete"), style: "destructive", onPress: onYes },
  ]);
}

function Consultations() {
  const { data, error, loading, reload } = useLocal(() => listConsultations(), [], { refetchOnFocus: true });
  if (loading && !data) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!data?.length) return <Empty />;
  return <Card style={{ paddingVertical: space.sm }}>{data.map((c) => <ConsultationRow key={c.id} item={c} />)}</Card>;
}

function Kundalis() {
  const { t } = useTranslation();
  const lang = currentLang();
  const { data, error, loading, reload, setData } = useLocal(() => listKundalis(), [], { refetchOnFocus: true });
  if (loading && !data) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!data?.length) return <Empty />;
  const remove = (id: string) => confirmDelete(t, () => {
    deleteKundali(id);
    setData(data.filter((k) => k.id !== id));
  });
  return (
    <View style={{ gap: space.md }}>
      {data.map((k) => {
        const b = fmtBirth(k.birthDate, k.birthTime, lang);
        return (
          <Card key={k.id} accent={colors.saffron} onPress={() => router.push(`/astro/${k.id}`)}>
            <Row>
              <View style={{ flex: 1 }}>
                <Txt variant="subheading">{k.name}</Txt>
                <Txt variant="caption">{b.date} · {b.time}</Txt>
                <Txt variant="caption" numberOfLines={1}>{k.placeName}</Txt>
              </View>
              <Pressable hitSlop={12} onPress={() => remove(k.id)} accessibilityLabel={t("common.delete")}><Icon name="trash" color={colors.inkMuted} size={20} /></Pressable>
            </Row>
          </Card>
        );
      })}
    </View>
  );
}

function Plans() {
  const { t } = useTranslation();
  const lang = currentLang();
  const { data, error, loading, reload, setData } = useLocal(() => listVastu(), [], { refetchOnFocus: true });
  if (loading && !data) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!data?.length) return <Empty />;
  const remove = (id: string) => confirmDelete(t, () => {
    deleteVastu(id);
    setData(data.filter((k) => k.id !== id));
  });
  return (
    <View style={{ gap: space.md }}>
      {data.map((v) => (
        <Card key={v.id} accent={scoreColor(v.score)} onPress={() => router.push(`/vastu/${v.id}`)}>
          <Row>
            <View style={[styles.score, { borderColor: scoreColor(v.score) }]}><Txt variant="bodyBold" color={scoreColor(v.score)}>{v.score}</Txt></View>
            <View style={{ flex: 1 }}>
              <Txt variant="subheading" numberOfLines={1}>{v.title}</Txt>
              <Txt variant="caption">{t("vastu.roomCount", { count: v.rooms })} · {fmtDate(v.createdAt, lang)}</Txt>
            </View>
            <Pressable hitSlop={12} onPress={() => remove(v.id)} accessibilityLabel={t("common.delete")}><Icon name="trash" color={colors.inkMuted} size={20} /></Pressable>
          </Row>
        </Card>
      ))}
    </View>
  );
}

const PAGE = 30;

function Activity() {
  const { t } = useTranslation();
  const lang = currentLang();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const first = useLocal(
    () => {
      const r = listActivity(PAGE);
      setItems(r.items);
      return r;
    },
    [],
    { refetchOnFocus: true },
  );
  const cursor = first.data?.nextCursor ?? null;
  if (first.loading && !first.data) return <Loading />;
  if (first.error) return <ErrorView message={first.error} onRetry={first.reload} />;
  if (!items.length) return <Empty />;
  const loadMore = () => {
    if (!cursor) return;
    const r = listActivity(PAGE, cursor);
    setItems((prev) => [...prev, ...r.items]);
    first.setData(r);
  };
  return (
    <View>
      {items.map((a, i) => (
        <View key={a.id} style={styles.timelineRow}>
          <View style={{ alignItems: "center" }}>
            <View style={styles.dot}><Icon name={ACTION_ICON[a.action.split(".")[0]] ?? "sparkle"} size={16} color={colors.white} /></View>
            {i < items.length - 1 && <View style={styles.line} />}
          </View>
          <View style={{ flex: 1, paddingBottom: space.lg }}>
            <Txt variant="subheading">{t(`activity.${a.action}`, { defaultValue: a.action })}</Txt>
            {typeof a.metadata?.name === "string" || typeof a.metadata?.title === "string" ? (
              <Txt variant="caption">{String(a.metadata?.name ?? a.metadata?.title)}</Txt>
            ) : null}
            <Txt variant="caption" color={colors.inkMuted}>{fmtDateTime(a.createdAt, lang)}</Txt>
          </View>
        </View>
      ))}
      {cursor ? <Button kind="outline" title={t("history.loadMore")} onPress={loadMore} /> : null}
    </View>
  );
}

export default function History() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("consultations");
  return (
    <Screen>
      <Segmented
        scrollable
        value={tab}
        onChange={setTab}
        options={[
          { value: "consultations", label: t("history.consultations") },
          { value: "kundalis", label: t("history.kundalis") },
          { value: "plans", label: t("history.plans") },
          { value: "activity", label: t("history.activity") },
        ]}
      />
      {tab === "consultations" && <Consultations />}
      {tab === "kundalis" && <Kundalis />}
      {tab === "plans" && <Plans />}
      {tab === "activity" && <Activity />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  timelineRow: { flexDirection: "row", gap: space.md },
  dot: { width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.saffron, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.goldLight },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
});
