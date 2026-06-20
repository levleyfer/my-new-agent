import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDefaultBaseUrl(): string {
  // Android emulator can't reach the host machine via "localhost" — it maps
  // to the emulator itself, so the host loopback is exposed at 10.0.2.2.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

export const API_BASE_URL = configuredUrl && configuredUrl.length > 0
  ? configuredUrl
  : resolveDefaultBaseUrl();
