import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDefaultBaseUrl(): string {
  // Derive the backend host from the same address Expo served the JS bundle
  // from (e.g. "192.168.1.50:8081" for a phone on Expo Go over LAN, or
  // "localhost:8081" in a browser). This means a phone on the same WiFi
  // reaches the dev machine automatically — no manual IP and no dev tunnel
  // (which round-trips through a remote relay and adds real latency, see the
  // earlier "everything is slow" investigation).
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000`;
  }

  // Fallback for contexts with no hostUri (e.g. a production build).
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

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
