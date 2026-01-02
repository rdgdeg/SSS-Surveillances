#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://budffopdzqjfkbgbpbml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw'
);

async function debugConsignesAffichage() {
  console.log('🔍 Debug des consignes affichées dans le planning...\n');
  
  // 1. Récupérer les consignes de secrétariat
  const { data: consignesSecretariat } = await supabase
    .from('consignes_secretariat')
    .select('*')
    .eq('is_active', true);
  
  console.log('📋 Consignes de secrétariat dans la base:');
  consignesSecretariat?.forEach(c => {
    console.log(`\n${c.code_secretariat} - ${c.nom_secretariat}:`);
    console.log(`  🏠 Arrivée: ${c.consignes_arrivee || 'Non définie'}`);
    console.log(`  ⚙️  Mise en place: ${c.consignes_mise_en_place || 'Non définie'}`);
    console.log(`  📝 Générales: ${c.consignes_generales || 'Non définies'}`);
  });
  
  // 2. Récupérer quelques examens avec leurs consignes
  const { data: examens } = await supabase
    .from('examens')
    .select(`
      id,
      code_examen,
      secretariat,
      utiliser_consignes_specifiques,
      consignes_specifiques_arrivee,
      consignes_specifiques_mise_en_place,
      consignes_specifiques_generales
    `)
    .not('secretariat', 'is', null)
    .limit(3);
  
  console.log('\n\n🎯 Simulation de l\'affichage du planning:');
  console.log('=' .repeat(60));
  
  examens?.forEach((examen, index) => {
    console.log(`\n📚 EXAMEN ${index + 1}: ${examen.code_examen}`);
    console.log(`   Secrétariat: ${examen.secretariat}`);
    
    // Récupérer les consignes du secrétariat
    const consignesSecrétariat = consignesSecretariat?.find(c => c.code_secretariat === examen.secretariat);
    
    if (consignesSecrétariat) {
      console.log(`\n   📋 CONSIGNES GÉNÉRALES (du secrétariat ${examen.secretariat}):`);
      console.log(`      Nom: ${consignesSecrétariat.nom_secretariat}`);
      console.log(`      🏠 Arrivée: ${consignesSecrétariat.consignes_arrivee || 'Non définie'}`);
      console.log(`      ⚙️  Mise en place: ${consignesSecrétariat.consignes_mise_en_place || 'Non définie'}`);
      console.log(`      📝 Générales: ${consignesSecrétariat.consignes_generales || 'Non définies'}`);
    } else {
      console.log(`   ❌ Aucune consigne trouvée pour le secrétariat ${examen.secretariat}`);
    }
    
    // Vérifier les consignes spécifiques
    if (examen.utiliser_consignes_specifiques) {
      console.log(`\n   📝 CONSIGNES SPÉCIFIQUES (de l'examen):`);
      console.log(`      🏠 Arrivée: ${examen.consignes_specifiques_arrivee || 'Non définie'}`);
      console.log(`      ⚙️  Mise en place: ${examen.consignes_specifiques_mise_en_place || 'Non définie'}`);
      console.log(`      📝 Générales: ${examen.consignes_specifiques_generales || 'Non définies'}`);
      console.log(`      ⚠️  Les consignes spécifiques PRÉVALENT sur celles du secrétariat`);
    } else {
      console.log(`\n   ✅ Utilise les consignes générales du secrétariat (pas de consignes spécifiques)`);
    }
    
    console.log(`\n   🎯 CE QUI S'AFFICHE DANS LE PLANNING:`);
    if (examen.utiliser_consignes_specifiques) {
      console.log(`      Source: Consignes spécifiques de l'examen`);
      console.log(`      Arrivée: ${examen.consignes_specifiques_arrivee || consignesSecrétariat?.consignes_arrivee || 'Non définie'}`);
      console.log(`      Mise en place: ${examen.consignes_specifiques_mise_en_place || consignesSecrétariat?.consignes_mise_en_place || 'Non définie'}`);
      console.log(`      Générales: ${examen.consignes_specifiques_generales || consignesSecrétariat?.consignes_generales || 'Non définies'}`);
    } else {
      console.log(`      Source: Consignes du secrétariat ${examen.secretariat}`);
      console.log(`      Arrivée: ${consignesSecrétariat?.consignes_arrivee || 'Non définie'}`);
      console.log(`      Mise en place: ${consignesSecrétariat?.consignes_mise_en_place || 'Non définie'}`);
      console.log(`      Générales: ${consignesSecrétariat?.consignes_generales || 'Non définies'}`);
    }
    
    console.log('-'.repeat(60));
  });
  
  console.log('\n\n💡 RÉSUMÉ:');
  console.log('- Les CONSIGNES GÉNÉRALES viennent du secrétariat (sauf si consignes spécifiques activées)');
  console.log('- Les CONSIGNES SPÉCIFIQUES sont définies par examen et prévalent sur celles du secrétariat');
  console.log('- Si vous voyez des consignes fixes, vérifiez si ce sont des consignes spécifiques d\'examen');
}

debugConsignesAffichage().catch(console.error);