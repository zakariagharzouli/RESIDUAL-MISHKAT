import { createClient } from '@supabase/supabase-js';
import localforage from 'localforage';
import { UserData } from '../types';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Aucune requête ne doit rester suspendue indéfiniment (réseau de la tablette très lent ou coupé)
const REQUEST_TIMEOUT_MS = 30000;
const fetchWithTimeout: typeof fetch = (input, init) => {
  if (init?.signal) return fetch(input, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { fetch: fetchWithTimeout } });

export const TIMED_OUT = Symbol('timeout');
/** Résout avec TIMED_OUT si la promesse met plus de `ms` (la promesse continue en arrière-plan). */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(TIMED_OUT), ms);
    p.then(v => { clearTimeout(timer); resolve(v); }, () => { clearTimeout(timer); resolve(TIMED_OUT); });
  });
}

/** Utilisateur de la session enregistrée sur l'appareil, lu sans passer par le réseau. */
export function cachedSessionUser(): { id: string; email?: string } | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^sb-.+-auth-token$/.test(k)) {
        const u = JSON.parse(localStorage.getItem(k) || 'null')?.user;
        if (u?.id) return { id: u.id, email: u.email };
      }
    }
  } catch { /* stockage illisible */ }
  return null;
}

export interface QuranVerse {
  id: number;
  surah_number: number;
  ayah_number: number;
  arabic_text: string;
  french_text: string;
}

// Deux emails admin — vérification côté client + RLS côté Supabase
export const ADMIN_EMAILS = ['dz2607@gmail.com', 'zakaria@residual-labs.fr'];
export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

// ─── Auth helpers ────────────────────────────────────────────────────────────

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// ─── Data helpers ────────────────────────────────────────────────────────────

/** Charge les données utilisateur depuis Supabase */
export async function loadUserData(userId: string): Promise<UserData | null> {
  const { data, error } = await supabase
    .from('user_data')
    .select('payload')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data.payload as UserData;
}

/** Sauvegarde les données utilisateur dans Supabase */
export async function saveUserData(userId: string, userData: UserData): Promise<void> {
  await supabase.from('user_data').upsert({ id: userId, payload: userData, updated_at: new Date().toISOString() });
}

/**
 * Migration one-shot : si localforage a des données et Supabase est vide,
 * on copie automatiquement sans rien perdre.
 */
export async function migrateLocalToSupabase(userId: string): Promise<UserData | null> {
  const local = await localforage.getItem<UserData>('mishkat_user_data');
  if (!local) return null;

  const existing = await loadUserData(userId);
  // On ne migre que si le compte Supabase n'a encore aucune page Diftar
  if (existing && existing.diftarPages?.length > 0) return existing;

  await saveUserData(userId, local);
  return local;
}

// ─── Admin helpers ──────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  totalDiftarPages: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const todayStart  = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const weekStart   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersRes, todayRes, weekRes, pagesRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen', todayStart),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
    supabase.from('user_data').select('payload'),
  ]);

  const totalDiftarPages = (pagesRes.data ?? []).reduce(
    (acc: number, row: { payload: UserData }) => acc + (row.payload?.diftarPages?.length ?? 0), 0
  );

  return {
    totalUsers:      usersRes.count   ?? 0,
    activeToday:     todayRes.count   ?? 0,
    newThisWeek:     weekRes.count    ?? 0,
    totalDiftarPages,
  };
}

export interface UserRow {
  id: string;
  email: string;
  username: string;
  created_at: string;
  last_seen: string;
  diftarPages: number;
}

export async function fetchAllUsers(): Promise<UserRow[]> {
  const [profilesRes, dataRes] = await Promise.all([
    supabase.from('profiles').select('id, email, username, created_at, last_seen').order('last_seen', { ascending: false }),
    supabase.from('user_data').select('id, payload'),
  ]);

  const dataMap = new Map(
    (dataRes.data ?? []).map((r: { id: string; payload: UserData }) => [
      r.id,
      (r.payload?.diftarPages?.length ?? 0),
    ])
  );

  return (profilesRes.data ?? []).map((p: { id: string; email: string; username: string; created_at: string; last_seen: string }) => ({
    ...p,
    diftarPages: dataMap.get(p.id) ?? 0,
  }));
}
