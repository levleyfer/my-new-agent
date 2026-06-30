import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from './i18n';

export type Theme = 'light' | 'dark';

interface LangState {
  lang: Lang;
  theme: Theme;
  toggle: () => void;
  toggleTheme: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      theme: 'light',
      toggle: () => set({ lang: get().lang === 'en' ? 'he' : 'en' }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'lang' }
  )
);
