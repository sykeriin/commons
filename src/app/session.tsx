import React, { createContext, useContext, useMemo, useState, useSyncExternalStore, useCallback, useEffect } from 'react';
import type { DB, Person } from '@/src/data/types';
import type { Store } from '@/src/data/store';
import { DemoStore } from '@/src/data/demoStore';
import { FirebaseStore, ensureUser, callableApi } from '@/src/data/firebaseStore';
import { auth, db as fsDb, functions as fsFns, firebaseEnabled, signIn, logout } from '@/src/lib/firebase';
import { registerPush } from '@/src/lib/push';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/src/ui';

const PERSONA_KEY = 'commons.persona';
const THEME_KEY = 'commons.theme';
export type Theme = 'system' | 'light' | 'dark';

interface Session {
  store: Store; me: Person | null; db: DB;
  signInDemo(personId: string): void; signOut(): void; resetDemo(): void;
  theme: Theme; setTheme(t: Theme): void;
  firebaseEnabled: boolean; booting: boolean; signInGoogle(): Promise<void>;
}
const Ctx = createContext<Session>(null as any);
export const useSession = () => useContext(Ctx);
export const useDB = () => useSession().db;
export const useMe = () => useSession().me;
export const useActions = () => useSession().store.actions;

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } };

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [store, setStore] = useState<Store>(() => new DemoStore(safeGet(PERSONA_KEY)));
  const [actorId, setActorId] = useState<string | null>(store.actorId);
  const [booting, setBooting] = useState(firebaseEnabled);
  const [theme, setThemeState] = useState<Theme>(() => (safeGet(THEME_KEY) as Theme) || 'system');
  const db = useSyncExternalStore(store.subscribe, store.getState);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#000000' : '#f6f6f4');
  }, [theme]);

  // Real accounts: swap in the Firestore-backed store when a Firebase user is signed in.
  useEffect(() => {
    if (!firebaseEnabled || !auth || !fsDb || !fsFns) return;
    let cancelled = false;
    const off = onAuthStateChanged(auth, async user => {
      if (user) {
        setBooting(true);
        try {
          await ensureUser(fsDb, user);
          const fs = new FirebaseStore(user.uid, fsDb, callableApi(fsFns)); fs.onError = m => toast(m, 'bad');
          await fs.ready; if (cancelled) { fs.dispose(); return; }
          setStore(prev => { prev.dispose?.(); return fs; }); setActorId(user.uid);
          registerPush(user.uid, fsDb, link => { location.hash = '#' + link; }).catch(() => { /* push is optional */ });
        } catch (e: any) { toast(e?.message ?? 'Sign-in failed', 'bad'); await logout(); }
        finally { setBooting(false); }
      } else {
        setStore(prev => { if (prev.kind !== 'firebase') return prev; prev.dispose?.(); setActorId(null); return new DemoStore(null); });
        setBooting(false);
      }
    });
    return () => { cancelled = true; off(); };
  }, [toast]);

  const setTheme = useCallback((t: Theme) => { setThemeState(t); safeSet(THEME_KEY, t); }, []);
  const signInDemo = useCallback((id: string) => { store.actorId = id; safeSet(PERSONA_KEY, id); setActorId(id); }, [store]);
  const signOut = useCallback(() => {
    if (store.kind === 'firebase') { logout(); return; }
    store.actorId = null; safeSet(PERSONA_KEY, null); setActorId(null);
  }, [store]);
  const signInGoogle = useCallback(async () => { try { await signIn(); } catch (e: any) { toast(e?.message ?? 'Sign-in failed', 'bad'); } }, [toast]);
  const me = useMemo(() => db.people.find(p => p.id === actorId) ?? null, [db.people, actorId]);
  const value = useMemo(() => ({ store, me, db, signInDemo, signOut, resetDemo: () => (store as DemoStore).reset?.(), theme, setTheme, firebaseEnabled, booting, signInGoogle }),
    [store, me, db, signInDemo, signOut, theme, setTheme, booting, signInGoogle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
