import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getMyProfile, login as apiLogin, registerUser } from '../api/client';
import { MyProfile, RegisterPayload } from '../api/types';
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

  const applyToken = async (newToken: string) => {
    const me = await getMyProfile(newToken);
    await setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setProfile(me);
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
