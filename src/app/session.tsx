import React, { createContext, useContext, useMemo, useState, useSyncExternalStore, useCallback, useEffect } from 'react';
import type { DB, Person } from '@/src/data/types';
import type { Store } from '@/src/data/store';
import { DemoStore } from '@/src/data/demoStore';

const PERSONA_KEY = 'commons.persona';
const THEME_KEY = 'commons.theme';
export type Theme = 'system' | 'light' | 'dark';

interface Session {
  store: Store; me: Person | null; db: DB;
  signInDemo(personId: string): void; signOut(): void; resetDemo(): void;
  theme: Theme; setTheme(t: Theme): void;
}
const Ctx = createContext<Session>(null as any);
export const useSession = () => useContext(Ctx);
export const useDB = () => useSession().db;
export const useMe = () => useSession().me;
export const useActions = () => useSession().store.actions;

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } };

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store] = useState(() => new DemoStore(safeGet(PERSONA_KEY)));
  const [actorId, setActorId] = useState<string | null>(store.actorId);
  const [theme, setThemeState] = useState<Theme>(() => (safeGet(THEME_KEY) as Theme) || 'system');
  const db = useSyncExternalStore(store.subscribe, store.getState);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0f1011' : '#f6f6f4');
  }, [theme]);

  const setTheme = useCallback((t: Theme) => { setThemeState(t); safeSet(THEME_KEY, t); }, []);
  const signInDemo = useCallback((id: string) => { store.actorId = id; safeSet(PERSONA_KEY, id); setActorId(id); }, [store]);
  const signOut = useCallback(() => { store.actorId = null; safeSet(PERSONA_KEY, null); setActorId(null); }, [store]);
  const me = useMemo(() => db.people.find(p => p.id === actorId) ?? null, [db.people, actorId]);
  const value = useMemo(() => ({ store, me, db, signInDemo, signOut, resetDemo: () => store.reset(), theme, setTheme }), [store, me, db, signInDemo, signOut, theme, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
