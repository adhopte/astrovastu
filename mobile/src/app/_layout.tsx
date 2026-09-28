import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Cinzel_400Regular, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold } from "@expo-google-fonts/mukta";
import { useTranslation } from "react-i18next";
import { restoreLanguage } from "@/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { ready } = useAuth();
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  const headerTitleStyle = { fontFamily: i18n.language === "en" ? fonts.latinDisplay : fonts.devanagariDisplay, fontSize: 19, color: colors.cream };
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.maroon },
        headerTintColor: colors.goldLight,
        headerTitleStyle,
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="email-auth" options={{ title: t("auth.email") }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="astro/new" options={{ title: t("home.astro") }} />
      <Stack.Screen name="astro/[id]" options={{ title: t("kundali.title") }} />
      <Stack.Screen name="vastu/new" options={{ title: t("vastu.title") }} />
      <Stack.Screen name="vastu/[id]" options={{ title: t("vastu.title") }} />
      <Stack.Screen name="both/new" options={{ title: t("both.title") }} />
      <Stack.Screen name="both/[id]" options={{ title: t("both.title") }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular, Cinzel_700Bold, YatraOne_400Regular, Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold,
  });
  const [langReady, setLangReady] = useState(false);
  useEffect(() => { restoreLanguage().finally(() => setLangReady(true)); }, []);

  if ((!fontsLoaded && !fontError) || !langReady) return null;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
