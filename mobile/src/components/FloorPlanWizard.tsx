import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/useApi";
import { colors, radius, space } from "@/lib/theme";
import { ROOM_COLOR, ROOM_TYPES, locateZone } from "@/lib/vastu";
import type { RoomType, VastuDraft } from "@/lib/types";
import { Button, Card, Chip, Field, Row, SectionTitle } from "./ui";
import { Txt } from "./Txt";
import { Icon } from "./Icon";
import { NorthDial } from "./NorthDial";
import { PlanCanvas } from "./PlanCanvas";

const EMPTY: VastuDraft = { title: "", imageUri: null, aspectRatio: 1, northAngle: 0, center: { x: 0.5, y: 0.5 }, rooms: [], aiDetected: false };

function Steps({ step }: { step: number }) {
  const { t } = useTranslation();
  const labels = [t("vastu.step1"), t("vastu.step2"), t("vastu.step3")];
  return (
    <Row style={{ justifyContent: "space-between" }}>
      {labels.map((l, i) => (
        <View key={l} style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <View style={[styles.stepDot, i <= step && { backgroundColor: colors.saffron, borderColor: colors.saffronDeep }]}>
            {i < step ? <Icon name="check" size={14} color={colors.white} /> : <Txt variant="label" color={i <= step ? colors.white : colors.inkMuted}>{i + 1}</Txt>}
          </View>
          <Txt variant="caption" center numberOfLines={1} color={i === step ? colors.maroon : colors.inkMuted}>{l}</Txt>
        </View>
      ))}
    </Row>
  );
}

let nextId = 1;

