
import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AvailabilityForm from './components/public/AvailabilityForm';
import { Loader2, Settings } from 'lucide-react';
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
import { queryClient } from './src/lib/queryClient';
import { env } from './src/config/env';

// Lazy load admin components for code splitting
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const SessionsPage = lazy(() => import('./pages/admin/SessionsPage'));
const SurveillantsPage = lazy(() => import('./pages/admin/SurveillantsPage'));
const CreneauxPage = lazy(() => import('./pages/admin/CreneauxPage'));
const DisponibilitesPage = lazy(() => import('./pages/admin/DisponibilitesPage'));
const SoumissionsPage = lazy(() => import('./pages/admin/SoumissionsPage'));
const SuiviSoumissionsPage = lazy(() => import('./pages/admin/SuiviSoumissionsPage'));
const MessagesPage = lazy(() => import('./pages/admin/MessagesPage'));
const StatistiquesPage = lazy(() => import('./pages/admin/StatistiquesPage'));


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
                            <Route path="suivi-soumissions" element={<SuiviSoumissionsPage />} />
                            <Route path="statistiques" element={<StatistiquesPage />} />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DebugProvider>
            <AppContent />
            <DebugPanel />
            {env.app.debug && <ReactQueryDevtools initialIsOpen={false} />}
          </DebugProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const HomePage: React.FC = () => {
    return (
        <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950/30 -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20">
                    {/* Hero Content */}
                    <div className="text-center space-y-6 mb-12">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Gérez vos disponibilités
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Encodez vos disponibilités pour les surveillances d'examens. 
                            Vous pouvez revenir à tout moment pour les consulter et les modifier.
                        </p>
                        
                        {/* Contact Info */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Besoin d'aide ?</span>
                            <a 
                                href="mailto:raphael.degand@uclouvain.be" 
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                Contactez-nous
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
                <AvailabilityForm />
            </div>

            {/* Admin Button - Bottom Footer */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="flex justify-center">
                    <NavLink to="/admin">
                        <button className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex items-center gap-1.5 py-2 px-3">
                            <Settings className="h-3 w-3" />
                            <span>Administration</span>
                        </button>
                    </NavLink>
                </div>
            </div>
        </div>
    );
};


export default App;