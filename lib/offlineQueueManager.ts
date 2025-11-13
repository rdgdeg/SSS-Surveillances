/**
 * Offline Queue Manager
 * 
 * Gère la file d'attente des soumissions en attente lorsque la connexion réseau est indisponible.
 * Utilise IndexedDB pour un stockage persistant plus robuste que LocalStorage.
 * 
 * Stratégie de fallback gracieux :
 * - Si IndexedDB n'est pas disponible, le système continue de fonctionner sans file d'attente
 * - Les erreurs sont loggées mais ne bloquent jamais l'application
 */

import { PendingSubmission, ProcessResult, SubmissionPayload } from '../types';

const DB_NAME = 'SubmissionQueueDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_submissions';

let db: IDBDatabase | null = null;
let isIndexedDBAvailable = true;

/**
 * Initialise la base de données IndexedDB
 */
async function initDB(): Promise<IDBDatabase | null> {
  // Si déjà initialisé, retourner l'instance existante
  if (db) {
    return db;
  }

  // Vérifier si IndexedDB est disponible
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn('IndexedDB non disponible. File d\'attente hors-ligne désactivée.');
    isIndexedDBAvailable = false;
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Erreur lors de l\'ouverture d\'IndexedDB:', request.error);
        isIndexedDBAvailable = false;
        resolve(null);
      };

      request.onsuccess = () => {
        db = request.result;
        console.debug('IndexedDB initialisé avec succès');
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        
        // Créer l'object store s'il n'existe pas
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Créer des index pour faciliter les requêtes
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('attempts', 'attempts', { unique: false });
          
          console.debug('Object store créé:', STORE_NAME);
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation d\'IndexedDB:', error);
      isIndexedDBAvailable = false;
      resolve(null);
    }
  });
}

/**
 * Génère un UUID simple pour les IDs locaux
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Vérifie si IndexedDB est disponible
 */
export function isAvailable(): boolean {
  return isIndexedDBAvailable;
}

/**
 * Ajoute une soumission à la file d'attente
 */
