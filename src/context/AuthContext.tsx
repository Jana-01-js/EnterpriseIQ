import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAsDemo: (email: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  activeDocViewerId: string | null;
  openDocumentViewer: (docId: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDocViewerId, setActiveDocViewerId] = useState<string | null>(null);

  const initAuth = async () => {
    const token = localStorage.getItem('eiq_auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('eiq_auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const res = await api.login(credentials);
      localStorage.setItem('eiq_auth_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email });
      localStorage.setItem('eiq_auth_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('eiq_auth_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('eiq_auth_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (e) {
      console.error(e);
    }
  };

  const openDocumentViewer = (docId: string | null) => {
    setActiveDocViewerId(docId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAsDemo,
        register,
        logout,
        activeDocViewerId,
        openDocumentViewer,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
