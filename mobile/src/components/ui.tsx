import { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { colors, fonts, gradients, radius, shadow, space } from "@/lib/theme";
import { Txt } from "./Txt";
import { Icon, IconName } from "./Icon";
import { Mandala } from "./Mandala";

/** Parchment page with a faint mandala watermark. */
export function Screen({ children, scroll = true, edges = ["bottom"], contentStyle }: { children: ReactNode; scroll?: boolean; edges?: Edge[]; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradients.parchment} style={{ flex: 1, overflow: "hidden" }}>
      <View style={styles.watermark} pointerEvents="none">
        <Mandala size={420} opacity={0.09} />
      </View>
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

type ButtonKind = "primary" | "secondary" | "outline" | "ghost" | "danger";

export function Button({ title, onPress, kind = "primary", icon, loading, disabled, style, left }: {
  title: string; onPress?: () => void; kind?: ButtonKind; icon?: IconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; left?: ReactNode;
}) {
  const inactive = disabled || loading;
  const fg = kind === "primary" || kind === "secondary" || kind === "danger" ? colors.white : colors.maroon;
  const content = (
    <View style={styles.btnInner}>
      {loading ? <ActivityIndicator color={fg} /> : left ?? (icon ? <Icon name={icon} color={fg} size={20} /> : null)}
      <Txt variant="button" color={fg} numberOfLines={1}>{title}</Txt>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [{ opacity: inactive ? 0.55 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}
    >
      {kind === "primary" || kind === "secondary" ? (
        <LinearGradient colors={kind === "primary" ? gradients.saffron : gradients.maroon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, shadow]}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.btn, kind === "outline" && styles.btnOutline, kind === "danger" && { backgroundColor: colors.sindoor }]}>{content}</View>
      )}
    </Pressable>
  );
}

export function Card({ children, style, onPress, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accent?: string }) {
  const body = <View style={[styles.card, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null, style]}>{children}</View>;
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {body}
    </Pressable>
  );
}

/** Ornamental section heading: ◆ title ◆ with a gold rule. */
export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Path d="M7 0 L9 5 L14 7 L9 9 L7 14 L5 9 L0 7 L5 5 Z" fill={colors.gold} />
      </Svg>
      <Txt variant="heading" style={{ flex: 1 }}>{title}</Txt>
      {right}
    </View>
  );
}

export function LotusDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.rule} />
      <Svg width={34} height={16} viewBox="0 0 34 16">
        <Path d="M17 1c-3 3-3 8 0 13 3-5 3-10 0-13zM6 6c1 4 5 7 10 8-2-4-5-7-10-8zm22 0c-5 1-8 4-10 8 5-1 9-4 10-8z" fill={colors.gold} />
      </Svg>
      <View style={styles.rule} />
    </View>
  );
}

export function Field({ label, hint, error, style, ...rest }: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label">{label}</Txt>
      <TextInput placeholderTextColor={colors.inkMuted} {...rest} style={[styles.input, error ? { borderColor: colors.sindoor } : null, style]} />
      {error ? <Txt variant="caption" color={colors.sindoor}>{error}</Txt> : hint ? <Txt variant="caption">{hint}</Txt> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, color = colors.saffron }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}>
      <Txt variant="label" color={active ? colors.white : colors.ink}>{label}</Txt>
    </Pressable>
  );
}

/** Pill tab bar. With `scrollable`, tabs keep their natural width and the bar scrolls sideways. */
export function Segmented<T extends string>({ options, value, onChange, scrollable }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; scrollable?: boolean }) {
  const items = options.map((o) => (
    <Pressable
      key={o.value}
      onPress={() => onChange(o.value)}
      accessibilityRole="tab"
      accessibilityState={{ selected: value === o.value }}
      style={[styles.segment, scrollable && { flexGrow: 0, flexShrink: 0, flexBasis: "auto", paddingHorizontal: 16 }, value === o.value && styles.segmentActive]}
    >
      <Txt variant="label" color={value === o.value ? colors.white : colors.maroon} center numberOfLines={scrollable ? undefined : 1}>{o.label}</Txt>
    </Pressable>
  ));
  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.segmented}>
        {items}
      </ScrollView>
    );
  }
  return <View style={styles.segmented}>{items}</View>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return (
          <View key={i} style={{ width: size, height: size }}>
            <View style={{ position: "absolute" }}><Icon name="star" size={size} color={colors.goldLight} filled strokeWidth={1} /></View>
            {fill > 0 && (
              <View style={{ position: "absolute", width: size * fill, overflow: "hidden" }}>
                <Icon name="star" size={size} color={colors.gold} filled strokeWidth={1} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function scoreColor(score: number) {
  return score >= 80 ? colors.tulsi : score >= 65 ? "#6E9F2E" : score >= 45 ? colors.haldi : colors.sindoor;
}

export function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const col = scoreColor(score);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.sandal} strokeWidth={10} fill={colors.cream} />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={10} fill="none" strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt style={{ fontFamily: fonts.bodyBold, fontSize: size * 0.28, lineHeight: size * 0.34, color: col }}>{score}</Txt>
      {label ? <Txt variant="caption" center>{label}</Txt> : null}
    </View>
  );
}

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2, alignSelf: "flex-start" }}>
      <Txt variant="label" color={color} style={{ fontSize: 12 }}>{label}</Txt>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.saffron} />
      <Txt variant="caption" style={{ marginTop: 12 }}>{label ?? t("common.loading")}</Txt>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.center, { gap: 12, padding: space.xl }]}>
      <Icon name="alert" size={36} color={colors.sindoor} />
      <Txt center>{message}</Txt>
      {onRetry ? <Button kind="outline" title={t("common.retry")} onPress={onRetry} /> : null}
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  watermark: { position: "absolute", top: -90, right: -140, opacity: 1 },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  btn: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: space.xl, justifyContent: "center" },
  btnOutline: { borderWidth: 1.5, borderColor: colors.maroon, backgroundColor: "rgba(255,255,255,0.6)" },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  card: { backgroundColor: "rgba(255,253,247,0.96)", borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border, gap: space.sm, ...shadow },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm },
  divider: { flexDirection: "row", alignItems: "center", gap: space.sm, marginVertical: space.xs },
  rule: { flex: 1, height: 1, backgroundColor: colors.border },
  input: {
    backgroundColor: colors.white, borderWidth: 1.2, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md,
    paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, color: colors.ink,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.white },
  segmented: { flexDirection: "row", backgroundColor: colors.sandal, borderRadius: radius.pill, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: radius.pill },
  segmentActive: { backgroundColor: colors.maroon },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl },
});
