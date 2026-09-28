import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { ErrorView, Loading, Screen } from "@/components/ui";
import { VastuReportView } from "@/components/VastuReportView";

export default function VastuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data, error, loading, reload } = useApi(() => api.vastu(id, currentLang()), [id, i18n.language]);
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error || !data) return <Screen scroll={false}><ErrorView message={error ?? t("common.error")} onRetry={reload} /></Screen>;
  return (
    <Screen>
      <VastuReportView vastuId={data.id} title={data.record.title} hasImage={data.record.hasImage} input={data.input} report={data.report} />
    </Screen>
  );
}
