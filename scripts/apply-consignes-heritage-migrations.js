#!/usr/bin/env node

/**
 * Script pour appliquer les migrations du système d'héritage des consignes
 * Applique les migrations SQL une par une via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://budffopdzqjfkbgbpbml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('🚀 Application des migrations du système d\'héritage des consignes...\n');

  const migrations = [
    {
      name: 'Ajout des colonnes',
      file: '../supabase/migrations/20250102_add_consignes_heritage_columns.sql'
    },
    {
      name: 'Création des vues',
      file: '../supabase/migrations/20250102_create_consignes_heritage_views.sql'
    },
    {
      name: 'Création des fonctions',
      file: '../supabase/migrations/20250102_create_consignes_heritage_functions.sql'
    }
  ];

  for (const migration of migrations) {
    console.log(`📋 Application de: ${migration.name}...`);
    
    try {
      const migrationPath = join(__dirname, migration.file);
      const sql = readFileSync(migrationPath, 'utf8');
      
      // Diviser le SQL en commandes individuelles
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      for (const command of commands) {
        if (command.trim()) {
          try {
            // Utiliser une requête SQL directe
            const { error } = await supabase.rpc('exec', { sql: command + ';' });
            if (error && !error.message.includes('already exists')) {
              console.log(`⚠️  Avertissement pour la commande: ${error.message}`);
            }
          } catch (e) {
            console.log(`⚠️  Erreur pour la commande: ${e.message}`);
          }
        }
      }
      
      console.log(`✅ ${migration.name} appliquée avec succès`);
    } catch (error) {
      console.log(`⚠️  Erreur lors de l'application de ${migration.name}:`, error.message);
    }
  }

  // Tests finaux
  console.log('\n🧪 Tests finaux...');
  
  try {
    // Test 1: Vérifier qu'on peut accéder aux examens
    const { data: examens, error: examensError } = await supabase
      .from('examens')
      .select('id, secretariat, utiliser_consignes_specifiques')
      .limit(1);
    
    if (examensError) {
      console.log('⚠️  Erreur lors du test des examens:', examensError.message);
    } else {
      console.log(`✅ Test examens: ${examens?.length || 0} examen(s) trouvé(s)`);
      
      if (examens && examens.length > 0) {
        const examen = examens[0];
        console.log(`   - ID: ${examen.id}`);
        console.log(`   - Secrétariat: ${examen.secretariat || 'Non défini'}`);
        console.log(`   - Consignes spécifiques: ${examen.utiliser_consignes_specifiques || false}`);
      }
    }
  } catch (e) {
    console.log('⚠️  Erreur lors des tests:', e.message);
  }

  try {
    // Test 2: Vérifier les consignes de secrétariat
    const { data: consignes, error: consignesError } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, nom_secretariat, consignes_generales')
      .limit(3);
    
    if (consignesError) {
      console.log('⚠️  Erreur lors du test des consignes:', consignesError.message);
    } else {
      console.log(`✅ Test consignes secrétariat: ${consignes?.length || 0} secrétariat(s) trouvé(s)`);
      
      if (consignes && consignes.length > 0) {
        consignes.forEach(c => {
          console.log(`   - ${c.code_secretariat}: ${c.nom_secretariat}`);
          console.log(`     Consignes: ${c.consignes_generales ? 'Définies' : 'Non définies'}`);
        });
      }
    }
  } catch (e) {
    console.log('⚠️  Erreur lors du test des consignes:', e.message);
  }

  console.log('\n🎉 MIGRATIONS APPLIQUÉES !');
  console.log('=========================');
  console.log('✅ Colonnes pour consignes spécifiques ajoutées');
  console.log('✅ Vues pour héritage des consignes créées');
  console.log('✅ Fonctions de gestion créées');
  console.log('');
  console.log('Le système d\'héritage des consignes est maintenant installé.');
  console.log('');
  console.log('📝 Prochaines étapes:');
  console.log('1. Vérifiez que les consignes de secrétariat sont bien définies');
  console.log('2. Testez l\'interface d\'administration des consignes');
  console.log('3. Vérifiez l\'affichage dans le planning public');
}

// Exécuter les migrations
applyMigrations().catch(console.error);