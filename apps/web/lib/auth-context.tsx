"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { API_URL, getMe, loginUser, logoutUser, refreshAccessToken, registerUser, type PublicUser } from "./api";

const ACCESS_KEY = "nova_access_token";
const REFRESH_KEY = "nova_refresh_token";

interface AuthContextValue {
  user: PublicUser | null;
  /** True until the initial session check (reading localStorage + validating with the API) finishes. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Authenticated fetch — attaches the access token and retries once after a silent refresh on 401. */
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((tokens: { accessToken: string; refreshToken: string }) => {
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }, []);

  const clear = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }, []);

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const withAuth = (token: string | null) =>
        fetch(`${API_URL}${path}`, {
          ...init,
          headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });

      let res = await withAuth(accessToken);
      if (res.status === 401 && refreshToken) {
        try {
          const tokens = await refreshAccessToken(refreshToken);
          persist(tokens);
          res = await withAuth(tokens.accessToken);
        } catch {
          clear();
        }
      }
      return res;
    },
    [accessToken, refreshToken, persist, clear],
  );

  // On mount: try to restore a session from localStorage and validate it against the API.
  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!storedAccess || !storedRefresh) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await getMe(storedAccess);
        if (cancelled) return;
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(me);
      } catch {
        try {
          const tokens = await refreshAccessToken(storedRefresh);
          const me = await getMe(tokens.accessToken);
          if (cancelled) return;
          persist(tokens);
          setUser(me);
        } catch {
          if (!cancelled) clear();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginUser(email, password);
      persist(result);
      setUser(result.user);
    },
    [persist],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const result = await registerUser(email, password, displayName);
      persist(result);
      setUser(result.user);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      await logoutUser(refreshToken).catch(() => undefined);
    }
    clear();
  }, [refreshToken, clear]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
