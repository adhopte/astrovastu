import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText, G } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "@/lib/theme";
import type { Chart, PlanetId } from "@/lib/types";

/** Label anchor (as fractions of the chart size) for each house in the North Indian diamond layout. */
const HOUSE_POS: [number, number][] = [
  [0.5, 0.25], [0.25, 0.1], [0.1, 0.25], [0.25, 0.5], [0.1, 0.75], [0.25, 0.9],
  [0.5, 0.75], [0.75, 0.9], [0.9, 0.75], [0.75, 0.5], [0.9, 0.25], [0.75, 0.1],
];
/** Where to print the sign number, nudged toward the centre of the chart. */
const SIGN_POS: [number, number][] = [
  [0.5, 0.44], [0.25, 0.2], [0.2, 0.25], [0.44, 0.5], [0.2, 0.75], [0.25, 0.8],
  [0.5, 0.56], [0.75, 0.8], [0.8, 0.75], [0.56, 0.5], [0.8, 0.25], [0.75, 0.2],
];
/** Kendra houses (diamonds) have more room than the triangles. */
const BIG = new Set([0, 3, 6, 9]);

const PLANET_COLOR: Record<PlanetId, string> = {
  sun: "#C4550B", moon: "#3F6E9E", mars: "#B3261E", mercury: "#2F7D4A", jupiter: "#B8860B", venus: "#A0467A", saturn: "#3A3A6A", rahu: "#5A4A3A", ketu: "#6B5A4A",
};

/**
 * North Indian style chart. `variant = "d9"` draws the Navamsa using each
 * planet's navamsa sign with houses counted from the navamsa lagna.
 */
export function KundaliChart({ chart, size = 320, variant = "d1" }: { chart: Chart; size?: number; variant?: "d1" | "d9" }) {
  const { t, i18n } = useTranslation();
  const S = size;
  const lagnaSign = variant === "d1" ? chart.ascendant.sign : chart.ascendant.navamsaSign;
  const occupants: { id: PlanetId; retro: boolean }[][] = Array.from({ length: 12 }, () => []);
  for (const p of chart.planets) {
    const sign = variant === "d1" ? p.sign : p.navamsaSign;
    const house = (sign - lagnaSign + 12) % 12;
    occupants[house].push({ id: p.id, retro: p.retrograde && p.id !== "rahu" && p.id !== "ketu" });
  }
  const fs = S / 22;
  const deva = i18n.language !== "en";
  const pf = deva ? fonts.bodySemiBold : fonts.bodySemiBold;

  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Defs>
        <LinearGradient id="kbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF8E6" />
          <Stop offset="1" stopColor="#F8E3B8" />
        </LinearGradient>
      </Defs>
      <Rect x={1.5} y={1.5} width={S - 3} height={S - 3} fill="url(#kbg)" stroke={colors.maroon} strokeWidth={3} rx={6} />
      <Rect x={7} y={7} width={S - 14} height={S - 14} fill="none" stroke={colors.gold} strokeWidth={1} rx={3} />
      <Path
        d={`M3 3 L${S - 3} ${S - 3} M${S - 3} 3 L3 ${S - 3} M${S / 2} 3 L${S - 3} ${S / 2} L${S / 2} ${S - 3} L3 ${S / 2} Z`}
        stroke={colors.maroon} strokeWidth={1.6} fill="none"
      />
      {/* Lagna marker in house 1 */}
      <Path d={`M${S / 2 - 8} ${S * 0.035} L${S / 2} ${S * 0.07} L${S / 2 + 8} ${S * 0.035}`} stroke={colors.saffron} strokeWidth={2} fill="none" />
      {HOUSE_POS.map(([hx, hy], h) => {
        const sign = ((lagnaSign + h) % 12) + 1;
        const [sx, sy] = SIGN_POS[h];
        const list = occupants[h];
        const perRow = BIG.has(h) ? 3 : 2;
        const rows = Math.ceil(list.length / perRow);
        const lineH = fs * 1.35;
        const startY = hy * S - ((rows - 1) * lineH) / 2 + fs * 0.35;
        return (
          <G key={h}>
            <SvgText x={sx * S} y={sy * S + fs * 0.35} fontSize={fs * 0.85} fill={colors.inkMuted} textAnchor="middle" fontFamily={fonts.bodyMedium}>
              {sign}
            </SvgText>
            {h === 0 && (
              <SvgText x={hx * S} y={hy * S - fs * 1.6} fontSize={fs * 0.8} fill={colors.saffronDeep} textAnchor="middle" fontFamily={fonts.bodyBold}>
                {t("planetShort.asc")}
              </SvgText>
            )}
            {list.map((o, i) => {
              const row = Math.floor(i / perRow);
              const inRow = Math.min(perRow, list.length - row * perRow);
              const col = i % perRow;
              const dx = (col - (inRow - 1) / 2) * fs * (deva ? 2.1 : 1.9);
              return (
                <SvgText key={o.id} x={hx * S + dx} y={startY + row * lineH} fontSize={fs} fill={PLANET_COLOR[o.id]} textAnchor="middle" fontFamily={pf}>
                  {t(`planetShort.${o.id}`)}{o.retro ? "*" : ""}
                </SvgText>
              );
            })}
          </G>
        );
      })}
    </Svg>
  );
}
