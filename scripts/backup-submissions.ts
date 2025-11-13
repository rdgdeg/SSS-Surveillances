/**
 * Script de sauvegarde quotidienne des soumissions
 * 
 * Ce script doit être exécuté quotidiennement (via cron job) pour :
 * 1. Exporter toutes les soumissions au format JSON
 * 2. Compresser le fichier avec gzip
 * 3. Calculer un checksum
 * 4. Enregistrer les métadonnées dans backup_metadata
 * 5. Uploader vers un stockage sécurisé
 * 
 * Usage: npx ts-node scripts/backup-submissions.ts
 * Cron: 0 2 * * * (tous les jours à 2h du matin)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as crypto from 'crypto';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const STORAGE_BUCKET = 'backups'; // Nom du bucket Supabase Storage

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Calcule le checksum MD5 d'un fichier
 */
function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Compresse un fichier avec gzip
 */
function compressFile(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gzip = zlib.createGzip();

    input.pipe(gzip).pipe(output);
    
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

/**
 * Exécute la sauvegarde
 */
async function performBackup() {
  const backupDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const timestamp = Date.now();
  
  console.log(`🔄 Démarrage de la sauvegarde pour ${backupDate}...`);

  try {
    // 1. Créer le répertoire de sauvegarde s'il n'existe pas
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // 2. Exporter toutes les soumissions
    console.log('📥 Exportation des soumissions...');
    const { data: submissions, error: fetchError } = await supabase
      .from('soumissions_disponibilites')
      .select('*')
      .is('deleted_at', null); // Exclure les soumissions supprimées

    if (fetchError) {
      throw new Error(`Erreur lors de l'export: ${fetchError.message}`);
    }

    const recordCount = submissions?.length || 0;
    console.log(`✅ ${recordCount} soumissions exportées`);

    // 3. Écrire dans un fichier JSON
    const jsonFileName = `submissions_${backupDate}_${timestamp}.json`;
    const jsonFilePath = path.join(BACKUP_DIR, jsonFileName);
    
    fs.writeFileSync(jsonFilePath, JSON.stringify(submissions, null, 2));
    console.log(`💾 Fichier JSON créé: ${jsonFileName}`);

    // 4. Compresser le fichier
    const gzFileName = `${jsonFileName}.gz`;
    const gzFilePath = path.join(BACKUP_DIR, gzFileName);
    
    await compressFile(jsonFilePath, gzFilePath);
    console.log(`🗜️  Fichier compressé: ${gzFileName}`);

    // 5. Calculer le checksum
    const checksum = await calculateChecksum(gzFilePath);
    console.log(`🔐 Checksum: ${checksum}`);

    // 6. Obtenir la taille du fichier
    const stats = fs.statSync(gzFilePath);
    const fileSizeBytes = stats.size;
    console.log(`📊 Taille: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);

    // 7. Uploader vers Supabase Storage
    console.log('☁️  Upload vers Supabase Storage...');
    const fileBuffer = fs.readFileSync(gzFilePath);
    
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`submissions/${gzFileName}`, fileBuffer, {
        contentType: 'application/gzip',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    const storagePath = `${STORAGE_BUCKET}/submissions/${gzFileName}`;
    console.log(`✅ Fichier uploadé: ${storagePath}`);

    // 8. Enregistrer les métadonnées
    console.log('📝 Enregistrement des métadonnées...');
    const { error: metadataError } = await supabase
      .from('backup_metadata')
      .insert({
        backup_date: backupDate,
        table_name: 'soumissions_disponibilites',
        record_count: recordCount,
        file_path: storagePath,
        file_size_bytes: fileSizeBytes,
        checksum,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    if (metadataError) {
      throw new Error(`Erreur lors de l'enregistrement des métadonnées: ${metadataError.message}`);
    }

    // 9. Nettoyer les fichiers locaux (optionnel)
    fs.unlinkSync(jsonFilePath);
    fs.unlinkSync(gzFilePath);
    console.log('🧹 Fichiers locaux nettoyés');

    console.log('✅ Sauvegarde terminée avec succès!');
    return {
      success: true,
      backupDate,
      recordCount,
      fileSizeBytes,
      checksum,
    };

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);

    // Enregistrer l'échec dans backup_metadata
    try {
      await supabase.from('backup_metadata').insert({
        backup_date: backupDate,
        table_name: 'soumissions_disponibilites',
        record_count: 0,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } catch (metaError) {
      console.error('❌ Impossible d\'enregistrer l\'échec:', metaError);
    }

    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  performBackup()
    .then((result) => {
      console.log('📊 Résultat:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la sauvegarde:', error);
      process.exit(1);
    });
}

export { performBackup };
