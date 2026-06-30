import Constants from 'expo-constants';

// JaaS AppID — public tenant identifier (not a secret), used to build the
// room path/script URL on the 8x8.vc embed. The actual secret (private key)
// never leaves the backend — see backend/src/services/jaas.py.
export const JAAS_APP_ID = (Constants.expoConfig?.extra?.jaasAppId as string | undefined) ?? '';
