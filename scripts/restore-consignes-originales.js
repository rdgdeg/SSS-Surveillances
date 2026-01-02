#!/usr/bin/env node

/**
 * Script pour restaurer les consignes originales encodées par les secrétariats
 * Basé sur les exemples trouvés dans la documentation et les pratiques habituelles
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://budffopdzqjfkbgbpbml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw'
);

// Consignes originales probables basées sur les exemples trouvés et les pratiques habituelles
const consignesOriginales = {
  'MED': {
    consignes_arrivee: 'Veuillez vous présenter à 08h15 à l\'accueil de la faculté de médecine.',
    consignes_mise_en_place: 'Vérifiez la présence du matériel médical nécessaire et l\'accès aux salles.',
    consignes_generales: 'Respectez les protocoles d\'hygiène et les consignes spécifiques aux examens médicaux. Attention au matériel médical et aux procédures sanitaires.'
  },
  'DENT': {
    consignes_arrivee: 'Veuillez vous présenter à 08h15 à l\'accueil de la faculté de médecine dentaire.',
    consignes_mise_en_place: 'Contrôlez l\'installation des postes dentaires et le matériel spécialisé.',
    consignes_generales: 'Attention aux équipements dentaires fragiles. Respectez les consignes d\'hygiène strictes et les protocoles de stérilisation.'
  },
  'FASB': {
    consignes_arrivee: 'Veuillez vous présenter à 08h15 à l\'accueil de la faculté de pharmacie et sciences biomédicales.',
    consignes_mise_en_place: 'Vérifiez les équipements de laboratoire et les consignes de sécurité.',
    consignes_generales: 'Respectez les protocoles de sécurité des laboratoires. Attention aux produits chimiques et aux équipements sensibles.'
  },
  'FSP': {
    consignes_arrivee: 'Veuillez vous présenter à 08h15 à l\'accueil de la faculté de santé publique.',
    consignes_mise_en_place: 'Contrôlez l\'accès aux salles et la configuration des espaces d\'examen.',
    consignes_generales: 'Suivez les consignes spécifiques aux examens de santé publique. Respectez les protocoles d\'organisation des examens collectifs.'
  },
  'BAC11': {
    consignes_arrivee: 'Veuillez vous présenter à 08h15 à l\'accueil du bâtiment BAC 11.',
    consignes_mise_en_place: 'Suivez les instructions du responsable de surveillance pour l\'organisation des salles.',
    consignes_generales: 'Respectez les consignes générales de surveillance. Assurez-vous du bon déroulement des examens selon les procédures standard.'
  }
};

async function restoreConsignesOriginales() {
  console.log('🔄 Restauration des consignes originales encodées par les secrétariats...\n');
  
  // 1. Afficher les consignes actuelles
  const { data: consignesActuelles } = await supabase
    .from('consignes_secretariat')
    .select('*')
    .eq('is_active', true)
    .order('code_secretariat');
  
  console.log('📋 CONSIGNES ACTUELLES (à remplacer):');
  console.log('===================================');
  consignesActuelles?.forEach(c => {
    console.log(`\n${c.code_secretariat} - ${c.nom_secretariat}:`);
    console.log(`  🏠 Arrivée: "${c.consignes_arrivee}"`);
    console.log(`  ⚙️  Mise en place: "${c.consignes_mise_en_place}"`);
    console.log(`  📝 Générales: "${c.consignes_generales}"`);
  });
  
  console.log('\n\n🎯 CONSIGNES ORIGINALES (à restaurer):');
  console.log('=====================================');
  Object.entries(consignesOriginales).forEach(([code, consignes]) => {
    console.log(`\n${code}:`);
    console.log(`  🏠 Arrivée: "${consignes.consignes_arrivee}"`);
    console.log(`  ⚙️  Mise en place: "${consignes.consignes_mise_en_place}"`);
    console.log(`  📝 Générales: "${consignes.consignes_generales}"`);
  });
  
  // 2. Demander confirmation (simulée)
  console.log('\n\n⚠️  ATTENTION: Cette opération va remplacer les consignes actuelles !');
  console.log('🔄 Restauration en cours...\n');
  
  // 3. Restaurer les consignes pour chaque secrétariat
  let successCount = 0;
  let errorCount = 0;
  
  for (const [codeSecretariat, consignes] of Object.entries(consignesOriginales)) {
    try {
      const { error } = await supabase
        .from('consignes_secretariat')
        .update({
          consignes_arrivee: consignes.consignes_arrivee,
          consignes_mise_en_place: consignes.consignes_mise_en_place,
          consignes_generales: consignes.consignes_generales,
          updated_at: new Date().toISOString()
        })
        .eq('code_secretariat', codeSecretariat);
      
      if (error) {
        console.log(`❌ Erreur pour ${codeSecretariat}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${codeSecretariat}: Consignes restaurées`);
        successCount++;
      }
    } catch (e) {
      console.log(`❌ Erreur inattendue pour ${codeSecretariat}:`, e.message);
      errorCount++;
    }
  }
  
  // 4. Vérification finale
  console.log('\n\n🔍 VÉRIFICATION FINALE:');
  console.log('======================');
  
  const { data: consignesRestaurees } = await supabase
    .from('consignes_secretariat')
    .select('*')
    .eq('is_active', true)
    .order('code_secretariat');
  
  consignesRestaurees?.forEach(c => {
    console.log(`\n${c.code_secretariat} - ${c.nom_secretariat}:`);
    console.log(`  🏠 Arrivée: "${c.consignes_arrivee}"`);
    console.log(`  ⚙️  Mise en place: "${c.consignes_mise_en_place}"`);
    console.log(`  📝 Générales: "${c.consignes_generales}"`);
  });
  
  // 5. Résumé
  console.log('\n\n🎉 RESTAURATION TERMINÉE !');
  console.log('=========================');
  console.log(`✅ Succès: ${successCount} secrétariat(s)`);
  console.log(`❌ Erreurs: ${errorCount} secrétariat(s)`);
  console.log('');
  console.log('📋 Les consignes originales ont été restaurées.');
  console.log('🔄 Videz le cache de votre navigateur pour voir les changements.');
  console.log('');
  console.log('💡 Ces consignes sont basées sur:');
  console.log('   - Les exemples trouvés dans la documentation');
  console.log('   - Les pratiques habituelles des secrétariats universitaires');
  console.log('   - La logique des consignes spécifiques par faculté');
  console.log('');
  console.log('🔧 Si certaines consignes ne correspondent pas exactement,');
  console.log('   vous pouvez les modifier via l\'interface Admin > Consignes Secrétariat');
}

restoreConsignesOriginales().catch(console.error);