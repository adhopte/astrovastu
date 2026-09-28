import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { createConsultation, createKundali, logActivity } from "@/lib/store";
import { errorMessage } from "@/lib/useApi";
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
        onSubmit={(b) => {
          setBusy(true);
          try {
            const { id } = createKundali(b);
            createConsultation("astro", id, null);
            logActivity("kundali.create", { type: "kundali", id }, { name: b.name, place: b.placeName });
            router.replace(`/astro/${id}`);
          } catch (e) {
            Alert.alert(t("common.error"), errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
