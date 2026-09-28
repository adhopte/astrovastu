import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";
import { Icon } from "@/components/Icon";

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  const titleFont = i18n.language === "en" ? fonts.latinDisplay : fonts.devanagariDisplay;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.maroon },
        headerTintColor: colors.goldLight,
        headerTitleStyle: { fontFamily: titleFont, fontSize: 19, color: colors.cream },
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.maroon,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home"), headerShown: false, tabBarIcon: ({ color }) => <Icon name="home" color={String(color)} /> }} />
      <Tabs.Screen name="history" options={{ title: t("history.title"), tabBarLabel: t("tabs.history"), tabBarIcon: ({ color }) => <Icon name="history" color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: t("profile.title"), tabBarLabel: t("tabs.profile"), tabBarIcon: ({ color }) => <Icon name="user" color={String(color)} /> }} />
    </Tabs>
  );
}
