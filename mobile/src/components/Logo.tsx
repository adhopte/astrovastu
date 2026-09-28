import { useMemo } from "react";
import { SvgXml } from "react-native-svg";
import { logoSvg } from "./logoSvg";

export function Logo({ size = 96 }: { size?: number }) {
  const xml = useMemo(() => logoSvg(), []);
  return <SvgXml xml={xml} width={size} height={size} accessibilityLabel="AstroVastu" />;
}
