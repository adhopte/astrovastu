import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { createCombinedConsultation, listKundalis, listVastu, logActivity } from "@/lib/store";
import { errorMessage, useLocal } from "@/lib/useApi";
import { fmtBirth, fmtDate } from "@/lib/format";
import { currentLang } from "@/i18n";
import { colors, space } from "@/lib/theme";
import type { BirthInput, VastuDraft } from "@/lib/types";
import { BirthForm } from "@/components/BirthForm";
import { FloorPlanWizard } from "@/components/FloorPlanWizard";
import { Button, Card, Row, Screen, Segmented, SectionTitle } from "@/components/ui";
import { Txt } from "@/components/Txt";
import { Icon } from "@/components/Icon";

type BirthChoice = BirthInput | { kundaliId: string; name: string };

export default function NewCombined() {
  const { t } = useTranslation();
  const lang = currentLang();
  const [step, setStep] = useState<0 | 1>(0);
  const [birth, setBirth] = useState<BirthChoice | null>(null);
  const [kMode, setKMode] = useState<"new" | "saved">("new");
  const [vMode, setVMode] = useState<"new" | "saved">("new");
  const [busy, setBusy] = useState(false);
  const saved = useLocal(() => ({ kundalis: listKundalis(), plans: listVastu() }), []);
  const kundalis = saved.data?.kundalis ?? [];
  const plans = saved.data?.plans ?? [];

  const submit = async (vastu: VastuDraft | { vastuId: string }) => {
    if (!birth) return;
    setBusy(true);
    try {
      const b = "kundaliId" in birth ? { kundaliId: birth.kundaliId } : birth;
      const res = await createCombinedConsultation(b, vastu);
      logActivity("consultation.create", { type: "consultation", id: res.id }, { kind: "both" });
      router.replace(`/both/${res.id}`);
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Row gap={space.sm}>
        {[t("both.step1"), t("both.step2")].map((l, i) => (
          <View key={l} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.saffron : colors.border }} />
        ))}
      </Row>

      {step === 0 && (
        <>
          <SectionTitle title={`1 · ${t("both.step1")}`} />
          {kundalis.length > 0 && (
            <Segmented value={kMode} onChange={setKMode} options={[{ value: "new", label: t("both.createNew") }, { value: "saved", label: t("both.useExisting") }]} />
          )}
          {kMode === "new" || kundalis.length === 0 ? (
            <BirthForm submitLabel={t("common.next")} onSubmit={(b) => { setBirth(b); setStep(1); }} />
          ) : (
            kundalis.map((k) => {
              const bt = fmtBirth(k.birthDate, k.birthTime, lang);
              return (
                <Card key={k.id} accent={colors.saffron} onPress={() => { setBirth({ kundaliId: k.id, name: k.name }); setStep(1); }}>
                  <Row>
                    <View style={{ flex: 1 }}>
                      <Txt variant="subheading">{k.name}</Txt>
                      <Txt variant="caption">{bt.date} · {bt.time} · {k.placeName}</Txt>
                    </View>
                    <Icon name="chevronRight" color={colors.inkMuted} />
                  </Row>
                </Card>
              );
            })
          )}
        </>
      )}

      {step === 1 && birth && (
        <>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Icon name="check" color={colors.tulsi} />
            <Txt variant="subheading" style={{ flex: 1 }}>{birth.name}</Txt>
            <Button kind="ghost" title={t("common.edit")} onPress={() => setStep(0)} />
          </Card>
          <SectionTitle title={`2 · ${t("both.step2")}`} />
          {plans.length > 0 && (
            <Segmented value={vMode} onChange={setVMode} options={[{ value: "new", label: t("both.createNew") }, { value: "saved", label: t("both.useExistingPlan") }]} />
          )}
          {vMode === "new" || plans.length === 0 ? (
            <FloorPlanWizard submitLabel={t("both.submit")} busy={busy} onComplete={(d) => submit(d)} />
          ) : (
            plans.map((p) => (
              <Card key={p.id} accent={colors.gold} onPress={busy ? undefined : () => submit({ vastuId: p.id })}>
                <Row>
                  <View style={{ flex: 1 }}>
                    <Txt variant="subheading">{p.title}</Txt>
                    <Txt variant="caption">{p.score}/100 · {t("vastu.roomCount", { count: p.rooms })} · {fmtDate(p.createdAt, lang)}</Txt>
                  </View>
                  <Icon name="chevronRight" color={colors.inkMuted} />
                </Row>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
