import { supabase } from './supabaseClient';
import * as auditLogger from './auditLogger';

export interface DataVersion {
  id: string;
  table_name: string;
  record_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  old_values: any;
  new_values: any;
  changed_fields: string[];
  username: string;
  reason: string;
  created_at: string;
}

export interface VersionSnapshot {
  id: string;
  table_name: string;
  record_id: string;
  snapshot_data: any;
  version_number: number;
  created_at: string;
  created_by: string;
}

export interface VersionSummary {
  table_name: string;
  total_versions: number;
  unique_records: number;
  last_change: string;
  inserts: number;
  updates: number;
  deletes: number;
  restores: number;
}

export interface VersionComparison {
  field_name: string;
  value_1: string;
  value_2: string;
  is_different: boolean;
}

export interface RecentChange {
  table_name: string;
  record_id: string;
  operation_type: string;
  username: string;
  reason: string;
  created_at: string;
  fields_changed: number;
}

/**
 * Récupère l'historique des versions pour un enregistrement ou une table
 */
export async function getVersionHistory(
  tableName: string,
  recordId?: string,
  limit: number = 50
): Promise<DataVersion[]> {
  try {
    const { data, error } = await supabase.rpc('get_version_history', {
      p_table_name: tableName,
      p_record_id: recordId || null,
      p_limit: limit
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching version history:', error);
    throw error;
  }
}

/**
 * Récupère le résumé des versions par table
 */
export async function getVersionSummary(): Promise<VersionSummary[]> {
  try {
    const { data, error } = await supabase
      .from('version_summary')
      .select('*')
      .order('total_versions', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching version summary:', error);
    throw error;
  }
}

/**
 * Récupère les changements récents avec détails enrichis
 */
export async function getDetailedRecentChanges(days: number = 7): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('recent_changes_detailed')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching detailed recent changes:', error);
    throw error;
  }
}

/**
 * Récupère l'historique détaillé d'un enregistrement
 */
export async function getDetailedVersionHistory(
  tableName: string,
  recordId?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_detailed_version_history', {
      p_table_name: tableName,
      p_record_id: recordId || null,
      p_limit: limit
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching detailed version history:', error);
    throw error;
  }
}

/**
 * Analyse les patterns de modification
 */
