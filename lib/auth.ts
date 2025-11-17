import bcrypt from 'bcryptjs';
import { supabase } from './supabaseClient';

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  is_active: boolean;
}

// Authentifier un utilisateur
export async function authenticateUser(username: string, password: string): Promise<AdminUser | null> {
  try {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, display_name, password_hash, is_active')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return null;
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Mettre à jour la date de dernière connexion
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      is_active: user.is_active,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Logger une action dans l'audit trail
export async function logAudit(
  userId: string,
  username: string,
  action: 'create' | 'update' | 'delete',
  tableName: string,
  recordId: string,
  oldValues?: any,
  newValues?: any
) {
  try {
    await supabase.from('audit_log').insert({
      user_id: userId,
      username,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues || null,
      new_values: newValues || null,
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

// Récupérer l'historique d'audit pour un enregistrement
export async function getAuditHistory(tableName: string, recordId: string) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit history:', error);
    return [];
  }

  return data || [];
}

// Récupérer les dernières actions d'audit
export async function getRecentAuditLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}
