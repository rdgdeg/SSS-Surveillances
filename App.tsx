
import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import AvailabilityForm from './components/public/AvailabilityForm';
import { University, Users, Loader2, BookOpen, UserCheck, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/shared/Card';
import { Button } from './components/shared/Button';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import MainLayout from './components/layouts/MainLayout';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { DebugProvider, useDebug } from './contexts/DebugContext';
import DebugPanel from './components/shared/DebugPanel';

// Lazy load admin components for code splitting
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const SessionsPage = lazy(() => import('./pages/admin/SessionsPage'));
const SurveillantsPage = lazy(() => import('./pages/admin/SurveillantsPage'));
const CreneauxPage = lazy(() => import('./pages/admin/CreneauxPage'));
const DisponibilitesPage = lazy(() => import('./pages/admin/DisponibilitesPage'));
const SoumissionsPage = lazy(() => import('./pages/admin/SoumissionsPage'));
const MessagesPage = lazy(() => import('./pages/admin/MessagesPage'));


const AppToaster = () => {
    const { isDarkMode } = useTheme();
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                style: {
                    background: isDarkMode ? '#1f2937' : '#fff',
                    color: isDarkMode ? '#e5e7eb' : '#111827',
                },
            }}
        />
    );
};

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
  </div>
);

const AppContent: React.FC = () => {
    const { togglePanel } = useDebug();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                togglePanel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePanel]);

    return (
        <ErrorBoundary>
            <AppToaster />
            <HashRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<HomePage />} />
                        </Route>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="sessions" element={<SessionsPage />} />
                            <Route path="surveillants" element={<SurveillantsPage />} />
                            <Route path="creneaux" element={<CreneauxPage />} />
                            <Route path="disponibilites" element={<DisponibilitesPage />} />
                            <Route path="soumissions" element={<SoumissionsPage />} />
                            <Route path="messages" element={<MessagesPage />} />
                        </Route>
                    </Routes>
                </Suspense>
            </HashRouter>
        </ErrorBoundary>
    );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DebugProvider>
          <AppContent />
          <DebugPanel />
        </DebugProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const HomePage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">Portail de Gestion des Surveillances</h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Bienvenue sur le portail de gestion des surveillances d'examens de l'UCLouvain.</p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <NavLink to="/admin">
                      <Button>
                          <Settings className="mr-2 h-4 w-4" />
                          Accès Administration
                      </Button>
                    </NavLink>
                </div>
            </div>
            
            <AvailabilityForm />
        </div>
    );
};


export default App;