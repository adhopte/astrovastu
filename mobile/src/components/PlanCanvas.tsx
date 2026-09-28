import { useRef, useState } from "react";
import { GestureResponderEvent, Image, ImageSourcePropType, LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, fonts, radius } from "@/lib/theme";
import { ROOM_COLOR } from "@/lib/vastu";
import type { RoomMark, Zone } from "@/lib/types";
import { VastuGrid } from "./VastuGrid";
import { Txt } from "./Txt";

/**
 * Floor plan with the vastu grid overlaid and room markers. Taps report
 * normalised (0..1) coordinates so they are independent of screen size.
 */
export function PlanCanvas({ source, aspectRatio, center, northAngle, rooms, onTap, onMarkerPress, statuses, showGrid = true, maxHeightRatio = 1.3 }: {
  source: ImageSourcePropType | null;
  aspectRatio: number;
  center: { x: number; y: number };
  northAngle: number;
  rooms: RoomMark[];
  onTap?: (x: number, y: number) => void;
  onMarkerPress?: (index: number) => void;
  statuses?: Partial<Record<Zone, "good" | "neutral" | "afflicted" | "empty">>;
  showGrid?: boolean;
  maxHeightRatio?: number;
}) {
  const { t } = useTranslation();
  const [avail, setAvail] = useState(0);
  const frameRef = useRef<View>(null);
  const onLayout = (e: LayoutChangeEvent) => setAvail(e.nativeEvent.layout.width);
  let w = avail;
  let h = avail / aspectRatio;
  if (h > avail * maxHeightRatio) {
    h = avail * maxHeightRatio;
    w = h * aspectRatio;
  }

  const tap = (e: GestureResponderEvent) => {
    if (!onTap || !w || !h) return;
    let px: number;
    let py: number;
    if (Platform.OS === "web") {
      // react-native-web does not populate locationX/Y on press events; use the DOM rect instead.
      const rect = (frameRef.current as unknown as HTMLElement).getBoundingClientRect();
      const ne = e.nativeEvent as unknown as { clientX: number; clientY: number };
      px = ne.clientX - rect.left;
      py = ne.clientY - rect.top;
    } else {
      px = e.nativeEvent.locationX;
      py = e.nativeEvent.locationY;
    }
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    onTap(Math.min(1, Math.max(0, px / w)), Math.min(1, Math.max(0, py / h)));
  };

  const marker = Math.max(26, Math.min(w, h) / 12);
  return (
    <View onLayout={onLayout} style={{ width: "100%", alignItems: "center" }}>
      {avail > 0 && (
        <View ref={frameRef} style={[styles.frame, { width: w, height: h }]}>
          <Pressable onPress={tap} disabled={!onTap} style={StyleSheet.absoluteFill}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {source ? <Image source={source} style={{ width: w, height: h }} resizeMode="stretch" /> : <View style={styles.blank} />}
              {showGrid && <VastuGrid width={w} height={h} center={center} northAngle={northAngle} statuses={statuses} />}
            </View>
          </Pressable>
          {rooms.map((r, i) => (
            <Pressable
              key={r.id ?? `${r.type}-${i}`}
              onPress={onMarkerPress ? () => onMarkerPress(i) : undefined}
              disabled={!onMarkerPress}
              hitSlop={6}
              style={[styles.marker, { left: r.x * w - marker / 2, top: r.y * h - marker / 2, width: marker, height: marker, backgroundColor: ROOM_COLOR[r.type] }]}
            >
              <Txt style={{ fontFamily: fonts.bodyBold, fontSize: marker * 0.42, lineHeight: marker * 0.55 }} color={colors.white}>
                {(t(`room.${r.type}`) as string).slice(0, 1)}
              </Txt>
              <View pointerEvents="none" style={[styles.tagWrap, { top: marker + 2 }]}>
                <View style={styles.tag}>
                  <Txt numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, fontSize: 10.5, lineHeight: 14 }} color={colors.white}>
                    {r.label || t(`room.${r.type}`)}
                  </Txt>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.md, overflow: "hidden", borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white },
  blank: { flex: 1, backgroundColor: colors.parchment },
  marker: {
    position: "absolute", borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  // Wider than the marker and centred under it, so labels are not clipped to the dot's width.
  tagWrap: { position: "absolute", width: 110, alignItems: "center" },
  tag: { backgroundColor: "rgba(58,31,15,0.82)", borderRadius: 6, paddingHorizontal: 5, maxWidth: 110 },
});
