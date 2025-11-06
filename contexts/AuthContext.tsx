import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import toast from 'react-hot-toast';

const ADMIN_PASSWORD = 'uclouvain1200';
const AUTH_KEY = 'isAdminAuthenticated';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isBrowser = typeof window !== 'undefined';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (!isBrowser) {
      return false; // Fallback for non-browser environments
    }
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  });

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      if (isBrowser) {
        sessionStorage.setItem(AUTH_KEY, 'true');
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    if (isBrowser) {
      sessionStorage.removeItem(AUTH_KEY);
    }
    setIsAuthenticated(false);
    toast.success('Vous avez été déconnecté.');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
