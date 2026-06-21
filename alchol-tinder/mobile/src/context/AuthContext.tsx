import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getMyProfile, login as apiLogin, registerPushToken, registerUser } from '../api/client';
import { MyProfile, RegisterPayload } from '../api/types';
import { registerForPushNotificationsAsync, unregisterCurrentPushTokenAsync } from '../notifications/setup';
import { deleteItem, getItem, setItem } from '../utils/storage';

const TOKEN_KEY = 'auth_token';

interface AuthState {
  token: string | null;
  profile: MyProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(TOKEN_KEY);
        if (stored) {
          const me = await getMyProfile(stored);
          setToken(stored);
          setProfile(me);
          // App was relaunched with an existing session (cold start) — still
          // need a push token registered for this device/login, same as a
          // fresh login. Fire-and-forget: never blocks reaching the app.
          registerForPushNotificationsAsync(stored);
        }
      } catch {
        // Stored token missing/invalid/expired, or storage unavailable — fall
        // back to a logged-out state rather than hanging on a spinner forever.
        await deleteItem(TOKEN_KEY).catch(() => {});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Expo can reissue a push token (reinstall, OS-level rotation) while the
  // app is already signed in — re-register it with the backend whenever
  // that happens so old chats keep reaching this device. Re-subscribing
  // whenever `token` (the *auth* token, not the push token) changes ensures
  // the listener always closes over the latest signed-in user.
  useEffect(() => {
    if (!token) return;
    const subscription = Notifications.addPushTokenListener(({ data: pushToken }) => {
      registerPushToken(token, pushToken).catch(() => {
        // Best-effort — see registerForPushNotificationsAsync for rationale.
      });
    });
    return () => subscription.remove();
  }, [token]);

  const applyToken = async (newToken: string) => {
    const me = await getMyProfile(newToken);
    await setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setProfile(me);
    await registerForPushNotificationsAsync(newToken);
  };

  const value = useMemo<AuthState>(
    () => ({
      token,
      profile,
      isLoading,
      login: async (email, password) => {
        const newToken = await apiLogin({ email, password });
        await applyToken(newToken);
      },
      register: async (payload) => {
        await registerUser(payload);
        const newToken = await apiLogin({ email: payload.email, password: payload.password });
        await applyToken(newToken);
      },
      logout: async () => {
        if (token) await unregisterCurrentPushTokenAsync(token);
        await deleteItem(TOKEN_KEY);
        setToken(null);
        setProfile(null);
      },
      refreshProfile: async () => {
        if (!token) return;
        setProfile(await getMyProfile(token));
      },
    }),
    [token, profile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
