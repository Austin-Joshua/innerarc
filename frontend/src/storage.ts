import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "innerarc.token";

export async function getStoredToken() {
  return AsyncStorage.getItem(KEY);
}

export async function storeToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(KEY, token);
  } else {
    await AsyncStorage.removeItem(KEY);
  }
}
