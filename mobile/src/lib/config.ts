import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || "http://localhost:4000").replace(/\/$/, "");

export const OAUTH = {
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "",
};
