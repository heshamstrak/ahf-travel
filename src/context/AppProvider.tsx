"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CurrencyCode, LanguageCode, ProductType } from "@/data/types";
import { isCurrencyCode } from "@/lib/currency";
import { translate } from "@/lib/i18n";
import { usePersistentState } from "@/lib/persistent";
import { api, ApiError, getAccessToken, setAccessToken, tryRefresh } from "@/lib/api/client";
import type { LoginResponse, PublicUser } from "@/lib/api/types";

const CURRENCY_KEY = "eb.currency";
const LANGUAGE_KEY = "eb.language";
const FAVORITES_KEY = "eb.favorites";

const NO_FAVORITES: FavoriteItem[] = [];

export interface FavoriteItem {
  type: Exclude<ProductType, "transfer">;
  id: string;
}

interface AppContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  t: (key: string) => string;
  favorites: FavoriteItem[];
  isFavorite: (type: FavoriteItem["type"], id: string) => boolean;
  toggleFavorite: (type: FavoriteItem["type"], id: string) => void;
  /** The real, signed-in customer (Milestone 7) — or null for a guest. Guest checkout stays fully
   *  supported everywhere this is null; nothing requires signing in. */
  user: PublicUser | null;
  /** True only while the initial silent-refresh-on-mount check is still in flight. */
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [storedCurrency, setStoredCurrency] = usePersistentState<string>(CURRENCY_KEY, "EGP");
  const [storedLanguage, setStoredLanguage] = usePersistentState<LanguageCode>(LANGUAGE_KEY, "en");
  const [favorites, setFavorites] = usePersistentState<FavoriteItem[]>(FAVORITES_KEY, NO_FAVORITES);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const currency: CurrencyCode = isCurrencyCode(storedCurrency) ? storedCurrency : "EGP";
  const language: LanguageCode = storedLanguage === "ar" ? "ar" : "en";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.get<PublicUser>("/users/me");
      setUser(profile);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // On mount: try the backend's httpOnly refresh cookie once, silently. This is how a returning
  // visitor appears signed in again without re-entering a password, in a brand-new tab whose
  // sessionStorage (the access token) is empty but whose refresh cookie may still be valid.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await tryRefresh();
        if (!accessToken || cancelled) return;
        const profile = await api.get<PublicUser>("/users/me");
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) setAccessToken(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => setStoredCurrency(c), [setStoredCurrency]);
  const setLanguage = useCallback((l: LanguageCode) => setStoredLanguage(l), [setStoredLanguage]);

  const isFavorite = useCallback(
    (type: FavoriteItem["type"], id: string) => favorites.some((f) => f.type === type && f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (type: FavoriteItem["type"], id: string) => {
      const exists = favorites.some((f) => f.type === type && f.id === id);
      const next = exists ? favorites.filter((f) => !(f.type === type && f.id === id)) : [...favorites, { type, id }];
      setFavorites(next);
    },
    [favorites, setFavorites]
  );

  /** Real sign-in against the backend (POST /auth/login). Throws ApiError on failure (invalid
   *  credentials, unverified email, locked account) — the caller (LoginForm) shows the message. */
  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", { email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logging out still clears the local session even if the network call fails.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      currency,
      setCurrency,
      language,
      setLanguage,
      t: (key: string) => translate(language, key),
      favorites,
      isFavorite,
      toggleFavorite,
      user,
      authLoading,
      signIn,
      signOut,
      refreshUser,
    }),
    [currency, setCurrency, language, setLanguage, favorites, isFavorite, toggleFavorite, user, authLoading, signIn, signOut, refreshUser]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export { ApiError, getAccessToken };
