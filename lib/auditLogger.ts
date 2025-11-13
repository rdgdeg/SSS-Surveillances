/**
 * Audit Logger
 * 
 * Enregistre toutes les opérations critiques dans la table audit_logs
 * pour traçabilité et conformité.
 */

import { supabase } from './supabaseClient';
import { AuditLog, AuditFilters } from '../types';

interface AuditEntry {
  operation: 'create' | 'update' | 'delete' | 'view';
  entity: 'submission' | 'surveillant' | 'creneau' | 'session';
  entity_id: string;
  user_email: string;
  user_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Enregistre une opération dans les logs d'audit
 * Utilise un fallback silencieux pour ne jamais bloquer l'opération principale
 */
export async function log(entry: AuditEntry): Promise<boolean> {
  try {
    // Capturer automatiquement le user agent si disponible
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

    const auditData = {
      timestamp: new Date().toISOString(),
      operation: entry.operation,
      entity: entry.entity,
      entity_id: entry.entity_id,
      user_email: entry.user_email.toLowerCase().trim(),
      user_id: entry.user_id || null,
      details: entry.details || {},
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || userAgent || null,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditData);

    if (error) {
      console.error('Erreur lors de l\'enregistrement du log d\'audit:', error);
      return false;
    }

    console.debug('Log d\'audit enregistré:', entry.operation, entry.entity, entry.entity_id);
    return true;
  } catch (error) {
    // Fallback silencieux - ne jamais bloquer l'opération principale
    console.error('Erreur inattendue lors de l\'audit logging:', error);
    return false;
  }
}

/**
 * Récupère l'historique des logs d'audit avec filtres
 */
export async function getHistory(filters: AuditFilters = {}): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    // Appliquer les filtres
    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }
    if (filters.operation) {
      query = query.eq('operation', filters.operation);
    }
    if (filters.entity) {
      query = query.eq('entity', filters.entity);
    }
    if (filters.userEmail) {
      query = query.eq('user_email', filters.userEmail.toLowerCase().trim());
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique d\'audit:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération de l\'historique:', error);
    return [];
  }
}

/**
 * Récupère les logs d'audit pour une entité spécifique
 */
export async function getEntityHistory(
  entity: 'submission' | 'surveillant' | 'creneau' | 'session',
  entityId: string
): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', entity)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique de l\'entité:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return [];
  }
}

/**
 * Compte le nombre d'opérations par type pour des statistiques
 */
export async function getOperationStats(
  startDate?: string,
  endDate?: string
): Promise<Record<string, number>> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('operation');

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {};
    }

    // Compter les opérations
    const stats: Record<string, number> = {};
    data?.forEach(log => {
      stats[log.operation] = (stats[log.operation] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {};
  }
}
