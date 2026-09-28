import { useEffect, useState } from "react";
import { Platform, ImageSourcePropType } from "react-native";
import { authHeaders } from "@/lib/api";

/** Floor plans are private: send the bearer token (native) or fetch to a blob URL (web). */
export function useAuthedImage(url: string | null): ImageSourcePropType | null {
  const [webUri, setWebUri] = useState<string | null>(null);
  useEffect(() => {
    if (!url || Platform.OS !== "web") return;
    let revoked = false;
    let objectUrl: string | null = null;
    fetch(url, { headers: authHeaders() })
      .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((b) => { if (!revoked) { objectUrl = URL.createObjectURL(b); setWebUri(objectUrl); } })
      .catch(() => {});
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);
  if (!url) return null;
  if (Platform.OS === "web") return webUri ? { uri: webUri } : null;
  return { uri: url, headers: authHeaders() };
}
