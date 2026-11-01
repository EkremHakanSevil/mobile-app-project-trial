import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { HealthProfile } from '@/features/health/calc';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
  bio: string | null;
  onboarded: boolean;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  health: HealthProfile | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [health, setHealth] = useState<HealthProfile | null>(null);

  const loadUserData = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setHealth(null);
      return;
    }
    const [p, h] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('health_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    setProfile((p.data as Profile | null) ?? null);
    setHealth(h.data ? normalizeHealth(h.data) : null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadUserData(data.session?.user.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Callback içinde await edilmemeli (supabase-js deadlock uyarısı)
      setTimeout(() => void loadUserData(next?.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const refresh = useCallback(() => loadUserData(session?.user.id), [loadUserData, session]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, profile, health, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}

// Postgres numeric alanları string olarak dönebilir
function normalizeHealth(row: Record<string, unknown>): HealthProfile {
  return {
    birth_date: String(row.birth_date),
    sex: row.sex as HealthProfile['sex'],
    height_cm: Number(row.height_cm),
    weight_kg: Number(row.weight_kg),
    goal: row.goal as HealthProfile['goal'],
    activity_level: row.activity_level as HealthProfile['activity_level'],
    experience: row.experience as HealthProfile['experience'],
  };
}
