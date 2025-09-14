import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  image?: string;
  notificationPreferences?: {
    orderUpdates: boolean;
    newArrivals: boolean;
    specialOffers: boolean;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'facebook', payload: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  updateNotifications: (preferences: Record<string, boolean>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.getWithRetry('/auth/me');
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
  const response = await api.postWithRetry('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Successfully logged in');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const loginWithProvider = async (provider: 'google' | 'facebook', payload: any) => {
    try {
      const endpoint = provider === 'google' ? '/auth/google' : '/auth/facebook';
      const response = await api.postWithRetry(endpoint, payload);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success(`Logged in with ${provider === 'google' ? 'Google' : 'Facebook'}`);
    } catch (error: any) {
      const message = error.response?.data?.message || `${provider} login failed`;
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    toast.success('Successfully logged out');
  };

  const updateUser = async (data: Partial<User>) => {
    try {
  const response = await api.patchWithRetry('/users/profile', data);
      setUser(prev => ({ ...prev!, ...response.data.user }));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    }
  };

  const updatePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
  await api.patchWithRetry('/users/password', data);
      toast.success('Password updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
      throw error;
    }
  };

  const updateNotifications = async (preferences: Record<string, boolean>) => {
    try {
  const response = await api.patchWithRetry('/users/notifications', { preferences });
      setUser(prev => ({
        ...prev!,
        notificationPreferences: response.data.preferences
      }));
      toast.success('Notification preferences updated');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update notification preferences';
      toast.error(message);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
  await api.deleteWithRetry('/users/account');
      logout();
      toast.success('Account deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete account';
      toast.error(message);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      login,
  loginWithProvider,
      logout,
      updateUser,
      updatePassword,
      updateNotifications,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}