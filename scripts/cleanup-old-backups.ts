/**
 * Script de nettoyage des anciennes sauvegardes
 * 
 * Ce script supprime les sauvegardes de plus de 90 jours pour respecter
 * la politique de rétention.
 * 
 * Usage: npx ts-node scripts/cleanup-old-backups.ts
 * Cron: 0 3 * * 0 (tous les dimanches à 3h du matin)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RETENTION_DAYS = 90;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Nettoie les sauvegardes obsolètes
 */
async function cleanupOldBackups() {
  console.log(`🔄 Démarrage du nettoyage des sauvegardes de plus de ${RETENTION_DAYS} jours...`);

  try {
    // 1. Calculer la date limite
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    console.log(`📅 Date limite: ${cutoffDateStr}`);

    // 2. Récupérer les sauvegardes obsolètes
    const { data: oldBackups, error: fetchError } = await supabase
      .from('backup_metadata')
      .select('*')
      .lt('backup_date', cutoffDateStr)
      .eq('status', 'completed')
      .not('file_path', 'is', null);

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des sauvegardes: ${fetchError.message}`);
    }

    if (!oldBackups || oldBackups.length === 0) {
      console.log('✅ Aucune sauvegarde obsolète à nettoyer');
      return {
        success: true,
        deletedCount: 0,
        errors: [],
      };
    }

    console.log(`📦 ${oldBackups.length} sauvegarde(s) obsolète(s) trouvée(s)`);

    // 3. Supprimer chaque sauvegarde
    const errors: string[] = [];
    let deletedCount = 0;

    for (const backup of oldBackups) {
      try {
        console.log(`🗑️  Suppression de ${backup.file_path}...`);

        // Extraire le chemin du fichier depuis file_path
        // Format: "backups/submissions/filename.json.gz"
        const pathParts = backup.file_path.split('/');
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');

        // Supprimer le fichier du storage
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (deleteError) {
          throw new Error(`Erreur lors de la suppression du fichier: ${deleteError.message}`);
        }

        // Mettre à jour le statut dans backup_metadata
        const { error: updateError } = await supabase
          .from('backup_metadata')
          .update({ 
            status: 'deleted',
            error_message: `Supprimé automatiquement après ${RETENTION_DAYS} jours`,
          })
          .eq('id', backup.id);

        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour des métadonnées: ${updateError.message}`);
        }

        deletedCount++;
        console.log(`✅ Sauvegarde supprimée: ${backup.backup_date}`);

      } catch (error) {
        const errorMsg = `Échec pour ${backup.backup_date}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`✅ Nettoyage terminé: ${deletedCount}/${oldBackups.length} sauvegarde(s) supprimée(s)`);

    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} erreur(s) rencontrée(s)`);
    }

    return {
      success: errors.length === 0,
      deletedCount,
      totalFound: oldBackups.length,
      errors,
    };

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  cleanupOldBackups()
    .then((result) => {
      console.log('📊 Résultat:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Échec du nettoyage:', error);
      process.exit(1);
    });
}

export { cleanupOldBackups };
