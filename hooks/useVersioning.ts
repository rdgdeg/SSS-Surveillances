import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DataVersion,
  getVersionHistory,
  restoreVersion,
  compareVersions,
  VersionComparison
} from '../lib/versioningService';
import { useVersioning as useVersioningAPI } from '../lib/versioningApi';
import toast from 'react-hot-toast';

interface UseVersioningOptions {
  tableName: string;
  recordId?: string;
  autoLoad?: boolean;
  onRestore?: () => void;
}

interface UseVersioningReturn {
  versions: DataVersion[];
  loading: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  restore: (versionId: string, reason?: string) => Promise<boolean>;
  compare: (versionId1: string, versionId2: string) => Promise<VersionComparison[]>;
  insert: (data: any, reason?: string) => Promise<any>;
  update: (id: string, data: any, reason?: string) => Promise<any>;
  delete: (id: string, reason?: string, soft?: boolean) => Promise<any>;
  upsert: (data: any, reason?: string) => Promise<any>;
}

/**
 * Hook personnalisé pour gérer le versioning d'une table/enregistrement
 */
export function useVersioning({
  tableName,
  recordId,
  autoLoad = true,
  onRestore
}: UseVersioningOptions): UseVersioningReturn {
  const { user } = useAuth();
  const versioningAPI = useVersioningAPI(tableName);
  
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!tableName) return;

    try {
      setLoading(true);
      setError(null);
      const history = await getVersionHistory(tableName, recordId, 100);
      setVersions(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique';
      setError(errorMessage);
      console.error('Error loading version history:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName, recordId]);

  const restore = useCallback(async (versionId: string, reason?: string): Promise<boolean> => {
    if (!recordId || !user) {
      toast.error('Informations manquantes pour la restauration');
      return false;
    }

    try {
      const success = await restoreVersion(
        tableName, 
        recordId, 
        versionId, 
        reason || 'Restauration manuelle'
      );
      
      if (success) {
        toast.success('Version restaurée avec succès');
        await loadHistory(); // Recharger l'historique
        onRestore?.();
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la restauration';
      toast.error(errorMessage);
      console.error('Error restoring version:', err);
      return false;
    }
  }, [tableName, recordId, user, loadHistory, onRestore]);

  const compare = useCallback(async (versionId1: string, versionId2: string): Promise<VersionComparison[]> => {
    try {
      return await compareVersions(versionId1, versionId2);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la comparaison';
      toast.error(errorMessage);
      console.error('Error comparing versions:', err);
      return [];
    }
  }, []);

  // Wrapper pour les opérations CRUD avec versioning
  const insert = useCallback(async (data: any, reason?: string) => {
    try {
      const result = await versioningAPI.insert(data, {
        username: user?.username,
        userId: user?.id,
        reason
      });
      
      if (autoLoad) {
        await loadHistory();
      }
      
      return result;
    } catch (err) {
      console.error('Error inserting with versioning:', err);
      throw err;
    }
  }, [versioningAPI, user, autoLoad, loadHistory]);

  const update = useCallback(async (id: string, data: any, reason?: string) => {
    try {
      const result = await versioningAPI.update(id, data, {
        username: user?.username,
        userId: user?.id,
        reason
      });
      
      if (autoLoad) {
        await loadHistory();
      }
      
      return result;
    } catch (err) {
      console.error('Error updating with versioning:', err);
      throw err;
    }
  }, [versioningAPI, user, autoLoad, loadHistory]);

  const deleteRecord = useCallback(async (id: string, reason?: string, soft: boolean = true) => {
    try {
      const result = await versioningAPI.delete(id, {
        username: user?.username,
        userId: user?.id,
        reason,
        soft
      });
      
      if (autoLoad) {
        await loadHistory();
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting with versioning:', err);
      throw err;
    }
  }, [versioningAPI, user, autoLoad, loadHistory]);

  const upsert = useCallback(async (data: any, reason?: string) => {
    try {
      const result = await versioningAPI.upsert(data, {
        username: user?.username,
        userId: user?.id,
        reason
      });
      
      if (autoLoad) {
        await loadHistory();
      }
      
      return result;
    } catch (err) {
      console.error('Error upserting with versioning:', err);
      throw err;
    }
  }, [versioningAPI, user, autoLoad, loadHistory]);

  // Charger l'historique au montage si autoLoad est activé
  useEffect(() => {
    if (autoLoad) {
      loadHistory();
    }
  }, [autoLoad, loadHistory]);

  return {
    versions,
    loading,
    error,
    loadHistory,
    restore,
    compare,
    insert,
    update,
    delete: deleteRecord,
    upsert
  };
}

/**
 * Hook simplifié pour afficher l'historique d'un enregistrement
 */
export function useVersionHistory(tableName: string, recordId: string) {
  return useVersioning({
    tableName,
    recordId,
    autoLoad: true
  });
}

/**
 * Hook pour les opérations CRUD avec versioning automatique
 */
export function useVersionedCRUD(tableName: string) {
  return useVersioning({
    tableName,
    autoLoad: false
  });
}

/**
 * Hook pour surveiller les changements récents sur une table
 */
export function useRecentChanges(tableName: string, pollInterval: number = 30000) {
  const [recentChanges, setRecentChanges] = useState<DataVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentChanges = useCallback(async () => {
    try {
      setLoading(true);
      const changes = await getVersionHistory(tableName, undefined, 20);
      setRecentChanges(changes);
    } catch (err) {
      console.error('Error loading recent changes:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    loadRecentChanges();
    
    if (pollInterval > 0) {
      const interval = setInterval(loadRecentChanges, pollInterval);
      return () => clearInterval(interval);
    }
  }, [loadRecentChanges, pollInterval]);

  return {
    recentChanges,
    loading,
    refresh: loadRecentChanges
  };
}

/**
 * Hook pour gérer la configuration du versioning
 */
export function useVersioningConfig() {
  const [config, setConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      // Charger la configuration depuis l'API
      // const configData = await getVersioningMetadata();
      // setConfig(configData);
    } catch (err) {
      console.error('Error loading versioning config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (tableName: string, newConfig: any) => {
    try {
      // Mettre à jour la configuration
      // await updateVersioningConfig(tableName, newConfig);
      await loadConfig(); // Recharger
      toast.success('Configuration mise à jour');
    } catch (err) {
      console.error('Error updating config:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [loadConfig]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    updateConfig,
    refresh: loadConfig
  };
}