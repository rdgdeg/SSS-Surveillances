/**
 * Application Global Store
 * 
 * Manages global application state with Zustand.
 * Persists selected state to localStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Session } from '../../types';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AppState {
  // Session state
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Theme (already managed by ThemeContext, but can be here too)
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Reset function
  reset: () => void;
}

const initialState = {
  activeSession: null,
  currentUser: null,
  sidebarOpen: true,
  isDarkMode: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Session actions
      setActiveSession: (session) => set({ activeSession: session }),
      
      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Theme actions
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Reset to initial state
      reset: () => set(initialState),
    }),
    {
      name: 'app-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields
      partialize: (state) => ({
        activeSession: state.activeSession,
        sidebarOpen: state.sidebarOpen,
        isDarkMode: state.isDarkMode,
        // Don't persist currentUser for security
      }),
    }
  )
);

// Selectors for better performance
export const useActiveSession = () => useAppStore((state) => state.activeSession);
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useIsDarkMode = () => useAppStore((state) => state.isDarkMode);
