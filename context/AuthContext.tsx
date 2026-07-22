import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useThemeContext } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { clearUserLocalData } from '@/lib/localData';
import { readCachedUserPreferences, syncUserPreferences, type UserPreferences } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeContext();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const lastUserId = useRef<string | null>(null);

  const applyPreferences = async (preferences: UserPreferences) => {
    setTheme(preferences.theme);
    if (!i18n.resolvedLanguage?.startsWith(preferences.language)) {
      await i18n.changeLanguage(preferences.language);
    }
  };

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setLoading(false);
      return;
    }

    const acceptSession = (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id ?? null;
      const previousUserId = lastUserId.current;
      if (previousUserId && previousUserId !== nextUserId) {
        void clearUserLocalData(previousUserId);
      }
      lastUserId.current = nextUserId;
      if (active) setSession(nextSession);
    };

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        acceptSession(data.session);
      })
      .catch(() => {
        acceptSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      acceptSession(nextSession);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const userId = session?.user.id;
    setPreferencesReady(false);
    if (!userId) {
      setPreferencesReady(true);
      return () => { active = false; };
    }

    (async () => {
      try {
        const cached = await readCachedUserPreferences(userId);
        if (active && cached) await applyPreferences(cached);
        const [legacyHour, legacyMode] = cached ? [null, null] : await Promise.all([
          AsyncStorage.getItem('notificationHour'),
          AsyncStorage.getItem('nutritionTargetsMode'),
        ]);
        const fallback = cached ?? {
          language: i18n.resolvedLanguage?.startsWith('en') ? 'en' as const : i18n.resolvedLanguage?.startsWith('pt') ? 'pt' as const : 'es' as const,
          theme,
          reminderTime: legacyHour ?? '13:00',
          nutritionTargetsMode: legacyMode === 'manual' ? 'manual' as const : 'auto' as const,
        };
        const remote = await syncUserPreferences(userId, fallback);
        if (active) await applyPreferences(remote);
      } catch {
        // Device defaults and any cached preferences remain available offline.
      } finally {
        if (active) setPreferencesReady(true);
      }
    })();

    return () => { active = false; };
  }, [session?.user.id]);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading: loading || !preferencesReady }),
    [loading, preferencesReady, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

