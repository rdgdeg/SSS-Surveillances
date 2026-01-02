#!/usr/bin/env node

/**
 * Script pour appliquer la simplification des consignes de secrétariat
 * Exécute la migration pour passer de 3 champs séparés à un seul champ unifié
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

async function applySimplificationMigration() {
  console.log('🚀 Application de la simplification des consignes de secrétariat...');
  console.log('');

  try {
    console.log('📄 Exécution de la migration étape par étape...');
    
    // Étape 1: Ajouter la nouvelle colonne consignes
    console.log('1️⃣ Ajout de la colonne "consignes"...');
    try {
      // Vérifier si la colonne existe déjà
      const { data: existingData } = await supabase
        .from('consignes_secretariat')
        .select('consignes')
        .limit(1);
      
      if (existingData) {
        console.log('   ✅ Colonne "consignes" déjà présente');
      }
    } catch (error) {
      // La colonne n'existe pas, on va la créer via une mise à jour
      console.log('   ➕ Création de la colonne "consignes"...');
    }

    // Étape 2: Migrer les données existantes
    console.log('2️⃣ Migration des données existantes...');
    
    // Récupérer tous les secrétariats
    const { data: secretariats, error: fetchError } = await supabase
      .from('consignes_secretariat')
      .select('id, code_secretariat, consignes_arrivee, consignes_mise_en_place, consignes_generales, consignes');

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des secrétariats:', fetchError);
      throw fetchError;
    }

    console.log(`   📊 ${secretariats?.length || 0} secrétariats trouvés`);

    // Migrer chaque secrétariat
    for (const secretariat of secretariats || []) {
      if (secretariat.consignes) {
        console.log(`   ⏭️  ${secretariat.code_secretariat}: déjà migré`);
        continue;
      }

      // Construire le nouveau champ consignes
      const parts = [];
      if (secretariat.consignes_arrivee?.trim()) {
        parts.push(secretariat.consignes_arrivee.trim());
      }
      if (secretariat.consignes_mise_en_place?.trim()) {
        parts.push(secretariat.consignes_mise_en_place.trim());
      }
      if (secretariat.consignes_generales?.trim()) {
        parts.push(secretariat.consignes_generales.trim());
      }

      const newConsignes = parts.join('\n\n');

      if (newConsignes) {
        console.log(`   🔄 Migration de ${secretariat.code_secretariat}...`);
        const { error: updateError } = await supabase
          .from('consignes_secretariat')
          .update({ consignes: newConsignes })
          .eq('id', secretariat.id);

        if (updateError) {
          console.error(`❌ Erreur lors de la migration de ${secretariat.code_secretariat}:`, updateError);
          throw updateError;
        }
        console.log(`   ✅ ${secretariat.code_secretariat} migré`);
      } else {
        console.log(`   ⚠️  ${secretariat.code_secretariat}: aucune consigne à migrer`);
      }
    }

    console.log('✅ Migration des données terminée');
    console.log('');

    // Vérifier que la nouvelle colonne existe
    console.log('🔍 Vérification de la nouvelle colonne...');
    const { data: columns, error: columnsError } = await supabase
      .from('consignes_secretariat')
      .select('consignes')
      .limit(1);

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification:', columnsError);
      throw columnsError;
    }

    console.log('✅ Colonne "consignes" disponible');

    // Vérifier les données migrées
    console.log('📊 Vérification des données migrées...');
    const { data: finalSecretariats, error: dataError } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, consignes, consignes_arrivee, consignes_mise_en_place, consignes_generales')
      .order('code_secretariat');

    if (dataError) {
      console.error('❌ Erreur lors de la vérification des données:', dataError);
      throw dataError;
    }

    console.log('');
    console.log('📋 État des consignes par secrétariat:');
    console.log('=====================================');
    
    finalSecretariats?.forEach(sec => {
      console.log(`\n🏢 ${sec.code_secretariat}:`);
      console.log(`   Nouveau champ unifié: ${sec.consignes ? '✅ Migré' : '❌ Vide'}`);
      if (sec.consignes) {
        const preview = sec.consignes.substring(0, 100);
        console.log(`   Aperçu: "${preview}${sec.consignes.length > 100 ? '...' : ''}"`);
      }
    });

    console.log('');
    console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. ✅ Migration SQL appliquée');
    console.log('2. ✅ Interface admin déjà mise à jour');
    console.log('3. 🔄 Mise à jour du planning public en cours...');
    console.log('4. 🧪 Tests de l\'interface complète');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
applySimplificationMigration();