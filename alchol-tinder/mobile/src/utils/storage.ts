import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store has no real equivalent on web (no OS keychain to use from
// a browser) — fall back to localStorage there, use the native secure store
// everywhere else.
const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
