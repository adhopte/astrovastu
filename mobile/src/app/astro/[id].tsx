import { useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { errorMessage, useApi } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { ErrorView, Loading, Screen } from "@/components/ui";
import { KundaliReportView } from "@/components/KundaliReportView";

export default function KundaliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  // Re-fetch when the language changes: predictions are generated server-side per language.
  const { data, error, loading, reload, setData } = useApi(() => api.kundali(id, currentLang()), [id, i18n.language]);
  const [aiBusy, setAiBusy] = useState(false);

  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error || !data) return <Screen scroll={false}><ErrorView message={error ?? t("common.error")} onRetry={reload} /></Screen>;

  const generate = async () => {
    setAiBusy(true);
    try {
      const r = await api.aiReading(id, currentLang());
      setData({ ...data, aiReading: r.aiReading });
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <Screen>
      <KundaliReportView
        chart={data.chart}
        report={data.report}
        name={data.record.name}
        ai={{ reading: data.aiReading, available: data.aiAvailable, onGenerate: generate, busy: aiBusy }}
      />
    </Screen>
  );
}
