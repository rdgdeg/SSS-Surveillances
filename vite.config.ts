import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks - bibliothèques principales
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
              'vendor-ui': ['lucide-react', 'react-hot-toast'],
              'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-utils': ['xlsx', 'zustand'],
              
              // Admin bundle séparé
              'admin': [
                './pages/admin/DashboardPage',
                './pages/admin/SessionsPage',
                './pages/admin/SurveillantsPage',
                './pages/admin/CreneauxPage',
                './pages/admin/DisponibilitesPage',
                './pages/admin/SoumissionsPage',
                './pages/admin/SuiviSoumissionsPage',
                './pages/admin/MessagesPage',
                './pages/admin/StatistiquesPage',
                './pages/admin/CoursPage',
                './pages/admin/PresencesEnseignantsPage',
                './pages/admin/ExamensPage',
                './pages/admin/RapportsPage',
                './pages/admin/AnalyseExamensPage',
              ]
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: mode === 'development',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        }
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@tanstack/react-query'
        ]
      }
    };
});
