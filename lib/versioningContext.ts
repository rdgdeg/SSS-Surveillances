import { supabase } from './supabaseClient';

/**
 * Contexte de versioning pour capturer automatiquement l'utilisateur
 */
export class VersioningContext {
  private static currentUser: { id: string; username: string } | null = null;

  /**
   * Configure l'utilisateur actuel pour le versioning
   */
  static async setCurrentUser(userId: string, username: string) {
    this.currentUser = { id: userId, username };
    
    try {
      // Configurer les variables de session Supabase
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: userId,
        is_local: true
      });
      
      await supabase.rpc('set_config', {
        setting_name: 'app.current_username', 
        setting_value: username,
        is_local: true
      });
    } catch (error) {
      console.warn('Impossible de configurer les variables de session:', error);
    }
  }

  /**
   * Récupère l'utilisateur actuel
   */
  static getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Nettoie le contexte utilisateur
   */
  static clearCurrentUser() {
    this.currentUser = null;
  }

  /**
   * Exécute une opération avec un contexte utilisateur spécifique
   */
  static async withUser<T>(
    userId: string, 
    username: string, 
    operation: () => Promise<T>
  ): Promise<T> {
    const previousUser = this.currentUser;
    
    try {
      await this.setCurrentUser(userId, username);
      return await operation();
    } finally {
      if (previousUser) {
        await this.setCurrentUser(previousUser.id, previousUser.username);
      } else {
        this.clearCurrentUser();
      }
    }
  }

  /**
   * Enregistre manuellement une version avec l'utilisateur actuel
   */
  static async recordVersion(
    tableName: string,
    recordId: string,
    operationType: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE',
    oldValues: any = null,
    newValues: any = null,
    reason?: string
  ) {
    const user = this.getCurrentUser();
    
    try {
      const { data, error } = await supabase.rpc('record_version', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_operation_type: operationType,
        p_old_values: oldValues ? JSON.stringify(oldValues) : null,
        p_new_values: newValues ? JSON.stringify(newValues) : null,
        p_user_id: user?.id || 'system',
        p_username: user?.username || 'Système',
        p_reason: reason || `${operationType.toLowerCase()} manuelle`
      });

      if (error) {
        console.error('Erreur lors de l\'enregistrement de version:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans recordVersion:', error);
      throw error;
    }
  }
}

/**
 * Hook pour initialiser automatiquement le contexte de versioning
 */
export function useVersioningContext() {
  const initializeContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Essayer de récupérer les infos admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('username, nom, prenom')
          .eq('user_id', user.id)
          .single();

        if (adminUser) {
          const displayName = adminUser.nom && adminUser.prenom 
            ? `${adminUser.prenom} ${adminUser.nom}`
            : adminUser.username;
          
          await VersioningContext.setCurrentUser(user.id, displayName);
        } else {
          // Utilisateur non-admin, utiliser l'email
          await VersioningContext.setCurrentUser(user.id, user.email || 'Utilisateur');
        }
      }
    } catch (error) {
      console.warn('Impossible d\'initialiser le contexte de versioning:', error);
    }
  };

  return { initializeContext };
}