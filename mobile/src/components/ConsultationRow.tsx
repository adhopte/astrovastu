import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { fmtDate } from "@/lib/format";
import { currentLang } from "@/i18n";
import { colors, radius, space } from "@/lib/theme";
import type { ConsultationSummary } from "@/lib/types";
import { Txt } from "./Txt";
import { Icon, IconName } from "./Icon";

const KIND: Record<ConsultationSummary["kind"], { icon: IconName; color: string }> = {
  astro: { icon: "planet", color: colors.saffron },
  vastu: { icon: "compass", color: "#2F6E5A" },
  both: { icon: "sparkle", color: colors.maroon },
};

export function ConsultationRow({ item }: { item: ConsultationSummary }) {
  const { t } = useTranslation();
  const k = KIND[item.kind];
  const title = item.kind === "astro" ? item.kundaliName : item.kind === "vastu" ? item.vastuTitle : [item.kundaliName, item.vastuTitle].filter(Boolean).join(" · ");
  const open = () => {
    if (item.kind === "astro" && item.kundaliId) router.push(`/astro/${item.kundaliId}`);
    else if (item.kind === "vastu" && item.vastuId) router.push(`/vastu/${item.vastuId}`);
    else router.push(`/both/${item.id}`);
  };
  const deleted = (item.kind === "astro" && !item.kundaliId) || (item.kind === "vastu" && !item.vastuId);
  return (
    <Pressable onPress={deleted ? undefined : open} style={({ pressed }) => [styles.row, { opacity: deleted ? 0.5 : pressed ? 0.7 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: k.color }]}><Icon name={k.icon} color={colors.white} size={20} /></View>
      <View style={{ flex: 1 }}>
        <Txt variant="subheading" numberOfLines={1}>{title || t(`history.${item.kind}`)}</Txt>
        <Txt variant="caption">{t(`history.${item.kind}`)} · {fmtDate(item.createdAt, currentLang())}{item.vastuScore != null ? ` · ${item.vastuScore}/100` : ""}</Txt>
      </View>
      {!deleted && <Icon name="chevronRight" color={colors.inkMuted} size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm },
  icon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
