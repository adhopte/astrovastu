import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/lib/profile";
import { currentLang } from "@/i18n";
import { colors, gradients, radius, space } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import { Mandala } from "@/components/Mandala";
import { Txt } from "@/components/Txt";
import { Button, Field } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * First-run screen. AstroVastu has no accounts and no server — this just
 * asks what to call you (used in greetings and printed on your kundali) and
 * saves it straight to the on-device database.
 */
export default function Welcome() {
  const { t } = useTranslation();
  const { createProfile } = useProfile();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setError(t("auth.nameRequired"));
    createProfile(name.trim(), currentLang());
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient colors={gradients.maroon} style={{ flex: 1 }}>
      <View style={styles.mandala} pointerEvents="none">
        <Mandala size={560} color={colors.goldLight} opacity={0.16} />
      </View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <LanguageSwitcher compact />
          <View style={styles.logoWrap}>
            <Logo size={148} />
          </View>
          <Txt variant="display" color={colors.goldLight} center>
            {t("app.name")}
          </Txt>
          <Txt color={colors.sandal} center style={{ maxWidth: 300 }}>
            {t("app.tagline")}
          </Txt>
        </View>

        <View style={styles.sheet}>
          <Txt variant="title" center>
            {t("auth.welcome")}
          </Txt>
          <Txt variant="caption" center>
            {t("auth.subtitle")}
          </Txt>
          <View style={{ marginTop: space.md, gap: space.md }}>
            <Field
              label={t("auth.name")}
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError(null);
              }}
              error={error}
              autoComplete="name"
              autoFocus
              onSubmitEditing={submit}
            />
            <Button title={t("common.continue")} icon="sparkle" onPress={submit} />
          </View>
          <Txt variant="caption" center style={{ marginTop: space.sm, fontSize: 11.5 }}>
            {t("auth.terms")}
          </Txt>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: "space-between" },
  mandala: { position: "absolute", top: -110, alignSelf: "center" },
  hero: { alignItems: "center", gap: space.sm, paddingTop: space.lg, paddingHorizontal: space.lg },
  logoWrap: {
    marginTop: space.lg,
    marginBottom: space.sm,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    gap: space.xs,
    borderTopWidth: 3,
    borderColor: colors.gold,
  },
});
