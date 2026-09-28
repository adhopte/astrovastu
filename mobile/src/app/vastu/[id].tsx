import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { getVastu, logActivity } from "@/lib/store";
import { useLocal } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { ErrorView, Loading, Screen } from "@/components/ui";
import { VastuReportView } from "@/components/VastuReportView";

export default function VastuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data, error, loading, reload } = useLocal(() => {
    const detail = getVastu(id, currentLang());
    if (detail) logActivity("vastu.view", { type: "vastu", id });
    return detail;
  }, [id, i18n.language]);
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error || !data) return <Screen scroll={false}><ErrorView message={error ?? t("common.error")} onRetry={reload} /></Screen>;
  return (
    <Screen>
      <VastuReportView title={data.record.title} hasImage={data.record.hasImage} imageUri={data.record.imageUri} input={data.input} report={data.report} />
    </Screen>
  );
}