export async function analyzeModificationPatterns(
  tableName?: string,
  days: number = 30
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('analyze_modification_patterns', {
      p_table_name: tableName || null,
      p_days: days
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error analyzing modification patterns:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques détaillées par table
 */
export async function getDetailedVersionStatistics(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('version_statistics_detailed')
      .select('*')
      .order('total_versions', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching detailed version statistics:', error);
    throw error;
  }
}

/**
 * Restaure un enregistrement à une version antérieure
 */
export async function restoreVersion(
  tableName: string,
  recordId: string,
  versionId: string,
  reason: string = 'Restauration manuelle'
): Promise<boolean> {
  try {
    // Log de l'action de restauration
    await auditLogger.logAction(
      'RESTORE_VERSION',
      tableName,
      recordId,
      null,
      { version_id: versionId, reason }
    );

    const { data, error } = await supabase.rpc('restore_version', {
      p_table_name: tableName,
      p_record_id: recordId,
      p_version_id: versionId,
      p_user_id: null, // Sera récupéré automatiquement par le trigger
      p_username: null, // Sera récupéré automatiquement par le trigger
      p_reason: reason
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
}

/**
 * Compare deux versions
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<VersionComparison[]> {
  try {
    const { data, error } = await supabase.rpc('compare_versions', {
      p_version_id_1: versionId1,
      p_version_id_2: versionId2
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error comparing versions:', error);
    throw error;
  }
}

/**
 * Enregistre manuellement une version (pour les cas spéciaux)
 */
export async function recordManualVersion(
  tableName: string,
  recordId: string,
  operationType: 'INSERT' | 'UPDATE' | 'DELETE',
  oldValues: any = null,
  newValues: any = null,
  reason: string = 'Modification manuelle'
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('record_version', {
      p_table_name: tableName,
      p_record_id: recordId,
      p_operation_type: operationType,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_user_id: null, // Sera récupéré automatiquement
      p_username: null, // Sera récupéré automatiquement
      p_reason: reason
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording manual version:', error);
    throw error;
  }
}

/**
 * Récupère les snapshots d'un enregistrement
 */
export async function getSnapshots(
  tableName: string,
  recordId: string
): Promise<VersionSnapshot[]> {
  try {
    const { data, error } = await supabase
      .from('version_snapshots')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    throw error;
  }
}

/**
 * Récupère la configuration de versioning
 */
export async function getVersioningMetadata() {
  try {
    const { data, error } = await supabase
      .from('versioning_metadata')
      .select('*')
      .eq('is_enabled', true)
      .order('table_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching versioning metadata:', error);
    throw error;
  }
}

/**
 * Met à jour la configuration de versioning pour une table
 */
export async function updateVersioningConfig(
  tableName: string,
  config: {
    is_enabled?: boolean;
    retention_days?: number;
    max_versions_per_record?: number;
    track_fields?: string[];
    exclude_fields?: string[];
  }
) {
  try {
    const { data, error } = await supabase
      .from('versioning_metadata')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('table_name', tableName)
      .select()
      .single();

    if (error) throw error;

    // Log de la modification de configuration
    await auditLogger.logAction(
      'UPDATE_VERSIONING_CONFIG',
      'versioning_metadata',
      tableName,
      null,
      config
    );

    return data;
  } catch (error) {
    console.error('Error updating versioning config:', error);
    throw error;
  }
}

/**
 * Génère un changelog pour une période donnée
 */
export async function generateChangelog(
  startDate: string,
  endDate: string,
  tableName?: string
): Promise<DataVersion[]> {
  try {
    let query = supabase
      .from('data_versions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error generating changelog:', error);
    throw error;
  }
}

/**
 * Nettoie les anciennes versions selon la politique de rétention
 */
export async function cleanupOldVersions(tableName?: string): Promise<number> {
  try {
    let query = supabase
      .from('data_versions')
      .delete();

    if (tableName) {
      // Nettoyer une table spécifique
      const metadata = await supabase
        .from('versioning_metadata')
        .select('retention_days')
        .eq('table_name', tableName)
        .single();

      if (metadata.data) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - metadata.data.retention_days);
        
        query = query
          .eq('table_name', tableName)
          .lt('created_at', cutoffDate.toISOString());
      }
    } else {
      // Nettoyer toutes les tables selon leur politique
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 365); // Par défaut 1 an
      
      query = query.lt('created_at', cutoffDate.toISOString());
    }

    const { count, error } = await query;

    if (error) throw error;

    // Log du nettoyage
    await auditLogger.logAction(
      'CLEANUP_VERSIONS',
      tableName || 'all_tables',
      'system',
      null,
      { deleted_count: count }
    );

    return count || 0;
  } catch (error) {
    console.error('Error cleaning up old versions:', error);
    throw error;
  }
}

/**
 * Exporte l'historique des versions au format JSON
 */
export async function exportVersionHistory(
  tableName: string,
  recordId?: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  try {
    const versions = await getVersionHistory(tableName, recordId, 1000);
    
    if (format === 'json') {
      return JSON.stringify(versions, null, 2);
    } else {
      // Format CSV
      const headers = ['Date', 'Opération', 'Utilisateur', 'Champs modifiés', 'Raison'];
      const rows = versions.map(v => [
        v.created_at,
        v.operation_type,
        v.username || 'Système',
        v.changed_fields?.join(', ') || '',
        v.reason || ''
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    }
  } catch (error) {
    console.error('Error exporting version history:', error);
    throw error;
  }
}

/**
 * Utilitaires pour formater les données de version
 */
export const formatUtils = {
  /**
   * Formate une valeur pour l'affichage
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  },

  /**
   * Formate la date de création
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  /**
   * Formate le type d'opération
   */
  formatOperationType(type: string): string {
    const types = {
      'INSERT': 'Création',
      'UPDATE': 'Modification',
      'DELETE': 'Suppression',
      'RESTORE': 'Restauration'
    };
    return types[type as keyof typeof types] || type;
  },

  /**
   * Génère un résumé des changements
   */
  generateChangeSummary(version: DataVersion): string {
    if (!version.changed_fields || version.changed_fields.length === 0) {
      return `${this.formatOperationType(version.operation_type)} de l'enregistrement`;
    }
    
    const fieldCount = version.changed_fields.length;
    const fields = version.changed_fields.slice(0, 3).join(', ');
    const more = fieldCount > 3 ? ` et ${fieldCount - 3} autre(s)` : '';
    
    return `Modification de ${fields}${more}`;
  }
};