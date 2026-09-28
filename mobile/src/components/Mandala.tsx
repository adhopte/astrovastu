import Svg, { Circle, G, Path } from "react-native-svg";

/** Faint rangoli-style mandala used as a decorative background watermark. */
export function Mandala({ size = 360, color = "#D4A017", opacity = 0.14 }: { size?: number; color?: string; opacity?: number }) {
  const petals = (count: number, inner: number, outer: number, width: number) =>
    Array.from({ length: count }, (_, i) => (
      <Path
        key={`${count}-${i}`}
        d={`M0 ${-inner} Q${width} ${-(inner + outer) / 2} 0 ${-outer} Q${-width} ${-(inner + outer) / 2} 0 ${-inner} Z`}
        transform={`rotate(${(360 / count) * i})`}
      />
    ));
  return (
    <Svg width={size} height={size} viewBox="-100 -100 200 200" pointerEvents="none">
      <G opacity={opacity} stroke={color} strokeWidth={0.6} fill="none">
        <Circle r={98} />
        <Circle r={94} strokeDasharray="1 3" />
        {petals(32, 70, 92, 5)}
        {petals(16, 44, 70, 9)}
        {petals(8, 20, 44, 11)}
        <Circle r={20} />
        <Circle r={12} />
        {petals(8, 4, 12, 3)}
      </G>
    </Svg>
  );
}
