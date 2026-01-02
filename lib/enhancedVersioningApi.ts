import { supabase } from './supabaseClient';

export interface VersionEvent {
  id: string;
  table_name: string;
  record_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  change_summary: string;
  detailed_changes: string;
  username: string;
  reason: string;
  created_at: string;
  fields_changed_count: number;
  record_identifier: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
}

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  operationType?: string;
  tableName?: string;
  username?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface FilterOptionsData {
  tables: string[];
  users: string[];
  operationTypes: string[];
}

/**
 * Récupère tous les événements de versioning avec filtres avancés
 */
export async function getVersionEvents(filters: FilterOptions = {}): Promise<VersionEvent[]> {
  try {
    let query = supabase
      .from('recent_changes_detailed')
      .select('*');

    // Appliquer les filtres
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      // Ajouter 23:59:59 à la date de fin pour inclure toute la journée
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    if (filters.operationType) {
      query = query.eq('operation_type', filters.operationType);
    }

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    if (filters.username) {
      query = query.eq('username', filters.username);
    }

    if (filters.searchTerm) {
      query = query.or(`record_id.ilike.%${filters.searchTerm}%,reason.ilike.%${filters.searchTerm}%,record_identifier.ilike.%${filters.searchTerm}%,detailed_changes.ilike.%${filters.searchTerm}%`);
    }

    // Pagination
    if (filters.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    } else if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(1000); // Limite par défaut
    }

    // Tri par date décroissante
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching version events:', error);
    throw error;
  }
}

/**
 * Récupère les options disponibles pour les filtres
 */
