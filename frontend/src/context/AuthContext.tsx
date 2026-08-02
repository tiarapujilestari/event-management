import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; role?: string; referralCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchMe() {
    try {
      if (!getAccessToken()) {
        setUser(null);
        return;
      }
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    fetchMe().finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string, rememberMe = false) {
    const { data } = await api.post('/auth/login', { email, password, rememberMe });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }

  async function register(payload: { fullName: string; email: string; password: string; role?: string; referralCode?: string }) {
    await api.post('/auth/register', payload);
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => null);
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