/** Guides the user from a floor plan image to a fully tagged VastuDraft. */
export function FloorPlanWizard({ onComplete, submitLabel, busy }: { onComplete: (d: VastuDraft) => void; submitLabel: string; busy?: boolean }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<VastuDraft>(EMPTY);
  const [roomType, setRoomType] = useState<RoomType>("kitchen");
  const [centerMode, setCenterMode] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const update = (patch: Partial<VastuDraft>) => setD((prev) => ({ ...prev, ...patch }));

  useEffect(() => { api.health().then((h) => setAiAvailable(h.ai)).catch(() => {}); }, []);

  const pick = async (camera: boolean) => {
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.85, allowsEditing: false };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const setAsset = (w: number, h: number) =>
      update({ imageUri: a.uri, mimeType: a.mimeType ?? "image/jpeg", aspectRatio: w && h ? w / h : 1, rooms: [], center: { x: 0.5, y: 0.5 }, aiDetected: false });
    if (a.width && a.height) setAsset(a.width, a.height);
    else Image.getSize(a.uri, setAsset, () => setAsset(1, 1));
  };

  const detect = async () => {
    if (!d.imageUri) return;
    setDetecting(true);
    try {
      const r = await api.detectRooms(d.imageUri, d.mimeType);
      update({
        rooms: r.rooms.map((x) => ({ id: `ai${nextId++}`, type: x.type, label: x.label, x: x.x, y: x.y })),
        ...(r.northAngle != null ? { northAngle: Math.round(r.northAngle) } : {}),
        aiDetected: true,
      });
      setAiNote([t("vastu.aiNote"), r.notes].filter(Boolean).join(" "));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setDetecting(false);
    }
  };

  const onTap = (x: number, y: number) => {
    if (centerMode) {
      update({ center: { x, y } });
      setCenterMode(false);
    } else {
      update({ rooms: [...d.rooms, { id: `m${nextId++}`, type: roomType, x, y }] });
    }
  };

  const preview = useMemo(
    () => d.rooms.map((r) => ({ ...r, zone: locateZone(r.x, r.y, d.center, d.northAngle, d.aspectRatio) })),
    [d.rooms, d.center, d.northAngle, d.aspectRatio],
  );

  const source = d.imageUri ? { uri: d.imageUri } : null;

  return (
    <View style={{ gap: space.lg }}>
      <Steps step={step} />

      {step === 0 && (
        <Card style={{ gap: space.md }}>
          <Field label={t("vastu.planTitle")} placeholder={t("vastu.planTitleHint")} value={d.title} onChangeText={(title) => update({ title })} />
          <Txt variant="heading">{t("vastu.upload")}</Txt>
          <Txt variant="caption">{t("vastu.uploadDesc")}</Txt>
          {source ? (
            <Image source={source} style={[styles.preview, { aspectRatio: d.aspectRatio }]} resizeMode="contain" />
          ) : (
            <Pressable onPress={() => pick(false)} style={styles.drop}>
              <Icon name="image" size={40} color={colors.saffron} />
              <Txt variant="subheading" color={colors.saffronDeep}>{t("vastu.gallery")}</Txt>
            </Pressable>
          )}
          <Row gap={space.md}>
            <Button kind="outline" icon="image" title={source ? t("vastu.change") : t("vastu.gallery")} onPress={() => pick(false)} style={{ flex: 1 }} />
            <Button kind="outline" icon="camera" title={t("vastu.camera")} onPress={() => pick(true)} style={{ flex: 1 }} />
          </Row>
          <Button title={t("common.next")} icon="chevronRight" disabled={!source} onPress={() => { if (!d.title.trim()) update({ title: t("vastu.title") }); setStep(1); }} />
        </Card>
      )}

      {step === 1 && (
        <>
          <Card>
            <Txt variant="heading">{t("vastu.northTitle")}</Txt>
            <Txt variant="caption">{t("vastu.northDesc")}</Txt>
          </Card>
          <PlanCanvas source={source} aspectRatio={d.aspectRatio} center={d.center} northAngle={d.northAngle} rooms={[]} maxHeightRatio={1} />
          <Card><NorthDial value={d.northAngle} onChange={(northAngle) => update({ northAngle })} /></Card>
          <Row gap={space.md}>
            <Button kind="outline" title={t("common.back")} onPress={() => setStep(0)} style={{ flex: 1 }} />
            <Button title={t("common.next")} onPress={() => setStep(2)} style={{ flex: 1 }} />
          </Row>
        </>
      )}

      {step === 2 && (
        <>
          <Card style={{ gap: space.sm }}>
            <Txt variant="heading">{t("vastu.roomsTitle")}</Txt>
            <Txt variant="caption">{centerMode ? t("vastu.centerDesc") : t("vastu.roomsDesc")}</Txt>
            <Row style={{ flexWrap: "wrap" }}>
              {ROOM_TYPES.map((rt) => (
                <Chip key={rt} label={t(`room.${rt}`)} active={!centerMode && roomType === rt} color={ROOM_COLOR[rt]} onPress={() => { setRoomType(rt); setCenterMode(false); }} />
              ))}
            </Row>
            <Row style={{ flexWrap: "wrap" }}>
              <Chip label={`◎ ${t("vastu.centerMode")}`} active={centerMode} color={colors.saffronDeep} onPress={() => setCenterMode(!centerMode)} />
            </Row>
            {aiAvailable && d.imageUri ? (
              <Button kind="secondary" icon="sparkle" title={detecting ? t("vastu.aiDetecting") : t("vastu.aiDetect")} loading={detecting} onPress={detect} />
            ) : null}
            {aiNote ? <Txt variant="caption" color={colors.saffronDeep}>{aiNote}</Txt> : null}
          </Card>
          <PlanCanvas
            source={source}
            aspectRatio={d.aspectRatio}
            center={d.center}
            northAngle={d.northAngle}
            rooms={d.rooms}
            onTap={onTap}
            onMarkerPress={(i) => update({ rooms: d.rooms.filter((_, j) => j !== i) })}
          />
          <SectionTitle title={t("vastu.roomCount", { count: d.rooms.length })} />
          {preview.length > 0 && (
            <Card style={{ gap: 4 }}>
              {preview.map((r, i) => (
                <Row key={r.id ?? i}>
                  <View style={[styles.swatch, { backgroundColor: ROOM_COLOR[r.type] }]} />
                  <Txt style={{ flex: 1 }} numberOfLines={1}>{r.label || t(`room.${r.type}`)}</Txt>
                  <Txt variant="label" color={colors.maroon}>{t(`zone.${r.zone}`)}</Txt>
                  <Pressable hitSlop={10} onPress={() => update({ rooms: d.rooms.filter((_, j) => j !== i) })}><Icon name="trash" size={18} color={colors.inkMuted} /></Pressable>
                </Row>
              ))}
            </Card>
          )}
          {d.rooms.length === 0 && <Txt variant="caption" center color={colors.saffronDeep}>{t("vastu.needRooms")}</Txt>}
          <Row gap={space.md}>
            <Button kind="outline" title={t("common.back")} onPress={() => setStep(1)} style={{ flex: 1 }} />
            <Button title={submitLabel} icon="compass" disabled={d.rooms.length === 0} loading={busy} onPress={() => onComplete(d)} style={{ flex: 1.4 }} />
          </Row>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  drop: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.saffron, borderRadius: radius.lg, padding: space.xxl, alignItems: "center", gap: space.sm, backgroundColor: colors.saffronSoft },
  preview: { width: "100%", maxHeight: 360, borderRadius: radius.md, backgroundColor: colors.white },
  swatch: { width: 14, height: 14, borderRadius: 7 },
});
