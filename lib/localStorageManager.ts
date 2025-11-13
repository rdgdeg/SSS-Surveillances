/**
 * LocalStorage Manager
 * 
 * Gère la sauvegarde temporaire des données du formulaire dans le LocalStorage
 * pour éviter la perte de données en cas de fermeture accidentelle du navigateur.
 * 
 * Note: Le LocalStorage est uniquement une sauvegarde temporaire. La source de vérité
 * unique reste Supabase.
 */

import { FormProgressData } from '../types';

const STORAGE_KEY = 'availabilityFormProgress';
const DEBOUNCE_DELAY = 500; // 500ms comme spécifié dans les requirements

// Timer pour le debounce
let saveTimer: NodeJS.Timeout | null = null;

/**
 * Vérifie si le LocalStorage est disponible
 */
export function isAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Sauvegarde automatiquement les données du formulaire avec debounce
 * 
 * @param data - Données du formulaire à sauvegarder
 * @returns Promise qui se résout quand la sauvegarde est terminée
 */
export function saveFormProgress(data: FormProgressData): Promise<void> {
  return new Promise((resolve, reject) => {
    // Annuler le timer précédent si existant
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    // Créer un nouveau timer avec debounce
    saveTimer = setTimeout(() => {
      try {
        // Vérifier la disponibilité du LocalStorage
        if (!isAvailable()) {
          console.warn('LocalStorage non disponible. Sauvegarde ignorée.');
          resolve();
          return;
        }

        // Ajouter le timestamp de sauvegarde
        const dataWithTimestamp: FormProgressData = {
          ...data,
          lastSaved: new Date().toISOString()
        };

        // Sauvegarder dans le LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
        
        console.debug('Formulaire sauvegardé dans LocalStorage', {
          timestamp: dataWithTimestamp.lastSaved,
          email: data.email,
          sessionId: data.sessionId
        });

        resolve();
      } catch (error) {
        // Gérer les erreurs de quota dépassé
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('LocalStorage quota dépassé. Impossible de sauvegarder.');
          reject(new Error('QUOTA_EXCEEDED'));
        } else {
          console.error('Erreur lors de la sauvegarde dans LocalStorage:', error);
          reject(error);
        }
      }
    }, DEBOUNCE_DELAY);
  });
}

/**
 * Restaure les données du formulaire depuis le LocalStorage
 * 
 * @returns Les données sauvegardées ou null si aucune donnée n'existe
 */
export function loadFormProgress(): FormProgressData | null {
  try {
    // Vérifier la disponibilité du LocalStorage
    if (!isAvailable()) {
      console.warn('LocalStorage non disponible. Impossible de restaurer les données.');
      return null;
    }

    // Récupérer les données
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (!savedData) {
      return null;
    }

    // Parser les données JSON
    const data: FormProgressData = JSON.parse(savedData);
    
    // Valider que les données ont la structure attendue
    if (!data.email || !data.sessionId) {
      console.warn('Données LocalStorage invalides. Suppression.');
      clearFormProgress();
      return null;
    }

    // Vérifier que les données ne sont pas trop anciennes (> 7 jours)
    const lastSaved = new Date(data.lastSaved);
    const now = new Date();
    const daysDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      console.warn('Données LocalStorage trop anciennes (> 7 jours). Suppression.');
      clearFormProgress();
      return null;
    }

    console.debug('Données restaurées depuis LocalStorage', {
      lastSaved: data.lastSaved,
      email: data.email,
      sessionId: data.sessionId,
      daysSinceLastSave: daysDiff.toFixed(2)
    });

    return data;
  } catch (error) {
    console.error('Erreur lors de la restauration depuis LocalStorage:', error);
    // En cas d'erreur de parsing, nettoyer les données corrompues
    clearFormProgress();
    return null;
  }
}

/**
 * Supprime les données du formulaire du LocalStorage
 * À appeler après une soumission réussie
 */
export function clearFormProgress(): void {
  try {
    if (!isAvailable()) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    
    // Annuler tout timer de sauvegarde en attente
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    console.debug('Données LocalStorage nettoyées');
  } catch (error) {
    console.error('Erreur lors du nettoyage du LocalStorage:', error);
  }
}

/**
 * Obtient la taille approximative des données sauvegardées en octets
 * Utile pour le monitoring et le debugging
 */
export function getStorageSize(): number {
  try {
    if (!isAvailable()) {
      return 0;
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return 0;
    }

    // Calculer la taille en octets (approximatif)
    return new Blob([savedData]).size;
  } catch (error) {
    console.error('Erreur lors du calcul de la taille du storage:', error);
    return 0;
  }
}

/**
 * Vérifie si des données de formulaire sont sauvegardées
 */
export function hasStoredData(): boolean {
  try {
    if (!isAvailable()) {
      return false;
    }

    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Obtient des informations sur les données sauvegardées
 * Utile pour afficher un message à l'utilisateur
 */
export function getStorageInfo(): {
  hasData: boolean;
  lastSaved?: string;
  email?: string;
  sizeBytes?: number;
} | null {
  try {
    if (!hasStoredData()) {
      return { hasData: false };
    }

    const data = loadFormProgress();
    if (!data) {
      return { hasData: false };
    }

    return {
      hasData: true,
      lastSaved: data.lastSaved,
      email: data.email,
      sizeBytes: getStorageSize()
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des infos storage:', error);
    return null;
  }
}

// Export d'un objet avec toutes les fonctions pour faciliter l'import
export const localStorageManager = {
  isAvailable,
  saveFormProgress,
  loadFormProgress,
  clearFormProgress,
  getStorageSize,
  hasStoredData,
  getStorageInfo
};

export default localStorageManager;
