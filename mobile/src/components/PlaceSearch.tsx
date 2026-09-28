import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { currentLang } from "@/i18n";
import { colors, radius, space } from "@/lib/theme";
import type { Place } from "@/lib/types";
import { Field } from "./ui";
import { Txt } from "./Txt";
import { Icon } from "./Icon";

export const placeLabel = (p: Place) => [p.name, p.admin1, p.country].filter(Boolean).join(", ");

export function PlaceSearch({ value, onSelect, error }: { value: Place | null; onSelect: (p: Place | null) => void; error?: string | null }) {
  const { t } = useTranslation();
  const [q, setQ] = useState(value ? placeLabel(value) : "");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if ((value && q === placeLabel(value)) || q.trim().length < 2) return;
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.searchPlaces(q.trim(), currentLang());
        if (id === seq.current) { setResults(r.items); setSearched(true); }
      } catch {
        if (id === seq.current) setResults([]);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [q, value]);

  return (
    <View style={{ gap: 6 }}>
      <Field
        label={t("birth.place")}
        placeholder={t("birth.placeHint")}
        value={q}
        onChangeText={(s) => {
          setQ(s);
          if (value) onSelect(null);
          if (s.trim().length < 2) { seq.current++; setResults([]); setSearched(false); setLoading(false); }
        }}
        error={error}
        autoCorrect={false}
      />
      {loading && <ActivityIndicator color={colors.saffron} style={{ alignSelf: "flex-start" }} />}
      {!value && results.length > 0 && (
        <View style={styles.list}>
          {results.map((p, i) => (
            <Pressable
              key={`${p.latitude},${p.longitude},${i}`}
              onPress={() => { onSelect(p); setQ(placeLabel(p)); setResults([]); }}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.saffronSoft }]}
            >
              <Icon name="target" size={18} color={colors.saffronDeep} />
              <View style={{ flex: 1 }}>
                <Txt variant="subheading" numberOfLines={1}>{p.name}</Txt>
                <Txt variant="caption" numberOfLines={1}>{[p.admin1, p.country].filter(Boolean).join(", ")} · {p.timezone}</Txt>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {!value && searched && !loading && results.length === 0 && <Txt variant="caption">{t("birth.noPlaces")}</Txt>}
      {value && <Txt variant="caption" color={colors.tulsi}>✓ {value.latitude.toFixed(3)}°, {value.longitude.toFixed(3)}° · {t("birth.timezone")}: {value.timezone}</Txt>}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
