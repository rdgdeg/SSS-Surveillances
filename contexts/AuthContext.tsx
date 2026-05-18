import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../lib/auth';
import { VersioningContext } from '../lib/versioningContext';

const ADMIN_USER_KEY = 'admin_user';

function getDisplayName(user: AdminUser & { nom?: string; prenom?: string; email?: string }) {
  return user.nom && user.prenom
    ? `${user.prenom} ${user.nom}`
    : user.display_name || user.username || user.email || 'Admin';
}

function readStoredAdminUser(): AdminUser | null {
  try {
    const storedUser = localStorage.getItem(ADMIN_USER_KEY);
    if (!storedUser) return null;
    return JSON.parse(storedUser) as AdminUser;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    localStorage.removeItem(ADMIN_USER_KEY);
    return null;
  }
}

interface AuthContextType {
  user: AdminUser | null;
  login: (user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => readStoredAdminUser());

  useEffect(() => {
    if (user) {
      VersioningContext.setCurrentUser(user.id || user.username, getDisplayName(user));
    }
  }, [user]);

  const login = (user: AdminUser) => {
    setUser(user);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    VersioningContext.setCurrentUser(user.id || user.username, getDisplayName(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(ADMIN_USER_KEY);
    VersioningContext.clearCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
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
