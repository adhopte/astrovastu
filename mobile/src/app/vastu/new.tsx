import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { Screen } from "@/components/ui";
import { FloorPlanWizard } from "@/components/FloorPlanWizard";

export default function NewVastu() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <FloorPlanWizard
        submitLabel={t("vastu.analyse")}
        busy={busy}
        onComplete={async (draft) => {
          setBusy(true);
          try {
            const res = await api.createVastu(draft, currentLang());
            router.replace(`/vastu/${res.id}`);
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
