
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
const CoursPage = lazy(() => import('./pages/admin/CoursPage'));
const PresencesEnseignantsPage = lazy(() => import('./pages/admin/PresencesEnseignantsPage'));
const ExamensPage = lazy(() => import('./pages/admin/ExamensPage'));

// Lazy load public pages
const ConsignesPage = lazy(() => import('./pages/ConsignesPage'));
const TeacherPresencePage = lazy(() => import('./pages/TeacherPresencePage'));


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
                            <Route path="disponibilites" element={<DisponibilitesFormPage />} />
                            <Route path="consignes" element={<ConsignesPage />} />
                            <Route path="enseignant/presence" element={<TeacherPresencePage />} />
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
                            <Route path="cours" element={<CoursPage />} />
                            <Route path="presences-enseignants" element={<PresencesEnseignantsPage />} />
                            <Route path="examens" element={<ExamensPage />} />
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

const DisponibilitesFormPage: React.FC = () => {
    return (
        <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950/30 -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
            {/* Form Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <AvailabilityForm />
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
    return (
        <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex items-center justify-center px-4 -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
            <div className="max-w-4xl w-full">
                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Surveillant Card */}
                    <NavLink to="/disponibilites" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-1">
                            <div className="flex flex-col items-center">
                                {/* Icon */}
                                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                    <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    Je suis Surveillant
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Déclarez vos disponibilités pour les surveillances d'examens
                                </p>

                                {/* Button */}
                                <div className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                    Accéder
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </NavLink>

                    {/* Enseignant Card */}
                    <NavLink to="/enseignant/presence" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-1">
                            <div className="flex flex-col items-center">
                                {/* Icon */}
                                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    Je suis Enseignant
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Déclarez votre présence et vos surveillants pour les examens
                                </p>

                                {/* Button */}
                                <div className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                                    Accéder
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </NavLink>
                </div>

                {/* Admin Button - Bottom */}
                <div className="mt-12 flex justify-center">
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