import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { fmtBirth } from "@/lib/format";
import { currentLang } from "@/i18n";
import { colors, space } from "@/lib/theme";
import type { BirthInput, Place } from "@/lib/types";
import { Button, Card, Chip, Field, Row } from "./ui";
import { Txt } from "./Txt";
import { DateTimeField } from "./DateTimeField";
import { PlaceSearch } from "./PlaceSearch";

export function BirthForm({ onSubmit, submitLabel, busy }: { onSubmit: (b: BirthInput) => void; submitLabel: string; busy?: boolean }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<BirthInput["gender"]>();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lang = currentLang();

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const shown = validDate && validTime ? fmtBirth(date, time, lang) : null;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("auth.nameRequired");
    if (!validDate) e.date = t("birth.dateFormat");
    if (!validTime) e.time = t("birth.timeFormat");
    if (!place) e.place = t("birth.selectPlace");
    setErrors(e);
    if (Object.keys(e).length || !place) return;
    onSubmit({
      name: name.trim(), gender, birthDate: date, birthTime: time,
      placeName: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
      latitude: place.latitude, longitude: place.longitude, timezone: place.timezone,
    });
  };

  return (
    <Card style={{ gap: space.lg }}>
      <View>
        <Txt variant="heading">{t("birth.title")}</Txt>
        <Txt variant="caption">{t("birth.subtitle")}</Txt>
      </View>
      <Field label={t("birth.name")} value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
      <View style={{ gap: 6 }}>
        <Txt variant="label">{t("birth.gender")} ({t("common.optional")})</Txt>
        <Row>
          {(["male", "female", "other"] as const).map((g) => (
            <Chip key={g} label={t(`birth.${g}`)} active={gender === g} onPress={() => setGender(gender === g ? undefined : g)} />
          ))}
        </Row>
      </View>
      <DateTimeField mode="date" label={t("birth.date")} value={date} onChange={setDate} display={shown?.date ?? date} />
      {errors.date ? <Txt variant="caption" color={colors.sindoor}>{errors.date}</Txt> : null}
      <DateTimeField mode="time" label={t("birth.time")} value={time} onChange={setTime} display={shown?.time ?? time} />
      {errors.time ? <Txt variant="caption" color={colors.sindoor}>{errors.time}</Txt> : null}
      <PlaceSearch value={place} onSelect={setPlace} error={errors.place} />
      <Button title={submitLabel} icon="sparkle" onPress={submit} loading={busy} />
    </Card>
  );
}
