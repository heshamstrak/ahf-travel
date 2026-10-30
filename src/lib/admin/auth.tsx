"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminApi, ApiError, getToken, setToken } from "./api";

export interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "FINANCE" | "SUPPORT" | "CONTENT_EDITOR";
}

interface AdminAuthState {
  user: AdminProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(() => !!getToken());

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await adminApi.get<AdminProfile>("/admin/profile");
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminApi.post<{ accessToken: string; user: { role: string } }>("/auth/login", { email, password });
    if (!["ADMIN", "FINANCE", "SUPPORT", "CONTENT_EDITOR"].includes(res.user.role)) {
      throw new ApiError(403, "FORBIDDEN", "This account does not have admin access");
    }
    setToken(res.accessToken);
    const profile = await adminApi.get<AdminProfile>("/admin/profile");
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.post("/auth/logout");
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  return <AdminAuthContext.Provider value={{ user, loading, login, logout }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
