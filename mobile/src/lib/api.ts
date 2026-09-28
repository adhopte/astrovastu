import { Platform } from "react-native";
import { API_URL } from "./config";
import type {
  ActivityItem, AiDetection, AiReading, AuthResponse, BirthInput, ConsultationDetail, ConsultationSummary, KundaliDetail,
  KundaliReport, KundaliSummary, Chart, Lang, Place, Providers, User, VastuDetail, VastuDraft, VastuReport, VastuSummary,
} from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (t: string | null) => { token = t; };
export const getToken = () => token;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };
export const authHeaders = (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...authHeaders(), ...(init.headers as Record<string, string>) };
  let body = init.body;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError(0, "network", "network");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, (data as { message?: string }).message ?? res.statusText, (data as { error?: string }).error);
  }
  return data as T;
}

/** Attach a local image (file:// on device, blob:/data: on web) to multipart form data. */
async function appendImage(form: FormData, uri: string, mimeType = "image/jpeg") {
  const ext = mimeType.split("/")[1] ?? "jpg";
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("plan", blob, `plan.${ext}`);
  } else {
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append("plan", { uri, name: `plan.${ext}`, type: mimeType } as unknown as Blob);
  }
}

const vastuPayload = (d: VastuDraft) => ({
  title: d.title, northAngle: d.northAngle, aspectRatio: d.aspectRatio, center: d.center, rooms: d.rooms, aiDetected: d.aiDetected,
});

export const api = {
  health: () => fetch(`${API_URL}/health`).then((r) => r.json() as Promise<{ ok: boolean; ai: boolean }>),
  providers: () => request<Providers>("/auth/providers"),
  google: (idToken: string, language: Lang) => request<AuthResponse>("/auth/google", { method: "POST", json: { idToken, language } }),
  facebook: (accessToken: string, language: Lang) => request<AuthResponse>("/auth/facebook", { method: "POST", json: { accessToken, language } }),
  apple: (identityToken: string, fullName: string | undefined, language: Lang) =>
    request<AuthResponse>("/auth/apple", { method: "POST", json: { identityToken, fullName, language } }),
  register: (body: { email: string; password: string; name: string; language: Lang }) => request<AuthResponse>("/auth/register", { method: "POST", json: body }),
  login: (email: string, password: string) => request<AuthResponse>("/auth/login", { method: "POST", json: { email, password } }),
  demo: (language: Lang) => request<AuthResponse>("/auth/demo", { method: "POST", json: { language } }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<{ user: User; stats: { kundalis: number; vastu: number; consultations: number } }>("/me"),
  updateMe: (body: { name?: string; language?: Lang }) => request<{ user: User }>("/me", { method: "PATCH", json: body }),
  deleteAccount: () => request<void>("/me", { method: "DELETE" }),

  searchPlaces: (q: string, lang: Lang) => request<{ items: Place[] }>(`/geo/search?q=${encodeURIComponent(q)}&lang=${lang}`),

  createKundali: (b: BirthInput, lang: Lang) => request<{ id: string; chart: Chart; report: KundaliReport }>(`/kundalis?lang=${lang}`, { method: "POST", json: b }),
  kundalis: () => request<{ items: KundaliSummary[] }>("/kundalis"),
  kundali: (id: string, lang: Lang) => request<KundaliDetail>(`/kundalis/${id}?lang=${lang}`),
  deleteKundali: (id: string) => request<void>(`/kundalis/${id}`, { method: "DELETE" }),
  aiReading: (id: string, lang: Lang) => request<{ aiReading: AiReading }>(`/kundalis/${id}/ai-reading?lang=${lang}`, { method: "POST", json: {} }),

  async createVastu(d: VastuDraft, lang: Lang) {
    const form = new FormData();
    form.append("data", JSON.stringify(vastuPayload(d)));
    if (d.imageUri) await appendImage(form, d.imageUri, d.mimeType);
    return request<{ id: string; report: VastuReport }>(`/vastu?lang=${lang}`, { method: "POST", body: form });
  },
  async detectRooms(uri: string, mimeType?: string) {
    const form = new FormData();
    await appendImage(form, uri, mimeType);
    return request<AiDetection>("/vastu/detect", { method: "POST", body: form });
  },
  vastuList: () => request<{ items: VastuSummary[]; aiAvailable: boolean }>("/vastu"),
  vastu: (id: string, lang: Lang) => request<VastuDetail>(`/vastu/${id}?lang=${lang}`),
  vastuImageUrl: (id: string) => `${API_URL}/api/v1/vastu/${id}/image`,
  deleteVastu: (id: string) => request<void>(`/vastu/${id}`, { method: "DELETE" }),

  async consultBoth(birth: BirthInput | { kundaliId: string }, draft: VastuDraft | { vastuId: string }) {
    const form = new FormData();
    const data: Record<string, unknown> = "kundaliId" in birth ? { kundaliId: birth.kundaliId } : { birth };
    if ("vastuId" in draft) data.vastuId = draft.vastuId;
    else {
      data.vastu = vastuPayload(draft);
      if (draft.imageUri) await appendImage(form, draft.imageUri, draft.mimeType);
    }
    form.append("data", JSON.stringify(data));
    return request<{ id: string; kundaliId: string; vastuId: string }>("/consultations/both", { method: "POST", body: form });
  },
  consultations: () => request<{ items: ConsultationSummary[] }>("/consultations"),
  consultation: (id: string, lang: Lang) => request<ConsultationDetail>(`/consultations/${id}?lang=${lang}`),

  activity: (before?: number) => request<{ items: ActivityItem[]; nextCursor: number | null }>(`/activity?limit=30${before ? `&before=${before}` : ""}`),
};
