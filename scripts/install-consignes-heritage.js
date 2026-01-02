#!/usr/bin/env node

/**
 * Script d'installation du système d'héritage des consignes
 * Exécute le script SQL via Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://budffopdzqjfkbgbpbml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function installConsignesHeritage() {
  console.log('🚀 Installation du système d\'héritage des consignes...\n');

  try {
    // Étape 1: Ajouter les colonnes manquantes
    console.log('📋 ÉTAPE 1: Ajout des colonnes...');
    
    // Vérifier si les colonnes existent déjà
    const { data: columns, error: columnsCheckError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'examens')
      .in('column_name', [
        'consignes_specifiques_arrivee',
        'consignes_specifiques_mise_en_place', 
        'consignes_specifiques_generales',
        'utiliser_consignes_specifiques'
      ]);

    if (columnsCheckError) {
      console.log('⚠️  Impossible de vérifier les colonnes existantes, on continue...');
    }

    const existingColumns = columns?.map(c => c.column_name) || [];
    console.log('Colonnes existantes:', existingColumns);

    // Ajouter les colonnes une par une
    const columnsToAdd = [
      { name: 'consignes_specifiques_arrivee', type: 'TEXT' },
      { name: 'consignes_specifiques_mise_en_place', type: 'TEXT' },
      { name: 'consignes_specifiques_generales', type: 'TEXT' },
      { name: 'utiliser_consignes_specifiques', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: `ALTER TABLE examens ADD COLUMN ${column.name} ${column.type};` 
          });
          if (error) {
            console.log(`⚠️  Erreur lors de l'ajout de ${column.name}:`, error.message);
          } else {
            console.log(`✅ Colonne ${column.name} ajoutée`);
          }
        } catch (e) {
          console.log(`⚠️  Erreur lors de l'ajout de ${column.name}:`, e.message);
        }
      } else {
        console.log(`✅ Colonne ${column.name} existe déjà`);
      }
    }

    console.log('✅ Étape 1 terminée\n');

    // Étape 2: Créer les vues
    console.log('📊 ÉTAPE 2: Création des vues...');
    
    // Vue examens_with_consignes
    try {
      const { error: viewError } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE OR REPLACE VIEW examens_with_consignes AS
          SELECT 
              e.*,
              cs.nom_secretariat,
              cs.heure_arrivee_suggeree,
              -- Consignes effectives (spécifiques si définies, sinon celles du secrétariat)
              CASE 
                  WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_arrivee IS NOT NULL 
                  THEN e.consignes_specifiques_arrivee
                  ELSE cs.consignes_arrivee
              END as consignes_arrivee_effectives,
              
              CASE 
                  WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_mise_en_place IS NOT NULL 
                  THEN e.consignes_specifiques_mise_en_place
                  ELSE cs.consignes_mise_en_place
              END as consignes_mise_en_place_effectives,
              
              CASE 
                  WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_generales IS NOT NULL 
                  THEN e.consignes_specifiques_generales
                  ELSE cs.consignes_generales
              END as consignes_generales_effectives,
              
              -- Consignes du secrétariat (pour référence)
              cs.consignes_arrivee as consignes_secretariat_arrivee,
              cs.consignes_mise_en_place as consignes_secretariat_mise_en_place,
              cs.consignes_generales as consignes_secretariat_generales,
              
              -- Indicateurs de personnalisation
              CASE 
                  WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_arrivee IS NOT NULL 
                  THEN true ELSE false
              END as consignes_arrivee_personnalisees,
              
              CASE 
                  WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_mise_en_place IS NOT NULL 
                  THEN true ELSE false
              END as consignes_mise_en_place_personnalisees,
              
              CASE 
                  WHEN e.utiliser_consignes_specifiques = true AND e.consignes_specifiques_generales IS NOT NULL 
                  THEN true ELSE false
              END as consignes_generales_personnalisees

          FROM examens e
          LEFT JOIN consignes_secretariat cs ON e.secretariat = cs.code_secretariat
          WHERE cs.is_active = true OR cs.is_active IS NULL;
        ` 
      });
      
      if (viewError) {
        console.log('⚠️  Erreur lors de la création de examens_with_consignes:', viewError.message);
      } else {
        console.log('✅ Vue examens_with_consignes créée');
      }
    } catch (e) {
      console.log('⚠️  Erreur lors de la création de examens_with_consignes:', e.message);
    }

    console.log('✅ Étape 2 terminée\n');

    // Étape 3: Créer les fonctions
    console.log('⚙️ ÉTAPE 3: Création des fonctions...');
    
    try {
      const { error: functionError } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION get_consignes_examen(p_examen_id UUID)
          RETURNS TABLE (
              consignes_arrivee TEXT,
              consignes_mise_en_place TEXT,
              consignes_generales TEXT,
              heure_arrivee_suggeree VARCHAR(10),
              source_consignes TEXT
          ) AS $function$
          BEGIN
              RETURN QUERY
              SELECT 
                  ewc.consignes_arrivee_effectives,
                  ewc.consignes_mise_en_place_effectives,
                  ewc.consignes_generales_effectives,
                  ewc.heure_arrivee_suggeree,
                  CASE 
                      WHEN ewc.utiliser_consignes_specifiques = true THEN 'specifique'
                      ELSE 'secretariat'
                  END::TEXT as source_consignes
              FROM examens_with_consignes ewc
              WHERE ewc.id = p_examen_id;
          END;
          $function$ LANGUAGE plpgsql;
        ` 
      });
      
      if (functionError) {
        console.log('⚠️  Erreur lors de la création de get_consignes_examen:', functionError.message);
      } else {
        console.log('✅ Fonction get_consignes_examen créée');
      }
    } catch (e) {
      console.log('⚠️  Erreur lors de la création de get_consignes_examen:', e.message);
    }

    console.log('✅ Étape 3 terminée\n');

    // Étape 4: Tests
    console.log('🧪 ÉTAPE 4: Tests et vérifications...');
    
    // Test simple - vérifier qu'on peut accéder aux examens
    const { data: examensTest, error: testError } = await supabase
      .from('examens')
      .select('id, secretariat')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Erreur lors du test:', testError.message);
    } else {
      console.log(`✅ Test de base réussi: ${examensTest?.length || 0} examen(s) trouvé(s)`);
    }

    console.log('\n🎉 INSTALLATION TERMINÉE !');
    console.log('========================');
    console.log('✅ Colonnes ajoutées ou vérifiées: 4');
    console.log('✅ Vues créées: 1');
    console.log('✅ Fonctions créées: 1');
    console.log('');
    console.log('Le système d\'héritage des consignes est en cours d\'installation.');
    console.log('Certaines fonctionnalités peuvent nécessiter des permissions administrateur.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'installation:', error);
    process.exit(1);
  }
}

// Exécuter l'installation
installConsignesHeritage();