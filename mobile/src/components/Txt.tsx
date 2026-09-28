import { Text, TextProps, TextStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "@/lib/theme";

type Variant = "display" | "title" | "heading" | "subheading" | "body" | "bodyBold" | "caption" | "label" | "button";

/**
 * Typography that follows the active language: Cinzel for Latin headings,
 * Yatra One for Devanagari headings, and Mukta (Latin + Devanagari) for body text.
 */
export function Txt({ variant = "body", color, center, style, ...rest }: TextProps & { variant?: Variant; color?: string; center?: boolean }) {
  const { i18n } = useTranslation();
  const deva = i18n.language !== "en";
  const display = deva ? fonts.devanagariDisplay : fonts.latinDisplay;
  // Devanagari needs extra line height for matras above and below the headline.
  const lh = (size: number) => Math.round(size * (deva ? 1.55 : 1.35));
  const v: Record<Variant, TextStyle> = {
    display: { fontFamily: display, fontSize: deva ? 30 : 28, lineHeight: lh(deva ? 30 : 28), color: colors.maroon, letterSpacing: deva ? 0 : 0.5 },
    title: { fontFamily: display, fontSize: deva ? 23 : 21, lineHeight: lh(deva ? 23 : 21), color: colors.maroon },
    heading: { fontFamily: deva ? fonts.devanagariDisplay : fonts.latinDisplay, fontSize: deva ? 19 : 16, lineHeight: lh(deva ? 19 : 16), color: colors.maroon },
    subheading: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: lh(16), color: colors.ink },
    body: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: lh(15.5), color: colors.ink },
    bodyBold: { fontFamily: fonts.bodyBold, fontSize: 15.5, lineHeight: lh(15.5), color: colors.ink },
    caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: lh(13), color: colors.inkSoft },
    label: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, lineHeight: lh(13.5), color: colors.inkSoft, letterSpacing: deva ? 0 : 0.3 },
    button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: lh(16), color: colors.white },
  };
  return <Text {...rest} style={[v[variant], color ? { color } : null, center ? { textAlign: "center" } : null, style]} />;
}
