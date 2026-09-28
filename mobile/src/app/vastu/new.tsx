import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { createConsultation, createVastu, logActivity } from "@/lib/store";
import { errorMessage } from "@/lib/useApi";
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
            const { id } = await createVastu(draft);
            createConsultation("vastu", null, id);
            logActivity("vastu.create", { type: "vastu", id }, { title: draft.title, rooms: draft.rooms.length });
            router.replace(`/vastu/${id}`);
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
