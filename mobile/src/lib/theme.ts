/** Dharmic palette: saffron (tyaga), sindoor maroon, temple gold, sandalwood and cream parchment. */
export const colors = {
  saffron: "#E8751A",
  saffronDeep: "#C4550B",
  saffronSoft: "#FCE3C8",
  maroon: "#7A1F1F",
  maroonDeep: "#4A0D0D",
  gold: "#D4A017",
  goldLight: "#F4D77B",
  goldPale: "#FBEFC9",
  cream: "#FFF8EC",
  parchment: "#FBF1DC",
  sandal: "#F3E0BC",
  ink: "#3A1F0F",
  inkSoft: "#6B4A33",
  inkMuted: "#9A7B60",
  border: "#E8D2A6",
  white: "#FFFFFF",
  tulsi: "#2F7D4A",
  tulsiSoft: "#DDF0E2",
  haldi: "#E0A100",
  haldiSoft: "#FFF1C7",
  sindoor: "#B3261E",
  sindoorSoft: "#FADAD6",
  lotus: "#E57C98",
  peacock: "#1F5E7A",
  element: {
    water: "#4C8DC9",
    air: "#6DAE6A",
    fire: "#E8751A",
    earth: "#C99A3B",
    space: "#9C8FB8",
  },
};

export const gradients = {
  saffron: [colors.saffron, colors.saffronDeep] as const,
  sunrise: ["#FFB347", "#E8751A", "#B8410B"] as const,
  maroon: [colors.maroon, colors.maroonDeep] as const,
  gold: ["#F4D77B", "#D4A017"] as const,
  parchment: ["#FFF8EC", "#FBEBCB"] as const,
};

export const fonts = {
  latinDisplay: "Cinzel_700Bold",
  latinDisplayRegular: "Cinzel_400Regular",
  devanagariDisplay: "YatraOne_400Regular",
  body: "Mukta_400Regular",
  bodyMedium: "Mukta_500Medium",
  bodySemiBold: "Mukta_600SemiBold",
  bodyBold: "Mukta_700Bold",
};

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  shadowColor: "#7A1F1F",
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};
