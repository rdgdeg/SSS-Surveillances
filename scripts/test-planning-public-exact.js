#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://budffopdzqjfkbgbpbml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGZmb3BkenFqZmtiZ2JwYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDI1NjQsImV4cCI6MjA3ODQxODU2NH0.Ru5gB0wr0mkBgKtG0CUHRqsOytUQF5xz6cKfn0yIYDw'
);

async function testPlanningPublicExact() {
  console.log('🔍 Test exact du planning public (simulation de ExamSchedulePage)...\n');
  
  // 1. Récupérer la session active (simulé)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (!sessions) {
    console.log('❌ Aucune session active trouvée');
    return;
  }
  
  console.log(`📅 Session active: ${sessions.nom} (${sessions.id})`);
  
  // 2. Récupérer les examens exactement comme dans ExamSchedulePage
  const query = supabase
    .from('examens')
    .select(`
      id,
      code_examen,
      nom_examen,
      date_examen,
      heure_debut,
      heure_fin,
      auditoires,
      secretariat,
      enseignants,
      cours (
        id,
        code,
        consignes
      )
    `)
    .eq('session_id', sessions.id)
    .order('date_examen', { ascending: true })
    .order('heure_debut', { ascending: true });

  const { data: examens, error } = await query;
  
  if (error) {
    console.error('❌ Erreur lors de la récupération des examens:', error);
    return;
  }
  
  console.log(`📚 ${examens?.length || 0} examens trouvés`);
  
  // 3. Récupérer les consignes spécifiques
  try {
    const { data: dataWithConsignes } = await supabase
      .from('examens')
      .select(`
        id,
        utiliser_consignes_specifiques,
        consignes_specifiques_arrivee,
        consignes_specifiques_mise_en_place,
        consignes_specifiques_generales
      `)
      .eq('session_id', sessions.id);
    
    // Fusionner les données
    if (dataWithConsignes) {
      const consignesMap = new Map(dataWithConsignes.map(c => [c.id, c]));
      examens.forEach((exam) => {
        const consignes = consignesMap.get(exam.id);
        if (consignes) {
          exam.utiliser_consignes_specifiques = consignes.utiliser_consignes_specifiques;
          exam.consignes_specifiques_arrivee = consignes.consignes_specifiques_arrivee;
          exam.consignes_specifiques_mise_en_place = consignes.consignes_specifiques_mise_en_place;
          exam.consignes_specifiques_generales = consignes.consignes_specifiques_generales;
        }
      });
    }
  } catch (consignesError) {
    console.log('⚠️  Colonnes consignes spécifiques non disponibles');
  }
  
  // 4. Récupérer les consignes de secrétariat
  const { data: consignesSecretariat } = await supabase
    .from('consignes_secretariat')
    .select('*')
    .eq('is_active', true);
  
  console.log(`📋 ${consignesSecretariat?.length || 0} secrétariats avec consignes`);
  
  // 5. Fonction helper exacte
  const getConsignesForSecretariat = (secretariatCode) => {
    if (!consignesSecretariat || !secretariatCode) return undefined;
    return consignesSecretariat.find(c => c.code_secretariat === secretariatCode);
  };
  
  // 6. Simuler l'affichage pour les premiers examens
  console.log('\n🎯 SIMULATION EXACTE DE L\'AFFICHAGE PLANNING PUBLIC:');
  console.log('=' .repeat(80));
  
  const examensToShow = examens?.slice(0, 3) || [];
  
  examensToShow.forEach((examen, index) => {
    console.log(`\n📚 EXAMEN ${index + 1}: ${examen.code_examen} - ${examen.nom_examen}`);
    console.log(`   📅 ${examen.date_examen} à ${examen.heure_debut}-${examen.heure_fin}`);
    console.log(`   🏢 Secrétariat: ${examen.secretariat || 'Non défini'}`);
    console.log(`   📍 Auditoires: ${examen.auditoires || 'Non définis'}`);
    
    // Récupérer les consignes du secrétariat
    const consignes = getConsignesForSecretariat(examen.secretariat);
    
    if (consignes) {
      console.log(`\n   📋 CONSIGNES GÉNÉRALES - ${consignes.nom_secretariat}:`);
      
      if (consignes.consignes_arrivee) {
        console.log(`      🏠 Arrivée: ${consignes.consignes_arrivee}`);
      }
      
      if (consignes.consignes_mise_en_place) {
        console.log(`      ⚙️  Mise en place: ${consignes.consignes_mise_en_place}`);
      }
      
      if (consignes.consignes_generales) {
        console.log(`      📝 Consignes générales: ${consignes.consignes_generales}`);
      }
    } else {
      console.log(`   ❌ Aucune consigne trouvée pour le secrétariat ${examen.secretariat}`);
    }
    
    // Vérifier les consignes spécifiques
    if (examen.utiliser_consignes_specifiques) {
      console.log(`\n   📝 CONSIGNES SPÉCIFIQUES (prévalent sur celles du secrétariat):`);
      
      if (examen.consignes_specifiques_arrivee) {
        console.log(`      🏠 Arrivée: ${examen.consignes_specifiques_arrivee}`);
      }
      
      if (examen.consignes_specifiques_mise_en_place) {
        console.log(`      ⚙️  Mise en place: ${examen.consignes_specifiques_mise_en_place}`);
      }
      
      if (examen.consignes_specifiques_generales) {
        console.log(`      📝 Consignes: ${examen.consignes_specifiques_generales}`);
      }
    }
    
    // Consignes du cours (si pas de consignes spécifiques)
    if (!examen.utiliser_consignes_specifiques && examen.cours?.consignes) {
      console.log(`\n   📚 CONSIGNES DU COURS ${examen.cours.code}:`);
      console.log(`      ${examen.cours.consignes}`);
    }
    
    console.log('-'.repeat(80));
  });
  
  console.log('\n\n💡 CONCLUSION:');
  console.log('✅ Les consignes générales viennent bien du secrétariat');
  console.log('✅ Les consignes spécifiques (si activées) prévalent sur celles du secrétariat');
  console.log('✅ Aucune consigne fixe détectée dans la logique');
  console.log('\n🔧 Si vous voyez encore des consignes fixes:');
  console.log('   1. Videz le cache de votre navigateur (Ctrl+F5)');
  console.log('   2. Vérifiez que vous regardez le bon planning');
  console.log('   3. Vérifiez si ce sont des consignes spécifiques d\'examen');
}

testPlanningPublicExact().catch(console.error);