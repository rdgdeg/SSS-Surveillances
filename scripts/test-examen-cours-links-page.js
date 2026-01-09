// Script de test pour diagnostiquer la page Liens Examen-Cours
// À exécuter dans la console du navigateur (F12)

console.log('🔍 Diagnostic de la page Liens Examen-Cours');

// 1. Vérifier si nous sommes sur la bonne page
if (!window.location.pathname.includes('examen-cours-links')) {
  console.warn('⚠️ Vous n\'êtes pas sur la page Liens Examen-Cours');
  console.log('📍 Aller sur: /admin/examen-cours-links');
}

// 2. Vérifier les requêtes réseau
console.log('📡 Vérification des requêtes réseau...');
console.log('Ouvrez l\'onglet Network (F12 > Network) et rechargez la page');

// 3. Vérifier les erreurs dans la console
console.log('🐛 Vérification des erreurs...');
console.log('Recherchez les messages d\'erreur en rouge dans cette console');

// 4. Vérifier les données dans le localStorage/sessionStorage
console.log('💾 Vérification du stockage local...');
console.log('Session active:', localStorage.getItem('activeSession'));

// 5. Test de la requête Supabase directement
console.log('🔗 Test de connexion Supabase...');
console.log('Vérifiez que les requêtes vers supabase.co retournent 200 OK');

// 6. Vérifier les éléments DOM
setTimeout(() => {
  console.log('🎯 Vérification des éléments DOM...');
  
  const table = document.querySelector('table');
  const tbody = document.querySelector('tbody');
  const rows = document.querySelectorAll('tbody tr');
  
  console.log('Table trouvée:', !!table);
  console.log('Tbody trouvé:', !!tbody);
  console.log('Nombre de lignes:', rows.length);
  
  if (rows.length === 1) {
    const cellText = rows[0].textContent;
    console.log('Contenu de la ligne unique:', cellText);
    
    if (cellText.includes('Chargement')) {
      console.log('🔄 État: Chargement en cours');
    } else if (cellText.includes('Aucun')) {
      console.log('❌ État: Aucun résultat trouvé');
      console.log('🔧 Solutions possibles:');
      console.log('  1. Vérifier qu\'une session est active');
      console.log('  2. Vérifier qu\'il y a des examens dans la session');
      console.log('  3. Vérifier les permissions Supabase');
      console.log('  4. Vérifier les erreurs réseau');
    } else if (cellText.includes('Erreur')) {
      console.log('💥 État: Erreur détectée');
      console.log('Voir les détails de l\'erreur ci-dessus');
    }
  } else if (rows.length > 1) {
    console.log('✅ État: Données chargées avec succès');
    console.log('Nombre d\'examens affichés:', rows.length);
  }
  
  // Vérifier les statistiques
  const statsCards = document.querySelectorAll('.bg-white.shadow.rounded-lg');
  console.log('Cartes de statistiques trouvées:', statsCards.length);
  
  if (statsCards.length >= 5) {
    const stats = Array.from(statsCards).slice(0, 5).map(card => {
      const label = card.querySelector('dt')?.textContent || 'Unknown';
      const value = card.querySelector('dd')?.textContent || '0';
      return `${label}: ${value}`;
    });
    console.log('📊 Statistiques:', stats);
  }
}, 2000);

console.log('✅ Diagnostic terminé. Vérifiez les messages ci-dessus.');
console.log('📋 Actions recommandées:');
console.log('  1. Vérifier l\'onglet Network pour les erreurs HTTP');
console.log('  2. Vérifier cette console pour les erreurs JavaScript');
console.log('  3. Vérifier que vous êtes connecté en tant qu\'admin');
console.log('  4. Vérifier qu\'une session est active dans l\'application');