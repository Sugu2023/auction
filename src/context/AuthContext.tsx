import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiRequest, setAuthToken } from '../api/client';
import type { Role } from '../types';

export interface Session {
  username: string;
  role: Role;
  teamId?: string;
  token: string;
}

interface LoginResponse {
  token: string;
  user: { id: number; username: string; role: Role; teamId: string | null };
}

const STORAGE_KEY = 'sports-e-auction-session';

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the session simply lasts for this page only.
  }
}

interface AuthContextValue {
  session: Session | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = readSession();
    setAuthToken(saved?.token ?? null);
    return saved;
  });

  // Throws ApiError with the server's message when the login is rejected.
  async function login(username: string, password: string) {
    const { token, user } = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { username: username.trim(), password },
    });
    const next: Session = {
      username: user.username,
      role: user.role,
      teamId: user.teamId ?? undefined,
      token,
    };
    setAuthToken(token);
    writeSession(next);
    setSession(next);
  }

  function logout() {
    setAuthToken(null);
    writeSession(null);
    setSession(null);
  }

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
