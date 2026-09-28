import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { BirthForm } from "@/components/BirthForm";
import { Screen } from "@/components/ui";

export default function NewKundali() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <BirthForm
        submitLabel={t("birth.generate")}
        busy={busy}
        onSubmit={async (b) => {
          setBusy(true);
          try {
            const res = await api.createKundali(b, currentLang());
            router.replace(`/astro/${res.id}`);
          } catch (e) {
            Alert.alert(t("common.error"), errorMessage(e, t));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
