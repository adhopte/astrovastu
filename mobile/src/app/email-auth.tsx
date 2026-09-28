import { useState } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/useApi";
import { currentLang } from "@/i18n";
import { colors, space } from "@/lib/theme";
import { Button, Card, Field, Screen, Segmented } from "@/components/ui";
import { Txt } from "@/components/Txt";
import { Logo } from "@/components/Logo";
import { View } from "react-native";

export default function EmailAuth() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t("auth.invalidEmail"));
    if (mode === "signup" && !name.trim()) return setError(t("auth.nameRequired"));
    if (mode === "signup" && password.length < 8) return setError(t("auth.passwordHint"));
    setBusy(true);
    try {
      const res = mode === "signin"
        ? await api.login(email.trim(), password)
        : await api.register({ email: email.trim(), password, name: name.trim(), language: currentLang() });
      await signIn(res);
      router.dismissAll();
      router.replace("/(tabs)");
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: space.md }}><Logo size={84} /></View>
      <Segmented
        value={mode}
        onChange={(m) => { setMode(m); setError(null); }}
        options={[{ value: "signin", label: t("auth.signIn") }, { value: "signup", label: t("auth.signUp") }]}
      />
      <Card style={{ gap: space.md }}>
        {mode === "signup" && <Field label={t("auth.name")} value={name} onChangeText={setName} autoComplete="name" textContentType="name" />}
        <Field label={t("auth.emailLabel")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <Field
          label={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry
          hint={mode === "signup" ? t("auth.passwordHint") : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"} textContentType={mode === "signup" ? "newPassword" : "password"}
          onSubmitEditing={submit}
        />
        {error ? <Txt color={colors.sindoor}>{error}</Txt> : null}
        <Button title={mode === "signin" ? t("auth.signIn") : t("auth.signUp")} onPress={submit} loading={busy} />
      </Card>
    </Screen>
  );
}
