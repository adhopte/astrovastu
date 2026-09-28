import Svg, { Circle, G, Line, Path, Text as SvgText, Polygon } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "@/lib/theme";
import { ZONES, ZONE_ELEMENT } from "@/lib/vastu";
import type { Zone } from "@/lib/types";

type ZoneStatus = "good" | "neutral" | "afflicted" | "empty";

const STATUS_FILL: Record<ZoneStatus, string> = { good: colors.tulsi, neutral: colors.haldi, afflicted: colors.sindoor, empty: "transparent" };

/**
 * Circular 16-direction (shodasha) vastu grid drawn over a floor plan of
 * `width`×`height` pixels. Angles are measured clockwise from the image's up;
 * `northAngle` is where true North points.
 */
export function VastuGrid({ width, height, center, northAngle, statuses, showLabels = true }: {
  width: number; height: number; center: { x: number; y: number }; northAngle: number; statuses?: Partial<Record<Zone, ZoneStatus>>; showLabels?: boolean;
}) {
  const { t } = useTranslation();
  const cx = center.x * width;
  const cy = center.y * height;
  const minSide = Math.min(width, height);
  const ring = minSide * 0.46;
  const far = Math.hypot(width, height) * 1.2;
  const brahma = minSide * 0.12;
  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
  };
  const wedge = (a0: number, a1: number, r: number) => {
    const p0 = pt(a0, r);
    const p1 = pt(a1, r);
    return `M${cx} ${cy} L${p0.x} ${p0.y} A${r} ${r} 0 0 1 ${p1.x} ${p1.y} Z`;
  };
  const labelSize = Math.max(9, minSide / 30);
  const north = pt(northAngle, ring + labelSize * 0.2);

  return (
    <Svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
      {ZONES.map((z, i) => {
        const mid = i * 22.5 + northAngle;
        const status = statuses?.[z];
        const fill = status && status !== "empty" ? STATUS_FILL[status] : colors.element[ZONE_ELEMENT[z]];
        const opacity = status && status !== "empty" ? 0.28 : 0.1;
        return <Path key={z} d={wedge(mid - 11.25, mid + 11.25, far)} fill={fill} fillOpacity={opacity} />;
      })}
      {ZONES.map((z, i) => {
        const a = i * 22.5 + northAngle + 11.25;
        const p = pt(a, far);
        return <Line key={`l${z}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.maroon} strokeOpacity={0.55} strokeWidth={1} strokeDasharray="4 3" />;
      })}
      <Circle cx={cx} cy={cy} r={ring} stroke={colors.maroon} strokeWidth={1.6} fill="none" strokeOpacity={0.8} />
      <Circle cx={cx} cy={cy} r={ring * 0.66} stroke={colors.gold} strokeWidth={1} fill="none" strokeOpacity={0.8} />
      <Circle cx={cx} cy={cy} r={brahma} stroke={colors.saffronDeep} strokeWidth={1.5} fill={colors.saffron} fillOpacity={0.15} />
      <SvgText x={cx} y={cy + labelSize * 0.35} fontSize={labelSize * 0.85} fill={colors.saffronDeep} textAnchor="middle" fontFamily={fonts.bodyBold}>
        {t("zone.C")}
      </SvgText>
      {showLabels && ZONES.map((z, i) => {
        const main = i % 4 === 0;
        const p = pt(i * 22.5 + northAngle, ring * (main ? 0.83 : 0.84));
        return (
          <G key={`t${z}`}>
            <Circle cx={p.x} cy={p.y} r={labelSize * (main ? 1.05 : 0.95)} fill={main ? colors.goldLight : "rgba(255,248,236,0.92)"} stroke={main ? colors.gold : colors.maroon} strokeWidth={main ? 1.2 : 0.8} />
            <SvgText x={p.x} y={p.y + labelSize * 0.33} fontSize={labelSize * (main ? 0.85 : 0.62)} fill={colors.maroon} textAnchor="middle" fontFamily={fonts.bodyBold}>
              {main ? t(`zone.${z}`) : z}
            </SvgText>
          </G>
        );
      })}
      <G transform={`rotate(${northAngle} ${north.x} ${north.y})`}>
        <Polygon points={`${north.x},${north.y - labelSize * 1.2} ${north.x - labelSize * 0.6},${north.y + labelSize * 0.2} ${north.x + labelSize * 0.6},${north.y + labelSize * 0.2}`} fill={colors.sindoor} />
      </G>
    </Svg>
  );
}
