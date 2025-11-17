/**
 * Route Preloader
 * 
 * Permet de précharger les routes avant la navigation pour améliorer les performances
 */

type RouteLoader = () => Promise<any>;

const routeLoaders: Record<string, RouteLoader> = {
  // Admin routes
  '/admin/dashboard': () => import('../pages/admin/DashboardPage'),
  '/admin/sessions': () => import('../pages/admin/SessionsPage'),
  '/admin/surveillants': () => import('../pages/admin/SurveillantsPage'),
  '/admin/creneaux': () => import('../pages/admin/CreneauxPage'),
  '/admin/disponibilites': () => import('../pages/admin/DisponibilitesPage'),
  '/admin/soumissions': () => import('../pages/admin/SoumissionsPage'),
  '/admin/suivi-soumissions': () => import('../pages/admin/SuiviSoumissionsPage'),
  '/admin/statistiques': () => import('../pages/admin/StatistiquesPage'),
  '/admin/messages': () => import('../pages/admin/MessagesPage'),
  '/admin/cours': () => import('../pages/admin/CoursPage'),
  '/admin/presences-enseignants': () => import('../pages/admin/PresencesEnseignantsPage'),
  '/admin/examens': () => import('../pages/admin/ExamensPage'),
  '/admin/rapports': () => import('../pages/admin/RapportsPage'),
  '/admin/analyse-examens': () => import('../pages/admin/AnalyseExamensPage'),
  
  // Public routes
  '/consignes': () => import('../pages/ConsignesPage'),
  '/enseignant/presence': () => import('../pages/public/TeacherPresencePage'),
};

/**
 * Précharge une route spécifique
 * @param path Chemin de la route à précharger
 * @returns Promise qui se résout quand la route est chargée
 */
export function preloadRoute(path: string): Promise<any> | undefined {
  const loader = routeLoaders[path];
  if (!loader) {
    console.warn(`No preloader found for route: ${path}`);
    return undefined;
  }
  
  return loader().catch(error => {
    console.error(`Failed to preload route ${path}:`, error);
  });
}

/**
 * Précharge plusieurs routes en parallèle
 * @param paths Liste des chemins à précharger
 */
export function preloadRoutes(paths: string[]): Promise<any[]> {
  const promises = paths
    .map(path => preloadRoute(path))
    .filter((p): p is Promise<any> => p !== undefined);
  
  return Promise.all(promises);
}

/**
 * Précharge les routes critiques (dashboard admin)
 */
export function preloadCriticalRoutes(): Promise<any[]> {
  return preloadRoutes([
    '/admin/dashboard',
    '/admin/surveillants',
    '/admin/creneaux'
  ]);
}
