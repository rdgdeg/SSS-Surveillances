import { supabase } from './supabaseClient';
import * as versioningService from './versioningService';
import * as auditLogger from './auditLogger';

/**
 * Wrapper pour les opérations de base de données avec versioning automatique
 */
export class VersionedAPI {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Définit le contexte utilisateur pour le versioning
   */
  private async setUserContext(username?: string, userId?: string) {
    try {
      if (username) {
        await supabase.rpc('set_config', {
          setting_name: 'app.current_username',
          new_value: username,
          is_local: true
        });
      }
      if (userId) {
        await supabase.rpc('set_config', {
          setting_name: 'app.current_user_id',
          new_value: userId,
          is_local: true
        });
      }
    } catch (error) {
      console.warn('Could not set user context:', error);
    }
  }

  /**
   * Insert avec versioning automatique
   */
  async insert(
    data: any,
    options: {
      username?: string;
      userId?: string;
      reason?: string;
    } = {}
  ) {
    await this.setUserContext(options.username, options.userId);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Le versioning est géré automatiquement par les triggers
    return result;
  }

  /**
   * Update avec versioning automatique
   */
  async update(
    id: string,
    data: any,
    options: {
      username?: string;
      userId?: string;
      reason?: string;
    } = {}
  ) {
    await this.setUserContext(options.username, options.userId);

    // Récupérer les données actuelles pour le versioning
    const { data: currentData } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Le versioning est géré automatiquement par les triggers
    return result;
  }

  /**
   * Delete avec versioning automatique
   */
  async delete(
    id: string,
    options: {
      username?: string;
      userId?: string;
      reason?: string;
      soft?: boolean;
    } = {}
  ) {
    await this.setUserContext(options.username, options.userId);

    if (options.soft) {
      // Soft delete
      return this.update(id, { deleted_at: new Date().toISOString() }, options);
    } else {
      // Hard delete
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  }

  /**
   * Upsert avec versioning automatique
   */
  async upsert(
    data: any,
    options: {
      username?: string;
      userId?: string;
      reason?: string;
      onConflict?: string;
    } = {}
  ) {
    await this.setUserContext(options.username, options.userId);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .upsert(data, { onConflict: options.onConflict })
      .select();

    if (error) throw error;
    return result;
  }

  /**
   * Bulk update avec versioning
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: any }>,
    options: {
      username?: string;
      userId?: string;
      reason?: string;
    } = {}
  ) {
    await this.setUserContext(options.username, options.userId);

    const results = [];
    for (const update of updates) {
      const result = await this.update(update.id, update.data, options);
      results.push(result);
    }
    return results;
  }

  /**
   * Récupère l'historique des versions pour cette table
   */
  async getHistory(recordId?: string, limit?: number) {
    return versioningService.getVersionHistory(this.tableName, recordId, limit);
  }

  /**
   * Restaure une version
   */
  async restore(recordId: string, versionId: string, reason?: string) {
    return versioningService.restoreVersion(this.tableName, recordId, versionId, reason);
  }
}

/**
 * Factory pour créer des APIs versionnées
 */
export function createVersionedAPI(tableName: string): VersionedAPI {
  return new VersionedAPI(tableName);
}

/**
 * APIs versionnées pour les tables principales
 */
export const versionedAPIs = {
  sessions: createVersionedAPI('sessions'),
  creneaux: createVersionedAPI('creneaux'),
  examens: createVersionedAPI('examens'),
  presencesEnseignants: createVersionedAPI('presences_enseignants'),
  examenAuditoires: createVersionedAPI('examen_auditoires'),
  consignesSecretariat: createVersionedAPI('consignes_secretariat'),
  soumissionsDisponibilites: createVersionedAPI('soumissions_disponibilites'),
  demandesModification: createVersionedAPI('demandes_modification'),
  surveillants: createVersionedAPI('surveillants'),
  adminUsers: createVersionedAPI('admin_users')
};

/**
 * Middleware pour ajouter automatiquement le versioning aux requêtes existantes
 */
export function withVersioning<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  tableName: string,
  operationType: 'INSERT' | 'UPDATE' | 'DELETE'
): T {
  return (async (...args: any[]) => {
    try {
      // Exécuter la fonction originale
      const result = await fn(...args);
      
      // Le versioning est géré automatiquement par les triggers
      return result;
    } catch (error) {
      console.error(`Error in versioned operation for ${tableName}:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Hook pour les composants React qui utilisent le versioning
 */
export function useVersioning(tableName: string) {
  const api = createVersionedAPI(tableName);

  return {
    insert: api.insert.bind(api),
    update: api.update.bind(api),
    delete: api.delete.bind(api),
    upsert: api.upsert.bind(api),
    bulkUpdate: api.bulkUpdate.bind(api),
    getHistory: api.getHistory.bind(api),
    restore: api.restore.bind(api)
  };
}

/**
 * Utilitaires pour la gestion des erreurs de versioning
 */
export const versioningErrors = {
  isVersioningError(error: any): boolean {
    return error?.message?.includes('versioning') || 
           error?.code === 'VERSIONING_ERROR';
  },

  handleVersioningError(error: any, context: string) {
    console.error(`Versioning error in ${context}:`, error);
    
    if (error?.message?.includes('restore')) {
      throw new Error('Impossible de restaurer cette version. Vérifiez que les données sont compatibles.');
    }
    
    if (error?.message?.includes('permission')) {
      throw new Error('Vous n\'avez pas les permissions nécessaires pour cette opération de versioning.');
    }
    
    throw new Error(`Erreur de versioning: ${error?.message || 'Erreur inconnue'}`);
  }
};

/**
 * Configuration globale du versioning
 */
export const versioningConfig = {
  // Tables critiques qui nécessitent un versioning complet
  criticalTables: [
    'sessions',
    'examens',
    'presences_enseignants',
    'examen_auditoires'
  ],

  // Tables avec versioning léger (moins de rétention)
  lightTables: [
    'soumissions_disponibilites',
    'demandes_modification'
  ],

  // Champs à exclure du versioning par défaut
  defaultExcludeFields: [
    'updated_at',
    'last_modified',
    'last_accessed'
  ],

  // Rétention par défaut (en jours)
  defaultRetentionDays: 365,

  // Nombre maximum de versions par enregistrement
  defaultMaxVersions: 50
};

/**
 * Initialise le versioning pour une nouvelle table
 */
export async function initializeVersioningForTable(
  tableName: string,
  config: {
    retentionDays?: number;
    maxVersions?: number;
    trackFields?: string[];
    excludeFields?: string[];
  } = {}
) {
  try {
    // Insérer la configuration
    const { error } = await supabase
      .from('versioning_metadata')
      .upsert({
        table_name: tableName,
        is_enabled: true,
        retention_days: config.retentionDays || versioningConfig.defaultRetentionDays,
        max_versions_per_record: config.maxVersions || versioningConfig.defaultMaxVersions,
        track_fields: config.trackFields || null,
        exclude_fields: config.excludeFields || versioningConfig.defaultExcludeFields
      });

    if (error) throw error;

    // Log de l'initialisation
    await auditLogger.logAction(
      'INIT_VERSIONING',
      'versioning_metadata',
      tableName,
      null,
      config
    );

    return true;
  } catch (error) {
    console.error('Error initializing versioning for table:', error);
    throw error;
  }
}