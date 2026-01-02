import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../lib/auth';
import { VersioningContext } from '../lib/versioningContext';

interface AuthContextType {
  user: AdminUser | null;
  login: (user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Configurer le contexte de versioning
        const displayName = userData.nom && userData.prenom 
          ? `${userData.prenom} ${userData.nom}`
          : userData.username || userData.email || 'Admin';
        
        VersioningContext.setCurrentUser(userData.id || userData.username, displayName);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  const login = (user: AdminUser) => {
    setUser(user);
    localStorage.setItem('admin_user', JSON.stringify(user));
    
    // Configurer le contexte de versioning
    const displayName = user.nom && user.prenom 
      ? `${user.prenom} ${user.nom}`
      : user.username || user.email || 'Admin';
    
    VersioningContext.setCurrentUser(user.id || user.username, displayName);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
    VersioningContext.clearCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
