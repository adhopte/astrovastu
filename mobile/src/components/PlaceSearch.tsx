import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { IANAZone } from "luxon";
import { useTranslation } from "react-i18next";
import { CITIES } from "@/domain/geo/cities";
import { colors, radius, space } from "@/lib/theme";
import type { Place } from "@/lib/types";
import { Button, Field } from "./ui";
import { Txt } from "./Txt";
import { Icon } from "./Icon";

export const placeLabel = (p: Place) => [p.name, p.admin1, p.country].filter(Boolean).join(", ");

/** Offline substring search over the bundled gazetteer — no network involved. */
function searchCities(q: string): Place[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return CITIES.filter((c) => c.name.toLowerCase().includes(needle) || c.admin1?.toLowerCase().startsWith(needle) || c.country.toLowerCase().includes(needle)).slice(0, 8);
}

export function PlaceSearch({ value, onSelect, error }: { value: Place | null; onSelect: (p: Place | null) => void; error?: string | null }) {
  const { t } = useTranslation();
  const [q, setQ] = useState(value ? placeLabel(value) : "");
  const [manual, setManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [tz, setTz] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const results = useMemo(() => (value && q === placeLabel(value) ? [] : searchCities(q)), [q, value]);
  const searched = q.trim().length >= 2;

  const confirmManual = () => {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!manualName.trim()) return setManualError(t("birth.manualNameRequired"));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return setManualError(t("birth.invalidLatitude"));
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return setManualError(t("birth.invalidLongitude"));
    if (!IANAZone.isValidZone(tz.trim())) return setManualError(t("birth.invalidTimezone"));
    const place: Place = { name: manualName.trim(), country: "", latitude, longitude, timezone: tz.trim() };
    onSelect(place);
    setQ(placeLabel(place));
    setManual(false);
  };

  if (manual) {
    return (
      <View style={styles.manual}>
        <Txt variant="label">{t("birth.manualTitle")}</Txt>
        <Field label={t("birth.place")} value={manualName} onChangeText={setManualName} placeholder={t("birth.placeHint")} />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Field label={t("birth.latitude")} value={lat} onChangeText={setLat} placeholder="18.5204" keyboardType="numbers-and-punctuation" style={{ flex: 1 }} />
          <Field label={t("birth.longitude")} value={lon} onChangeText={setLon} placeholder="73.8567" keyboardType="numbers-and-punctuation" style={{ flex: 1 }} />
        </View>
        <Field label={t("birth.timezone")} value={tz} onChangeText={setTz} placeholder="Asia/Kolkata" hint={t("birth.timezoneHint")} autoCapitalize="none" autoCorrect={false} />
        {manualError ? <Txt variant="caption" color={colors.sindoor}>{manualError}</Txt> : null}
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button kind="outline" title={t("common.back")} onPress={() => setManual(false)} style={{ flex: 1 }} />
          <Button title={t("common.done")} onPress={confirmManual} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Field
        label={t("birth.place")}
        placeholder={t("birth.placeHint")}
        value={q}
        onChangeText={(s) => {
          setQ(s);
          if (value) onSelect(null);
        }}
        error={error}
        autoCorrect={false}
      />
      {!value && results.length > 0 && (
        <View style={styles.list}>
          {results.map((p, i) => (
            <Pressable
              key={`${p.latitude},${p.longitude},${i}`}
              onPress={() => { onSelect(p); setQ(placeLabel(p)); }}
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
      {!value && searched && results.length === 0 && <Txt variant="caption">{t("birth.noPlaces")}</Txt>}
      {value && <Txt variant="caption" color={colors.tulsi}>✓ {value.latitude.toFixed(3)}°, {value.longitude.toFixed(3)}° · {t("birth.timezone")}: {value.timezone}</Txt>}
      {!value && (
        <Pressable onPress={() => { setManualName(q); setManual(true); }} hitSlop={6} style={{ alignSelf: "flex-start" }}>
          <Txt variant="label" color={colors.saffronDeep}>{t("birth.enterManually")}</Txt>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  manual: { gap: space.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md },
});
