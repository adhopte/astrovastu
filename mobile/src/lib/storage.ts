import AsyncStorage from "@react-native-async-storage/async-storage";

/** Small key/value preferences (currently just the saved UI language). */
export const prefs = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
