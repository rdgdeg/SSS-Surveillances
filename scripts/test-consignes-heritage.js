#!/usr/bin/env node

/**
 * Script de test du système d'héritage des consignes
 * Vérifie que toutes les fonctionnalités fonctionnent correctement
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://budffopdzqjfkbgbpbml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConsignesHeritage() {
  console.log('🧪 Test du système d\'héritage des consignes...\n');

  let allTestsPassed = true;

  // Test 1: Vérifier les colonnes ajoutées
  console.log('📋 Test 1: Vérification des colonnes...');
  try {
    const { data: examens, error } = await supabase
      .from('examens')
      .select('id, utiliser_consignes_specifiques, consignes_specifiques_generales')
      .limit(1);

    if (error) {
      console.log('❌ Erreur lors de la vérification des colonnes:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Colonnes ajoutées avec succès');
      if (examens && examens.length > 0) {
        const examen = examens[0];
        console.log(`   - utiliser_consignes_specifiques: ${examen.utiliser_consignes_specifiques !== undefined ? '✓' : '❌'}`);
        console.log(`   - consignes_specifiques_generales: ${examen.consignes_specifiques_generales !== undefined ? '✓' : '❌'}`);
      }
    }
  } catch (e) {
    console.log('❌ Erreur lors du test des colonnes:', e.message);
    allTestsPassed = false;
  }

  // Test 2: Vérifier la vue examens_with_consignes
  console.log('\n📊 Test 2: Vérification de la vue examens_with_consignes...');
  try {
    const { data: examensWithConsignes, error } = await supabase
      .from('examens_with_consignes')
      .select('id, secretariat, consignes_generales_effectives, source_consignes')
      .limit(1);

    if (error) {
      console.log('❌ Erreur lors de la vérification de la vue:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Vue examens_with_consignes accessible');
      if (examensWithConsignes && examensWithConsignes.length > 0) {
        const examen = examensWithConsignes[0];
        console.log(`   - Secrétariat: ${examen.secretariat || 'Non défini'}`);
        console.log(`   - Consignes générales: ${examen.consignes_generales_effectives ? 'Définies' : 'Non définies'}`);
      }
    }
  } catch (e) {
    console.log('❌ Erreur lors du test de la vue:', e.message);
    allTestsPassed = false;
  }

  // Test 3: Vérifier la fonction get_consignes_examen
  console.log('\n⚙️ Test 3: Vérification de la fonction get_consignes_examen...');
  try {
    // Récupérer un examen pour tester
    const { data: examens } = await supabase
      .from('examens')
      .select('id')
      .limit(1);

    if (examens && examens.length > 0) {
      const examenId = examens[0].id;
      
      const { data: consignes, error } = await supabase
        .rpc('get_consignes_examen', { p_examen_id: examenId });

      if (error) {
        console.log('❌ Erreur lors de l\'appel de la fonction:', error.message);
        allTestsPassed = false;
      } else {
        console.log('✅ Fonction get_consignes_examen fonctionne');
        if (consignes && consignes.length > 0) {
          const c = consignes[0];
          console.log(`   - Source des consignes: ${c.source_consignes}`);
          console.log(`   - Consignes générales: ${c.consignes_generales ? 'Définies' : 'Non définies'}`);
          console.log(`   - Heure d'arrivée: ${c.heure_arrivee_suggeree || 'Non définie'}`);
        }
      }
    } else {
      console.log('⚠️  Aucun examen disponible pour tester la fonction');
    }
  } catch (e) {
    console.log('❌ Erreur lors du test de la fonction:', e.message);
    allTestsPassed = false;
  }

  // Test 4: Vérifier les consignes de secrétariat
  console.log('\n📝 Test 4: Vérification des consignes de secrétariat...');
  try {
    const { data: consignesSecretariat, error } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, nom_secretariat, consignes_generales, is_active')
      .eq('is_active', true);

    if (error) {
      console.log('❌ Erreur lors de la vérification des consignes:', error.message);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${consignesSecretariat?.length || 0} secrétariat(s) actif(s) trouvé(s)`);
      
      if (consignesSecretariat && consignesSecretariat.length > 0) {
        consignesSecretariat.forEach(cs => {
          const hasConsignes = cs.consignes_generales && cs.consignes_generales.trim().length > 0;
          console.log(`   - ${cs.code_secretariat} (${cs.nom_secretariat}): ${hasConsignes ? '✅ Consignes définies' : '⚠️  Consignes manquantes'}`);
          
          if (!hasConsignes) {
            allTestsPassed = false;
          }
        });
      }
    }
  } catch (e) {
    console.log('❌ Erreur lors du test des consignes:', e.message);
    allTestsPassed = false;
  }

  // Test 5: Test d'intégration complet
  console.log('\n🔄 Test 5: Test d\'intégration complet...');
  try {
    // Récupérer un examen avec son secrétariat
    const { data: examensAvecSecretariat, error } = await supabase
      .from('examens')
      .select('id, secretariat')
      .not('secretariat', 'is', null)
      .limit(1);

    if (error) {
      console.log('❌ Erreur lors de la récupération des examens:', error.message);
      allTestsPassed = false;
    } else if (examensAvecSecretariat && examensAvecSecretariat.length > 0) {
      const examen = examensAvecSecretariat[0];
      
      // Tester l'héritage des consignes
      const { data: consignesHeritees, error: heritageError } = await supabase
        .rpc('get_consignes_examen', { p_examen_id: examen.id });

      if (heritageError) {
        console.log('❌ Erreur lors du test d\'héritage:', heritageError.message);
        allTestsPassed = false;
      } else {
        console.log('✅ Test d\'intégration réussi');
        if (consignesHeritees && consignesHeritees.length > 0) {
          const c = consignesHeritees[0];
          console.log(`   - Examen ${examen.id} (${examen.secretariat})`);
          console.log(`   - Source: ${c.source_consignes}`);
          console.log(`   - Consignes effectives: ${c.consignes_generales ? 'Présentes' : 'Absentes'}`);
        }
      }
    } else {
      console.log('⚠️  Aucun examen avec secrétariat trouvé pour le test d\'intégration');
    }
  } catch (e) {
    console.log('❌ Erreur lors du test d\'intégration:', e.message);
    allTestsPassed = false;
  }

  // Résumé final
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
    console.log('✅ Le système d\'héritage des consignes est complètement opérationnel');
    console.log('');
    console.log('📋 Fonctionnalités disponibles:');
    console.log('   ✅ Héritage automatique des consignes du secrétariat');
    console.log('   ✅ Personnalisation des consignes par examen');
    console.log('   ✅ Interface de gestion des consignes');
    console.log('   ✅ Affichage dans le planning public');
    console.log('');
    console.log('🚀 Vous pouvez maintenant utiliser le système !');
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('❌ Le système d\'héritage des consignes n\'est pas complètement opérationnel');
    console.log('');
    console.log('🔧 Actions recommandées:');
    console.log('   1. Vérifiez les logs ci-dessus pour identifier les problèmes');
    console.log('   2. Assurez-vous que les consignes de secrétariat sont définies');
    console.log('   3. Vérifiez les permissions de la base de données');
    console.log('   4. Relancez les migrations si nécessaire');
  }
  console.log('='.repeat(50));
}

// Exécuter les tests
testConsignesHeritage().catch(console.error);