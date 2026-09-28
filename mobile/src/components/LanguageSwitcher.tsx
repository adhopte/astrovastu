import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LANGS, setLanguage } from "@/i18n";
import { colors, fonts, radius } from "@/lib/theme";
import type { Lang } from "@/lib/types";
import { Txt } from "./Txt";

const NATIVE: Record<Lang, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };

export function LanguageSwitcher({ onChange, compact }: { onChange?: (l: Lang) => void; compact?: boolean }) {
  const { i18n } = useTranslation();
  return (
    <View style={[styles.wrap, compact && { alignSelf: "center" }]}>
      {LANGS.map((l) => {
        const active = i18n.language === l;
        return (
          <Pressable
            key={l}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={async () => { await setLanguage(l); onChange?.(l); }}
            style={[styles.item, active && styles.active]}
          >
            <Txt style={{ fontFamily: active ? fonts.bodyBold : fonts.bodyMedium, fontSize: 15, lineHeight: 22 }} color={active ? colors.white : colors.maroon}>
              {NATIVE[l]}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.75)", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: 3 },
  item: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.pill },
  active: { backgroundColor: colors.maroon },
});