export async function enqueue(submission: Omit<PendingSubmission, 'id'>): Promise<string | null> {
  try {
    const database = await initDB();
    if (!database) {
      console.warn('IndexedDB non disponible. Soumission non ajoutée à la file.');
      return null;
    }

    const id = generateUUID();
    const pendingSubmission: PendingSubmission = {
      id,
      ...submission
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pendingSubmission);

      request.onsuccess = () => {
        console.debug('Soumission ajoutée à la file d\'attente:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Erreur lors de l\'ajout à la file:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la file d\'attente:', error);
    return null;
  }
}

/**
 * Récupère toutes les soumissions en attente
 */
export async function getAll(): Promise<PendingSubmission[]> {
  try {
    const database = await initDB();
    if (!database) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const submissions = request.result as PendingSubmission[];
        console.debug(`${submissions.length} soumission(s) en attente`);
        resolve(submissions);
      };

      request.onerror = () => {
        console.error('Erreur lors de la récupération de la file:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la file:', error);
    return [];
  }
}

/**
 * Retire une soumission de la file d'attente
 */
export async function dequeue(id: string): Promise<boolean> {
  try {
    const database = await initDB();
    if (!database) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.debug('Soumission retirée de la file:', id);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Erreur lors de la suppression de la file:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la file:', error);
    return false;
  }
}

/**
 * Met à jour une soumission dans la file (pour incrémenter les tentatives)
 */
export async function update(submission: PendingSubmission): Promise<boolean> {
  try {
    const database = await initDB();
    if (!database) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(submission);

      request.onsuccess = () => {
        console.debug('Soumission mise à jour dans la file:', submission.id);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Erreur lors de la mise à jour de la file:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la file:', error);
    return false;
  }
}

/**
 * Traite toutes les soumissions en attente
 * Note: Cette fonction nécessite une fonction de soumission externe
 */
export async function processQueue(
  submitFunction: (payload: SubmissionPayload) => Promise<{ success: boolean; error?: string }>
): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  try {
    const submissions = await getAll();
    
    if (submissions.length === 0) {
      console.debug('Aucune soumission en attente à traiter');
      return result;
    }

    console.debug(`Traitement de ${submissions.length} soumission(s) en attente...`);

    // Traiter chaque soumission séquentiellement
    for (const submission of submissions) {
      result.processed++;

      try {
        // Tenter de soumettre
        const submitResult = await submitFunction(submission.data);

        if (submitResult.success) {
          // Succès : retirer de la file
          await dequeue(submission.id);
          result.succeeded++;
          console.debug(`Soumission ${submission.id} traitée avec succès`);
        } else {
          // Échec : incrémenter les tentatives
          submission.attempts++;
          submission.lastAttempt = new Date().toISOString();
          submission.error = submitResult.error;
          
          await update(submission);
          result.failed++;
          result.errors.push({
            id: submission.id,
            error: submitResult.error || 'Erreur inconnue'
          });
          
          console.warn(`Soumission ${submission.id} échouée (tentative ${submission.attempts})`);
        }
      } catch (error) {
        // Erreur inattendue
        submission.attempts++;
        submission.lastAttempt = new Date().toISOString();
        submission.error = error instanceof Error ? error.message : 'Erreur inconnue';
        
        await update(submission);
        result.failed++;
        result.errors.push({
          id: submission.id,
          error: submission.error
        });
        
        console.error(`Erreur lors du traitement de ${submission.id}:`, error);
      }
    }

    console.debug(`Traitement terminé: ${result.succeeded} succès, ${result.failed} échecs`);
    return result;
  } catch (error) {
    console.error('Erreur lors du traitement de la file:', error);
    return result;
  }
}

/**
 * Vérifie si la file contient des éléments
 */
export async function hasItems(): Promise<boolean> {
  try {
    const submissions = await getAll();
    return submissions.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification de la file:', error);
    return false;
  }
}

/**
 * Obtient le nombre d'éléments dans la file
 */
export async function getCount(): Promise<number> {
  try {
    const submissions = await getAll();
    return submissions.length;
  } catch (error) {
    console.error('Erreur lors du comptage de la file:', error);
    return 0;
  }
}

/**
 * Vide complètement la file d'attente (à utiliser avec précaution)
 */
export async function clear(): Promise<boolean> {
  try {
    const database = await initDB();
    if (!database) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.debug('File d\'attente vidée');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Erreur lors du vidage de la file:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Erreur lors du vidage de la file:', error);
    return false;
  }
}

/**
 * Obtient des statistiques sur la file d'attente
 */
export async function getStats(): Promise<{
  total: number;
  byAttempts: Record<number, number>;
  oldestTimestamp?: string;
  newestTimestamp?: string;
}> {
  try {
    const submissions = await getAll();
    
    const stats = {
      total: submissions.length,
      byAttempts: {} as Record<number, number>,
      oldestTimestamp: undefined as string | undefined,
      newestTimestamp: undefined as string | undefined
    };

    if (submissions.length === 0) {
      return stats;
    }

    // Compter par nombre de tentatives
    submissions.forEach(sub => {
      stats.byAttempts[sub.attempts] = (stats.byAttempts[sub.attempts] || 0) + 1;
    });

    // Trouver les timestamps min/max
    const timestamps = submissions.map(sub => sub.timestamp).sort();
    stats.oldestTimestamp = timestamps[0];
    stats.newestTimestamp = timestamps[timestamps.length - 1];

    return stats;
  } catch (error) {
    console.error('Erreur lors du calcul des stats:', error);
    return {
      total: 0,
      byAttempts: {}
    };
  }
}

// Export d'un objet avec toutes les fonctions
export const offlineQueueManager = {
  isAvailable,
  enqueue,
  getAll,
  dequeue,
  update,
  processQueue,
  hasItems,
  getCount,
  clear,
  getStats
};

export default offlineQueueManager;
