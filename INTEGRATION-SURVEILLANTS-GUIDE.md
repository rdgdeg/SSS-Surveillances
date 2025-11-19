# Guide d'intégration des Surveillants par Auditoire

## Fichiers créés

✅ `supabase/migrations/create_examen_auditoires.sql` - Migration SQL (EXÉCUTÉE)
✅ `components/admin/ExamenAuditoiresManager.tsx` - Composant de gestion
✅ `components/admin/ExamenAuditoiresModal.tsx` - Modal pour l'interface
✅ `SURVEILLANTS-PAR-AUDITOIRE-GUIDE.md` - Documentation complète

## Intégration dans ExamList

### Étape 1 : Ajouter une colonne "Surveillants"

Dans `components/admin/ExamList.tsx`, après la colonne "Secrétariat", ajoutez :

```tsx
{/* En-tête */}
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Surveillants
</th>

{/* Dans le corps du tableau, pour chaque examen */}
<td className="px-6 py-4 whitespace-nowrap">
  <button
    onClick={() => setShowAuditoiresModal({ id: examen.id, nom: examen.nom_examen })}
    className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
  >
    <Users className="h-4 w-4" />
    Gérer
  </button>
</td>
```

### Étape 2 : Ajouter le modal à la fin du composant

Avant le dernier `</div>` de fermeture :

```tsx
{/* Modal Auditoires */}
{showAuditoiresModal && (
  <ExamenAuditoiresModal
    examenId={showAuditoiresModal.id}
    examenNom={showAuditoiresModal.nom}
    onClose={() => setShowAuditoiresModal(null)}
  />
)}
```

## Intégration dans le Planning Public

### Mettre à jour ExamSchedulePage.tsx

Remplacer la section placeholder des surveillants par :

```tsx
// 1. Ajouter la requête pour charger les auditoires
const { data: auditoires } = useQuery({
  queryKey: ['examen-auditoires', examen.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('v_examen_auditoires_with_surveillants')
      .select('*')
      .eq('examen_id', examen.id);
    if (error) throw error;
    return data;
  },
});

// 2. Remplacer le placeholder par l'affichage réel
<div className="md:w-64 space-y-2">
  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
    Surveillants
  </p>
  {auditoires && auditoires.length > 0 ? (
    auditoires.map((aud) => (
      <div key={aud.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {aud.auditoire}
        </p>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {aud.surveillants_noms && aud.surveillants_noms.length > 0 ? (
            aud.surveillants_noms.map((nom, idx) => (
              <div key={idx}>• {nom}</div>
            ))
          ) : (
            <span className="italic">Aucun surveillant assigné</span>
          )}
        </div>
      </div>
    ))
  ) : (
    <p className="text-xs text-amber-600 dark:text-amber-500">
      Session en cours d'attribution
    </p>
  )}
</div>
```

## Recherche par surveillant

### Ajouter la fonctionnalité de recherche

```tsx
// Filtrer les examens par surveillant
const filteredExamens = examens?.filter(examen => {
  if (!searchTerm) return true;
  
  const search = searchTerm.toLowerCase();
  
  // Recherche dans les surveillants
  const auditoires = examen.auditoires || [];
  const hasSurveillant = auditoires.some(aud => 
    aud.surveillants_noms?.some(nom => 
      nom.toLowerCase().includes(search)
    )
  );
  
  return (
    coursCode.includes(search) ||
    coursIntitule.includes(search) ||
    local.includes(search) ||
    hasSurveillant
  );
});
```

## Test de l'intégration

### 1. Tester la gestion des auditoires

1. Allez dans `/admin/examens`
2. Cliquez sur "Gérer" dans la colonne Surveillants
3. Ajoutez un auditoire (ex: "Auditoire A")
4. Sélectionnez des surveillants
5. Vérifiez que ça sauvegarde

### 2. Tester l'affichage public

1. Allez sur `/planning`
2. Vérifiez que les surveillants s'affichent
3. Testez la recherche par nom de surveillant

### 3. Tester les cas limites

- Examen sans auditoire
- Auditoire sans surveillant
- Examen avec plusieurs auditoires
- Recherche avec nom partiel

## Requêtes SQL utiles

### Voir tous les auditoires avec surveillants

```sql
SELECT * FROM v_examen_auditoires_with_surveillants;
```

### Trouver les examens d'un surveillant

```sql
SELECT e.*, ea.auditoire
FROM examens e
JOIN examen_auditoires ea ON ea.examen_id = e.id
WHERE 'surveillant-uuid' = ANY(ea.surveillants);
```

### Statistiques par examen

```sql
SELECT 
  e.code_examen,
  e.nom_examen,
  COUNT(ea.id) as nb_auditoires,
  SUM(array_length(ea.surveillants, 1)) as nb_surveillants_total
FROM examens e
LEFT JOIN examen_auditoires ea ON ea.examen_id = e.id
GROUP BY e.id, e.code_examen, e.nom_examen;
```

## Dépannage

### Les surveillants ne s'affichent pas

1. Vérifiez que la migration SQL a été exécutée
2. Vérifiez les permissions RLS
3. Vérifiez la console pour les erreurs
4. Testez la requête SQL directement dans Supabase

### Le modal ne s'ouvre pas

1. Vérifiez que l'import est correct
2. Vérifiez que l'état `showAuditoiresModal` est bien défini
3. Vérifiez la console pour les erreurs

### Les modifications ne se sauvegardent pas

1. Vérifiez les permissions RLS
2. Vérifiez que les UUIDs des surveillants sont corrects
3. Regardez les erreurs dans la console réseau

## Prochaines améliorations

1. **Export** : Ajouter l'export des surveillants dans le CSV
2. **Import** : Permettre l'import des affectations
3. **Notifications** : Envoyer des emails aux surveillants
4. **Conflits** : Détecter les conflits d'horaires
5. **Statistiques** : Dashboard des affectations
6. **Historique** : Logger les changements

## Support

Pour toute question :
- Consultez `SURVEILLANTS-PAR-AUDITOIRE-GUIDE.md`
- Vérifiez la migration SQL
- Testez les requêtes dans Supabase
- Contactez : 02/436.16.89
