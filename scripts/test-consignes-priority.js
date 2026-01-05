#!/usr/bin/env node

/**
 * Script de test pour vérifier la logique de priorité des consignes
 * Usage: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/test-consignes-priority.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConsignesPriority() {
  console.log('🧪 Test de la logique de priorité des consignes\n');

  try {
    // Test 1: Vérifier les consignes du secrétariat
    console.log('📋 Test 1: Consignes du secrétariat');
    const { data: secretariats, error: secretariatsError } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, nom_secretariat, consignes, consignes_arrivee, consignes_generales')
      .order('code_secretariat');

    if (secretariatsError) throw secretariatsError;

    secretariats.forEach(s => {
      const hasConsignes = s.consignes || s.consignes_arrivee || s.consignes_generales;
      console.log(`  ${s.code_secretariat}: ${hasConsignes ? '✅ Consignes définies' : '❌ Pas de consignes'}`);
    });

    // Test 2: Examens avec consignes spécifiques
    console.log('\n📋 Test 2: Examens avec consignes spécifiques');
    const { data: examensSpecifiques, error: examensError } = await supabase
      .from('examens')
      .select('code_examen, nom_examen, secretariat, utiliser_consignes_specifiques, consignes_specifiques_arrivee, consignes_specifiques_generales')
      .eq('utiliser_consignes_specifiques', true)
      .limit(5);

    if (examensError) throw examensError;

    if (examensSpecifiques.length === 0) {
      console.log('  ℹ️  Aucun examen avec consignes spécifiques trouvé');
    } else {
      examensSpecifiques.forEach(e => {
        const hasSpecifiques = e.consignes_specifiques_arrivee || e.consignes_specifiques_generales;
        console.log(`  ${e.code_examen}: ${hasSpecifiques ? '✅ Consignes spécifiques définies' : '⚠️  Flag activé mais pas de contenu'}`);
      });
    }

    // Test 3: Examens WMD1105 spécifiquement
    console.log('\n📋 Test 3: Examens WMD1105');
    const { data: wmdExamens, error: wmdError } = await supabase
      .from('examens')
      .select('code_examen, nom_examen, secretariat, utiliser_consignes_specifiques, is_mode_secretariat, consignes_specifiques_arrivee, consignes_specifiques_generales')
      .ilike('code_examen', '%WMD1105%');

    if (wmdError) throw wmdError;

    if (wmdExamens.length === 0) {
      console.log('  ℹ️  Aucun examen WMD1105 trouvé');
    } else {
      wmdExamens.forEach(e => {
        let priorite = 'Consignes du secrétariat';
        if (e.is_mode_secretariat && !e.utiliser_consignes_specifiques) {
          priorite = 'Mode secrétariat (message spécial)';
        } else if (e.utiliser_consignes_specifiques) {
          priorite = 'Consignes spécifiques (PRIORITÉ MAXIMALE)';
        }
        console.log(`  ${e.code_examen}: ${priorite}`);
      });
    }

    // Test 4: Simulation de la logique de priorité
    console.log('\n📋 Test 4: Simulation de la logique de priorité');
    const { data: examensTest, error: testError } = await supabase
      .from('examens')
      .select(`
        code_examen, 
        nom_examen, 
        secretariat, 
        utiliser_consignes_specifiques, 
        is_mode_secretariat,
        consignes_specifiques_arrivee,
        consignes_specifiques_generales,
        cours(consignes)
      `)
      .eq('valide', true)
      .limit(10);

    if (testError) throw testError;

    examensTest.forEach(e => {
      let priorite = '';
      let couleur = '';

      if (e.is_mode_secretariat && !e.utiliser_consignes_specifiques) {
        priorite = 'Mode secrétariat';
        couleur = '🟡';
      } else if (e.utiliser_consignes_specifiques) {
        priorite = 'Consignes spécifiques';
        couleur = '🟠';
      } else if (e.cours?.consignes) {
        priorite = 'Consignes du cours';
        couleur = '🟠';
      } else {
        priorite = 'Consignes du secrétariat';
        couleur = '🔵';
      }

      console.log(`  ${couleur} ${e.code_examen}: ${priorite}`);
    });

    // Test 5: Résumé statistique
    console.log('\n📊 Test 5: Résumé statistique');
    const { data: stats, error: statsError } = await supabase
      .from('examens')
      .select('utiliser_consignes_specifiques, is_mode_secretariat')
      .eq('valide', true);

    if (statsError) throw statsError;

    const total = stats.length;
    const specifiques = stats.filter(s => s.utiliser_consignes_specifiques).length;
    const modeSecretariat = stats.filter(s => s.is_mode_secretariat && !s.utiliser_consignes_specifiques).length;
    const secretariat = total - specifiques - modeSecretariat;

    console.log(`  Total examens: ${total}`);
    console.log(`  🟠 Consignes spécifiques: ${specifiques} (${((specifiques/total)*100).toFixed(1)}%)`);
    console.log(`  🟡 Mode secrétariat: ${modeSecretariat} (${((modeSecretariat/total)*100).toFixed(1)}%)`);
    console.log(`  🔵 Consignes secrétariat: ${secretariat} (${((secretariat/total)*100).toFixed(1)}%)`);

    console.log('\n✅ Tests terminés avec succès!');
    console.log('\n📝 Logique de priorité appliquée:');
    console.log('   1. 🟠 Consignes spécifiques de l\'examen (priorité maximale)');
    console.log('   2. 🟠 Consignes du cours (priorité intermédiaire)');
    console.log('   3. 🔵 Consignes du secrétariat (priorité par défaut)');
    console.log('   4. 🟡 Mode secrétariat (cas spécial)');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
testConsignesPriority();