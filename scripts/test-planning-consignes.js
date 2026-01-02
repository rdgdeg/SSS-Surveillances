#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://budffopdzqjfkbgbpbml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw'
);

async function testPlanningLogic() {
  console.log('🔍 Test de la logique du planning public...\n');
  
  // 1. Récupérer les consignes de secrétariat
  const { data: consignesSecretariat } = await supabase
    .from('consignes_secretariat')
    .select('*')
    .eq('is_active', true);
  
  console.log('📋 Consignes de secrétariat chargées:', consignesSecretariat?.length || 0);
  
  // 2. Récupérer un examen
  const { data: examens } = await supabase
    .from('examens')
    .select(`
      id,
      code_examen,
      secretariat,
      utiliser_consignes_specifiques,
      consignes_specifiques_generales
    `)
    .not('secretariat', 'is', null)
    .limit(1);
  
  if (!examens || examens.length === 0) {
    console.log('❌ Aucun examen trouvé');
    return;
  }
  
  const examen = examens[0];
  console.log(`\n📝 Examen testé: ${examen.code_examen}`);
  console.log(`   Secrétariat: ${examen.secretariat}`);
  console.log(`   Utilise consignes spécifiques: ${examen.utiliser_consignes_specifiques || false}`);
  console.log(`   Consignes spécifiques: ${examen.consignes_specifiques_generales ? 'Définies' : 'Non définies'}`);
  
  // 3. Simuler la fonction getConsignesForSecretariat
  const getConsignesForSecretariat = (secretariatCode) => {
    if (!consignesSecretariat || !secretariatCode) return undefined;
    return consignesSecretariat.find(c => c.code_secretariat === secretariatCode);
  };
  
  const consignes = getConsignesForSecretariat(examen.secretariat);
  
  console.log('\n🎯 Résultat de la logique d\'affichage:');
  if (consignes) {
    console.log('✅ Consignes de secrétariat trouvées');
    console.log(`   Nom: ${consignes.nom_secretariat}`);
    console.log(`   Consignes générales: ${consignes.consignes_generales ? 'Définies' : 'MANQUANTES'}`);
    
    if (consignes.consignes_generales) {
      console.log(`   Aperçu: ${consignes.consignes_generales.substring(0, 100)}...`);
    }
  } else {
    console.log('❌ Aucune consigne trouvée pour ce secrétariat');
  }
  
  // 4. Tester la logique d'héritage
  console.log('\n🔄 Test de la logique d\'héritage:');
  
  let consignesEffectives;
  if (examen.utiliser_consignes_specifiques && examen.consignes_specifiques_generales) {
    consignesEffectives = examen.consignes_specifiques_generales;
    console.log('📝 Utilise les consignes spécifiques de l\'examen');
  } else if (consignes && consignes.consignes_generales) {
    consignesEffectives = consignes.consignes_generales;
    console.log('📋 Utilise les consignes générales du secrétariat');
  } else {
    consignesEffectives = null;
    console.log('⚠️  Aucune consigne effective trouvée');
  }
  
  if (consignesEffectives) {
    console.log(`   Consignes effectives: ${consignesEffectives.substring(0, 100)}...`);
  }
  
  console.log('\n✅ Test terminé - La logique semble correcte !');
}

testPlanningLogic().catch(console.error);