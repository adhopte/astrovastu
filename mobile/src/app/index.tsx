import { Redirect } from "expo-router";
import { useProfile } from "@/lib/profile";

export default function Index() {
  const { profile } = useProfile();
  return <Redirect href={profile ? "/(tabs)" : "/welcome"} />;
}
