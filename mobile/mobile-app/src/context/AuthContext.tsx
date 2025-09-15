import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, removeToken } from '../services/authService';
import { fetchCurrentUser } from '../services/userService';
import { onUnauthorized, offUnauthorized } from '../services/api';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await fetchCurrentUser();
          setUser(userData);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
    // Listen for unauthorized events to force logout
  const handler = async () => { await logout(); };
  onUnauthorized(handler);
  return () => { offUnauthorized(handler); };
  }, []);

  const login = async (jwt: string, userData: any) => {
    await saveToken(jwt);
    setToken(jwt);
    setUser(userData);
  };

  const logout = async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
