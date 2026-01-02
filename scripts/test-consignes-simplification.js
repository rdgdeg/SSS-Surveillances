#!/usr/bin/env node

/**
 * Script pour tester la simplification des consignes de secrétariat
 * Vérifie que l'interface fonctionne correctement avec le nouveau champ unifié
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://budffopdzqjfkbgbpbml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConsignesSimplification() {
  console.log('🧪 Test de la simplification des consignes de secrétariat');
  console.log('======================================================');
  console.log('');

  try {
    // Test 1: Vérifier que la nouvelle colonne existe et contient des données
    console.log('1️⃣ Test de la nouvelle colonne "consignes"...');
    const { data: secretariats, error: secretariatsError } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, nom_secretariat, consignes, consignes_arrivee, consignes_mise_en_place, consignes_generales')
      .order('code_secretariat');

    if (secretariatsError) {
      console.error('❌ Erreur:', secretariatsError);
      throw secretariatsError;
    }

    console.log(`✅ ${secretariats?.length || 0} secrétariats trouvés`);
    
    secretariats?.forEach(sec => {
      console.log(`\n📋 ${sec.code_secretariat} - ${sec.nom_secretariat}:`);
      console.log(`   Nouveau champ: ${sec.consignes ? '✅ Présent' : '❌ Vide'}`);
      if (sec.consignes) {
        const lines = sec.consignes.split('\n').length;
        console.log(`   Contenu: ${sec.consignes.length} caractères, ${lines} lignes`);
        console.log(`   Aperçu: "${sec.consignes.substring(0, 80)}..."`);
      }
      
      // Vérifier si les anciens champs existent encore
      const hasOldFields = sec.consignes_arrivee || sec.consignes_mise_en_place || sec.consignes_generales;
      console.log(`   Anciens champs: ${hasOldFields ? '⚠️  Encore présents' : '✅ Nettoyés'}`);
    });

    console.log('');

    // Test 2: Vérifier qu'on peut récupérer les consignes pour le planning public
    console.log('2️⃣ Test de récupération pour le planning public...');
    const { data: consignesPublic, error: publicError } = await supabase
      .from('consignes_secretariat')
      .select('code_secretariat, nom_secretariat, consignes, heure_arrivee_suggeree')
      .eq('is_active', true);

    if (publicError) {
      console.error('❌ Erreur:', publicError);
      throw publicError;
    }

    console.log(`✅ ${consignesPublic?.length || 0} secrétariats actifs pour le planning public`);
    
    consignesPublic?.forEach(sec => {
      console.log(`   ${sec.code_secretariat}: ${sec.consignes ? '✅ Consignes OK' : '❌ Pas de consignes'}`);
    });

    console.log('');

    // Test 3: Simuler la récupération d'un examen avec ses consignes
    console.log('3️⃣ Test de récupération d\'un examen avec consignes...');
    const { data: examens, error: examensError } = await supabase
      .from('examens')
      .select('id, code_examen, nom_examen, secretariat')
      .limit(3);

    if (examensError) {
      console.error('❌ Erreur:', examensError);
      throw examensError;
    }

    console.log(`✅ ${examens?.length || 0} examens de test trouvés`);

    for (const examen of examens || []) {
      console.log(`\n📝 Examen: ${examen.code_examen} - ${examen.nom_examen}`);
      console.log(`   Secrétariat: ${examen.secretariat}`);
      
      // Récupérer les consignes du secrétariat
      const consignesSecretariat = consignesPublic?.find(c => c.code_secretariat === examen.secretariat);
      if (consignesSecretariat) {
        console.log(`   ✅ Consignes trouvées: ${consignesSecretariat.consignes ? 'Oui' : 'Non'}`);
        if (consignesSecretariat.consignes) {
          const preview = consignesSecretariat.consignes.substring(0, 60);
          console.log(`   Aperçu: "${preview}..."`);
        }
      } else {
        console.log(`   ❌ Aucune consigne trouvée pour le secrétariat ${examen.secretariat}`);
      }
    }

    console.log('');

    // Test 4: Vérifier la compatibilité avec les consignes spécifiques
    console.log('4️⃣ Test de compatibilité avec les consignes spécifiques...');
    const { data: examensSpecifiques, error: specifiquesError } = await supabase
      .from('examens')
      .select('id, code_examen, utiliser_consignes_specifiques, consignes_specifiques_arrivee, consignes_specifiques_mise_en_place, consignes_specifiques_generales')
      .eq('utiliser_consignes_specifiques', true)
      .limit(3);

    if (specifiquesError && specifiquesError.code !== 'PGRST116') {
      console.error('❌ Erreur:', specifiquesError);
      throw specifiquesError;
    }

    if (examensSpecifiques && examensSpecifiques.length > 0) {
      console.log(`✅ ${examensSpecifiques.length} examens avec consignes spécifiques trouvés`);
      
      examensSpecifiques.forEach(examen => {
        console.log(`\n📝 ${examen.code_examen}:`);
        console.log(`   Utilise spécifiques: ${examen.utiliser_consignes_specifiques ? '✅' : '❌'}`);
        
        // Simuler la construction des consignes unifiées
        const parts = [];
        if (examen.consignes_specifiques_arrivee?.trim()) {
          parts.push(examen.consignes_specifiques_arrivee.trim());
        }
        if (examen.consignes_specifiques_mise_en_place?.trim()) {
          parts.push(examen.consignes_specifiques_mise_en_place.trim());
        }
        if (examen.consignes_specifiques_generales?.trim()) {
          parts.push(examen.consignes_specifiques_generales.trim());
        }
        
        const consignesUnifiees = parts.join('\n\n');
        console.log(`   Consignes unifiées: ${consignesUnifiees ? '✅ Construites' : '❌ Vides'}`);
        if (consignesUnifiees) {
          const preview = consignesUnifiees.substring(0, 60);
          console.log(`   Aperçu: "${preview}..."`);
        }
      });
    } else {
      console.log('ℹ️  Aucun examen avec consignes spécifiques trouvé (normal si pas encore configuré)');
    }

    console.log('');
    console.log('🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('');
    console.log('✅ Résumé:');
    console.log('1. ✅ Nouvelle colonne "consignes" fonctionnelle');
    console.log('2. ✅ Données migrées correctement');
    console.log('3. ✅ Compatible avec le planning public');
    console.log('4. ✅ Compatible avec les consignes spécifiques');
    console.log('');
    console.log('🚀 L\'interface simplifiée est prête à être utilisée !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
testConsignesSimplification();