export async function getFilterOptions(): Promise<FilterOptionsData> {
  try {
    // Récupérer les tables disponibles
    const { data: tablesData, error: tablesError } = await supabase
      .from('versioning_metadata')
      .select('table_name')
      .eq('is_enabled', true)
      .order('table_name');

    if (tablesError) throw tablesError;

    // Récupérer les utilisateurs qui ont fait des modifications
    const { data: usersData, error: usersError } = await supabase
      .from('data_versions')
      .select('username')
      .not('username', 'is', null)
      .order('username');

    if (usersError) throw usersError;

    // Extraire les valeurs uniques
    const tables = [...new Set(tablesData?.map(t => t.table_name) || [])];
    const users = [...new Set(usersData?.map(u => u.username).filter(Boolean) || [])];
    const operationTypes = ['INSERT', 'UPDATE', 'DELETE', 'RESTORE'];

    return {
      tables,
      users,
      operationTypes
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
}

/**
 * Supprime des événements spécifiques par leurs IDs
 */
export async function deleteVersionEvents(eventIds: string[]): Promise<number> {
  try {
    const { error, count } = await supabase
      .from('data_versions')
      .delete()
      .in('id', eventIds);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error deleting version events:', error);
    throw error;
  }
}

/**
 * Supprime des événements par plage de dates et filtres
 */
export async function bulkDeleteVersionEvents(options: {
  dateFrom: string;
  dateTo: string;
  tableName?: string;
  operationType?: string;
  username?: string;
}): Promise<number> {
  try {
    let query = supabase
      .from('data_versions')
      .delete();

    // Appliquer les filtres de date
    query = query.gte('created_at', options.dateFrom);
    
    const endDate = new Date(options.dateTo);
    endDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endDate.toISOString());

    // Filtres optionnels
    if (options.tableName) {
      query = query.eq('table_name', options.tableName);
    }

    if (options.operationType) {
      query = query.eq('operation_type', options.operationType);
    }

    if (options.username) {
      query = query.eq('username', options.username);
    }

    const { error, count } = await query;

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error bulk deleting version events:', error);
    throw error;
  }
}

/**
 * Exporte les événements de versioning
 */
export async function exportVersionEvents(
  filters: FilterOptions = {},
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  try {
    const events = await getVersionEvents({ ...filters, limit: 10000 }); // Limite élevée pour l'export

    if (format === 'csv') {
      return exportToCSV(events);
    } else {
      return JSON.stringify(events, null, 2);
    }
  } catch (error) {
    console.error('Error exporting version events:', error);
    throw error;
  }
}

/**
 * Convertit les événements en format CSV
 */
function exportToCSV(events: VersionEvent[]): string {
  if (events.length === 0) {
    return 'Aucun événement à exporter';
  }

  const headers = [
    'ID',
    'Table',
    'Record ID',
    'Type Opération',
    'Résumé',
    'Utilisateur',
    'Raison',
    'Date/Heure',
    'Champs Modifiés',
    'Identifiant Record',
    'Modifications Détaillées'
  ];

  const csvRows = [
    headers.join(','),
    ...events.map(event => [
      `"${event.id}"`,
      `"${event.table_name}"`,
      `"${event.record_id}"`,
      `"${event.operation_type}"`,
      `"${event.change_summary?.replace(/"/g, '""') || ''}"`,
      `"${event.username || ''}"`,
      `"${event.reason?.replace(/"/g, '""') || ''}"`,
      `"${new Date(event.created_at).toLocaleString('fr-FR')}"`,
      `"${event.fields_changed_count || 0}"`,
      `"${event.record_identifier || ''}"`,
      `"${event.detailed_changes?.replace(/"/g, '""') || ''}"`
    ].join(','))
  ];

  return csvRows.join('\n');
}

/**
 * Obtient des statistiques détaillées sur les événements
 */
export async function getVersioningStatistics(days: number = 30): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByTable: Record<string, number>;
  eventsByUser: Record<string, number>;
  dailyActivity: Array<{ date: string; count: number }>;
  topModifiedFields: Array<{ field: string; count: number }>;
}> {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Statistiques générales
    const { data: totalData, error: totalError } = await supabase
      .from('data_versions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFrom.toISOString());

    if (totalError) throw totalError;

    // Événements par type
    const { data: typeData, error: typeError } = await supabase
      .from('data_versions')
      .select('operation_type')
      .gte('created_at', dateFrom.toISOString());

    if (typeError) throw typeError;

    // Événements par table
    const { data: tableData, error: tableError } = await supabase
      .from('data_versions')
      .select('table_name')
      .gte('created_at', dateFrom.toISOString());

    if (tableError) throw tableError;

    // Événements par utilisateur
    const { data: userData, error: userError } = await supabase
      .from('data_versions')
      .select('username')
      .gte('created_at', dateFrom.toISOString())
      .not('username', 'is', null);

    if (userError) throw userError;

    // Activité quotidienne
    const { data: dailyData, error: dailyError } = await supabase
      .rpc('get_daily_version_activity', { days_back: days });

    if (dailyError) throw dailyError;

    // Champs les plus modifiés
    const { data: fieldsData, error: fieldsError } = await supabase
      .rpc('get_most_modified_fields', { days_back: days });

    if (fieldsError) throw fieldsError;

    // Traitement des données
    const eventsByType = typeData?.reduce((acc, item) => {
      acc[item.operation_type] = (acc[item.operation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const eventsByTable = tableData?.reduce((acc, item) => {
      acc[item.table_name] = (acc[item.table_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const eventsByUser = userData?.reduce((acc, item) => {
      acc[item.username] = (acc[item.username] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalEvents: totalData?.length || 0,
      eventsByType,
      eventsByTable,
      eventsByUser,
      dailyActivity: dailyData || [],
      topModifiedFields: fieldsData || []
    };
  } catch (error) {
    console.error('Error fetching versioning statistics:', error);
    throw error;
  }
}

/**
 * Nettoie les anciens événements selon les politiques de rétention
 */
export async function cleanupOldVersions(tableName?: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_old_versions', { p_table_name: tableName });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error('Error cleaning up old versions:', error);
    throw error;
  }
}

/**
 * Recherche avancée dans les événements de versioning
 */
export async function searchVersionEvents(
  searchTerm: string,
  options: {
    searchInValues?: boolean;
    searchInReasons?: boolean;
    searchInUsernames?: boolean;
    tableName?: string;
    limit?: number;
  } = {}
): Promise<VersionEvent[]> {
  try {
    let query = supabase
      .from('recent_changes_detailed')
      .select('*');

    // Construire la requête de recherche
    const searchConditions = [];

    if (options.searchInReasons !== false) {
      searchConditions.push(`reason.ilike.%${searchTerm}%`);
    }

    if (options.searchInUsernames !== false) {
      searchConditions.push(`username.ilike.%${searchTerm}%`);
    }

    searchConditions.push(`record_id.ilike.%${searchTerm}%`);
    searchConditions.push(`record_identifier.ilike.%${searchTerm}%`);
    searchConditions.push(`detailed_changes.ilike.%${searchTerm}%`);

    if (options.searchInValues) {
      searchConditions.push(`old_values::text.ilike.%${searchTerm}%`);
      searchConditions.push(`new_values::text.ilike.%${searchTerm}%`);
    }

    query = query.or(searchConditions.join(','));

    if (options.tableName) {
      query = query.eq('table_name', options.tableName);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options.limit || 100);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching version events:', error);
    throw error;
  }
}