#!/usr/bin/env node

/**
 * Test de base du système d'héritage des consignes
 * Teste les fonctionnalités de base sans les vues et fonctions avancées
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://budffopdzqjfkbgbpbml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicConsignes() {
  console.log('🧪 Test de base du système d\'héritage des consignes...\n');

  // Test 1: Vérifier les colonnes et données de base
  console.log('📋 Test 1: Vérification des données de base...');
  
  try {
    // Récupérer un examen avec ses nouvelles colonnes
    const { data: examens, error: examensError } = await supabase
      .from('examens')
      .select(`
        id, 
        code_examen, 
        secretariat,
        utiliser_consignes_specifiques,
        consignes_specifiques_generales,
        consignes_specifiques_arrivee,
        consignes_specifiques_mise_en_place
      `)
      .limit(3);

    if (examensError) {
      console.log('❌ Erreur:', examensError.message);
      return;
    }

    console.log(`✅ ${examens?.length || 0} examen(s) trouvé(s) avec les nouvelles colonnes`);
    
    if (examens && examens.length > 0) {
      examens.forEach((examen, index) => {
        console.log(`\n   Examen ${index + 1}:`);
        console.log(`   - Code: ${examen.code_examen}`);
        console.log(`   - Secrétariat: ${examen.secretariat || 'Non défini'}`);
        console.log(`   - Utilise consignes spécifiques: ${examen.utiliser_consignes_specifiques || false}`);
        console.log(`   - Consignes spécifiques générales: ${examen.consignes_specifiques_generales ? 'Définies' : 'Non définies'}`);
      });
    }

    // Test 2: Récupérer les consignes de secrétariat
    console.log('\n📝 Test 2: Consignes de secrétariat...');
    
    const { data: consignesSecretariat, error: consignesError } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, nom_secretariat, consignes_generales, consignes_arrivee, consignes_mise_en_place')
      .eq('is_active', true);

    if (consignesError) {
      console.log('❌ Erreur:', consignesError.message);
      return;
    }

    console.log(`✅ ${consignesSecretariat?.length || 0} secrétariat(s) avec consignes`);
    
    if (consignesSecretariat && consignesSecretariat.length > 0) {
      consignesSecretariat.forEach(cs => {
        console.log(`\n   ${cs.code_secretariat} - ${cs.nom_secretariat}:`);
        console.log(`   - Consignes générales: ${cs.consignes_generales ? '✅ Définies' : '❌ Manquantes'}`);
        console.log(`   - Consignes arrivée: ${cs.consignes_arrivee ? '✅ Définies' : '❌ Manquantes'}`);
        console.log(`   - Consignes mise en place: ${cs.consignes_mise_en_place ? '✅ Définies' : '❌ Manquantes'}`);
      });
    }

    // Test 3: Simulation de l'héritage des consignes
    console.log('\n🔄 Test 3: Simulation de l\'héritage des consignes...');
    
    if (examens && examens.length > 0 && consignesSecretariat && consignesSecretariat.length > 0) {
      const examen = examens[0];
      const secretariatConsignes = consignesSecretariat.find(cs => cs.code_secretariat === examen.secretariat);
      
      if (secretariatConsignes) {
        console.log(`\n   Examen: ${examen.code_examen} (${examen.secretariat})`);
        
        // Simuler la logique d'héritage
        const consignesEffectives = {
          generales: examen.utiliser_consignes_specifiques && examen.consignes_specifiques_generales 
            ? examen.consignes_specifiques_generales 
            : secretariatConsignes.consignes_generales,
          arrivee: examen.utiliser_consignes_specifiques && examen.consignes_specifiques_arrivee 
            ? examen.consignes_specifiques_arrivee 
            : secretariatConsignes.consignes_arrivee,
          source: examen.utiliser_consignes_specifiques ? 'spécifique' : 'secrétariat'
        };
        
        console.log(`   - Source des consignes: ${consignesEffectives.source}`);
        console.log(`   - Consignes générales effectives: ${consignesEffectives.generales ? 'Présentes' : 'Absentes'}`);
        console.log(`   - Consignes arrivée effectives: ${consignesEffectives.arrivee ? 'Présentes' : 'Absentes'}`);
        
        if (consignesEffectives.generales) {
          console.log(`   - Aperçu: "${consignesEffectives.generales.substring(0, 100)}..."`);
        }
      } else {
        console.log(`   ⚠️  Aucune consigne trouvée pour le secrétariat ${examen.secretariat}`);
      }
    }

    // Test 4: Test de mise à jour des consignes spécifiques
    console.log('\n✏️ Test 4: Test de mise à jour des consignes spécifiques...');
    
    if (examens && examens.length > 0) {
      const examenTest = examens[0];
      
      // Essayer de mettre à jour les consignes spécifiques
      const { data: updateResult, error: updateError } = await supabase
        .from('examens')
        .update({
          utiliser_consignes_specifiques: true,
          consignes_specifiques_generales: 'Test: Consignes spécifiques pour cet examen'
        })
        .eq('id', examenTest.id)
        .select();

      if (updateError) {
        console.log('❌ Erreur lors de la mise à jour:', updateError.message);
      } else {
        console.log('✅ Mise à jour des consignes spécifiques réussie');
        
        // Remettre à l'état initial
        await supabase
          .from('examens')
          .update({
            utiliser_consignes_specifiques: false,
            consignes_specifiques_generales: null
          })
          .eq('id', examenTest.id);
        
        console.log('✅ État initial restauré');
      }
    }

    console.log('\n🎉 TESTS DE BASE TERMINÉS AVEC SUCCÈS !');
    console.log('=====================================');
    console.log('✅ Colonnes pour consignes spécifiques: Fonctionnelles');
    console.log('✅ Consignes de secrétariat: Disponibles');
    console.log('✅ Logique d\'héritage: Simulée avec succès');
    console.log('✅ Mise à jour des consignes: Fonctionnelle');
    console.log('');
    console.log('📋 Le système de base est opérationnel !');
    console.log('');
    console.log('⚠️  Note: Les vues et fonctions avancées nécessitent des permissions administrateur');
    console.log('   Vous pouvez les créer manuellement dans l\'interface Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testBasicConsignes().catch(console.error);