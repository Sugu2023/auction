import { createContext, useContext, useState, type ReactNode } from 'react';
import { auctionData } from '../data';
import type { Role } from '../types';

export interface Session {
  username: string;
  role: Role;
  teamId?: string;
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
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  function login(username: string, password: string): boolean {
    const user = auctionData.users.find(u => u.username === username.trim() && u.password === password);
    if (!user) return false;
    const next: Session = { username: user.username, role: user.role, teamId: user.teamId };
    writeSession(next);
    setSession(next);
    return true;
  }

  function logout() {
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
