import { Pressable, View } from "react-native";
import Slider from "@react-native-community/slider";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { colors, fonts, space } from "@/lib/theme";
import { Chip, Row } from "./ui";
import { Txt } from "./Txt";
import { Icon } from "./Icon";

const norm = (a: number) => ((Math.round(a) % 360) + 360) % 360;

/** Compass rose that rotates to show where North points on the plan, with fine and quick controls. */
export function NorthDial({ value, onChange }: { value: number; onChange: (deg: number) => void }) {
  const { t } = useTranslation();
  const S = 150;
  const quick: [string, number][] = [["northUp", 0], ["northRight", 90], ["northDown", 180], ["northLeft", 270]];
  return (
    <View style={{ alignItems: "center", gap: space.md }}>
      <Row gap={space.lg}>
        <Pressable onPress={() => onChange(norm(value - 5))} hitSlop={10} accessibilityLabel="-5°"><Icon name="minus" size={28} color={colors.maroon} /></Pressable>
        <Svg width={S} height={S} viewBox="-75 -75 150 150">
          <Circle r={72} fill={colors.cream} stroke={colors.gold} strokeWidth={3} />
          <Circle r={60} fill="none" stroke={colors.border} strokeWidth={1} />
          {Array.from({ length: 16 }, (_, i) => (
            <Path key={i} d={`M0 -72 L0 ${i % 4 === 0 ? -60 : -66}`} stroke={colors.maroon} strokeWidth={i % 4 === 0 ? 2 : 1} transform={`rotate(${i * 22.5})`} />
          ))}
          <G transform={`rotate(${value})`}>
            <Path d="M0 -56 L10 0 L0 8 L-10 0 Z" fill={colors.sindoor} />
            <Path d="M0 56 L10 0 L0 -8 L-10 0 Z" fill={colors.inkMuted} />
            <SvgText y={-38} fontSize={13} fontFamily={fonts.bodyBold} fill={colors.white} textAnchor="middle">N</SvgText>
          </G>
          <Circle r={5} fill={colors.gold} />
        </Svg>
        <Pressable onPress={() => onChange(norm(value + 5))} hitSlop={10} accessibilityLabel="+5°"><Icon name="plus" size={28} color={colors.maroon} /></Pressable>
      </Row>
      <Txt variant="bodyBold" color={colors.maroon}>{t("vastu.degrees", { deg: norm(value) })}</Txt>
      <Slider
        style={{ width: "100%", height: 36 }}
        minimumValue={0}
        maximumValue={359}
        step={1}
        value={norm(value)}
        onValueChange={(v: number) => onChange(norm(v))}
        minimumTrackTintColor={colors.saffron}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.maroon}
      />
      <Row style={{ flexWrap: "wrap", justifyContent: "center" }}>
        {quick.map(([k, deg]) => <Chip key={k} label={`${t(`vastu.${k}`)} ${deg}°`} active={norm(value) === deg} onPress={() => onChange(deg)} />)}
      </Row>
    </View>
  );
}
