import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { colors, fonts, radius, space } from "@/lib/theme";
import { Txt } from "./Txt";
import { Field, Button } from "./ui";
import { Icon } from "./Icon";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Date ("YYYY-MM-DD") or time ("HH:mm") input. Uses the native picker on
 * iOS/Android and a validated text field on web.
 */
export function DateTimeField({ mode, label, value, onChange, display }: { mode: "date" | "time"; label: string; value: string; onChange: (v: string) => void; display: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (Platform.OS === "web") {
    return (
      <Field
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder={mode === "date" ? t("birth.dateFormat") : t("birth.timeFormat")}
        maxLength={mode === "date" ? 10 : 5}
        inputMode="numeric"
      />
    );
  }

  const current = (() => {
    if (mode === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d, 12);
    }
    if (mode === "time" && /^\d{2}:\d{2}$/.test(value)) {
      const [h, mi] = value.split(":").map(Number);
      const d = new Date();
      d.setHours(h, mi, 0, 0);
      return d;
    }
    return mode === "date" ? new Date(1990, 0, 1, 12) : new Date(new Date().setHours(6, 0, 0, 0));
  })();

  const set = (_e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (!d) return;
    onChange(mode === "date" ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label">{label}</Txt>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.box} accessibilityRole="button">
        <Txt style={{ fontFamily: fonts.bodyMedium, fontSize: 16, flex: 1 }} color={value ? colors.ink : colors.inkMuted}>
          {value ? display : mode === "date" ? t("birth.pickDate") : t("birth.pickTime")}
        </Txt>
        <Icon name={mode === "date" ? "history" : "rotate"} color={colors.saffronDeep} size={20} />
      </Pressable>
      {open && (
        <View>
          <DateTimePicker
            value={current}
            mode={mode}
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={mode === "date" ? new Date() : undefined}
            minimumDate={mode === "date" ? new Date(1900, 0, 1) : undefined}
            onChange={set}
          />
          {Platform.OS === "ios" && <Button kind="outline" title={t("common.done")} onPress={() => setOpen(false)} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1.2, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12,
  },
});
