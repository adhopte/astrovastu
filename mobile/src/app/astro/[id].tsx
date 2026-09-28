import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { getKundali, logActivity } from "@/lib/store";
import { useLocal } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { ErrorView, Loading, Screen } from "@/components/ui";
import { KundaliReportView } from "@/components/KundaliReportView";

export default function KundaliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  // Re-run when the language changes: predictions are generated fresh per language.
  const { data, error, loading, reload } = useLocal(() => {
    const detail = getKundali(id, currentLang());
    if (detail) logActivity("kundali.view", { type: "kundali", id });
    return detail;
  }, [id, i18n.language]);

  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error || !data) return <Screen scroll={false}><ErrorView message={error ?? t("common.error")} onRetry={reload} /></Screen>;

  return (
    <Screen>
      <KundaliReportView chart={data.chart} report={data.report} name={data.record.name} />
    </Screen>
  );
}
