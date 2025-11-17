# Corrections des problèmes de disponibilités

## Problèmes identifiés

1. **Disponibilités supprimées réapparaissent** : Quand un admin supprime une disponibilité et que l'utilisateur remet son email, les données supprimées réapparaissent
2. **Numéro de téléphone non demandé** : Le champ téléphone était désactivé (disabled) à l'étape 1 du formulaire

## Corrections apportées

### 1. Filtre des soumissions supprimées (soft delete)

**Problème** : Le système utilise un "soft delete" (colonne `deleted_at`) mais plusieurs fonctions ne filtraient pas les soumissions supprimées.

**Solution** : Ajout du filtre `.is('deleted_at', null)` dans toutes les requêtes qui récupèrent des soumissions :

#### Fichiers modifiés :

**lib/api.ts** :
- `getExistingSubmission()` : Filtre les soumissions supprimées lors de la vérification d'email
- `getSessionStats()` : Exclut les soumissions supprimées des statistiques
- `getDisponibilitesData()` : Filtre les soumissions supprimées dans la liste admin
- `getSubmissionStatusData()` : Exclut les soumissions supprimées du statut

**lib/exportData.ts** :
- `exportDisponibilites()` : Exclut les soumissions supprimées de l'export liste
- `exportDisponibilitesMatriciel()` : Exclut les soumissions supprimées de l'export matriciel

**lib/submissionService.ts** :
- `submitToSupabase()` : Vérifie uniquement les soumissions non supprimées lors de l'upsert
- `getSubmissionByEmail()` : Déjà filtré ✅

### 2. Champ téléphone activé et validation renforcée

**Problème** : Le champ téléphone était `disabled` à l'étape 1 (InfoStep), empêchant les utilisateurs de le modifier s'il était pré-rempli. De plus, la validation HTML5 seule n'était pas suffisamment visible.

**Solution** : 
- Retrait de l'attribut `disabled` du champ téléphone à l'étape 1
- Ajout d'un astérisque rouge pour indiquer que c'est obligatoire à l'étape 0
- Ajout d'une validation JavaScript explicite avec message d'erreur toast

#### Fichier modifié :

**components/public/AvailabilityForm.tsx** :
```tsx
// Validation dans handleEmailCheck
const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du téléphone
    if (!formData.telephone || formData.telephone.trim() === '') {
        toast.error('Veuillez renseigner votre numéro de GSM');
        return;
    }
    // ...
};

// Étape 0 - EmailStep
<label htmlFor="telephone-check" className="...">
  Numéro de GSM <span className="text-red-500">*</span>
</label>

// Étape 1 - InfoStep
<Input 
  name="telephone" 
  type="tel" 
  placeholder="Numéro de GSM *" 
  value={formData.telephone} 
  onChange={onInputChange} 
  required 
  // ❌ disabled retiré
/>
```

## Impact des corrections

### ✅ Disponibilités supprimées ne réapparaissent plus

Quand un admin supprime une disponibilité :
1. La colonne `deleted_at` est remplie avec la date de suppression
2. Toutes les requêtes filtrent maintenant `deleted_at IS NULL`
3. Si l'utilisateur remet son email, aucune donnée supprimée n'est chargée
4. L'utilisateur peut soumettre une nouvelle disponibilité (qui sera une nouvelle entrée)

### ✅ Téléphone modifiable et obligatoire

- Le champ téléphone est maintenant éditable à toutes les étapes
- Les utilisateurs peuvent corriger leur numéro s'il était mal pré-rempli
- Le champ reste obligatoire (required) avec validation HTML5
- Validation JavaScript supplémentaire avec message d'erreur toast clair
- Impossible de passer à l'étape suivante sans renseigner le téléphone

## Comportement du soft delete

Le système utilise un **soft delete** pour conserver l'historique :

### Suppression (soft delete)
```typescript
// Met deleted_at à la date actuelle
await supabase
  .from('soumissions_disponibilites')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id);
```

### Restauration
```typescript
// Remet deleted_at à null
await supabase
  .from('soumissions_disponibilites')
  .update({ deleted_at: null })
  .eq('id', id);
```

### Suppression définitive (hard delete)
```typescript
// Supprime physiquement l'enregistrement
await supabase
  .from('soumissions_disponibilites')
  .delete()
  .eq('id', id);
```

## Tests recommandés

### Test 1 : Suppression et re-soumission
1. Un utilisateur soumet ses disponibilités
2. L'admin supprime cette soumission
3. L'utilisateur retourne sur le formulaire avec le même email
4. ✅ Vérifier qu'aucune donnée n'est pré-remplie (sauf nom/prénom si surveillant enregistré)
5. L'utilisateur soumet de nouvelles disponibilités
6. ✅ Vérifier que c'est une nouvelle soumission (pas une mise à jour de l'ancienne)

### Test 2 : Modification du téléphone
1. Un utilisateur avec un téléphone pré-rempli arrive à l'étape 1
2. ✅ Vérifier que le champ téléphone est éditable
3. Modifier le numéro
4. Soumettre le formulaire
5. ✅ Vérifier que le nouveau numéro est bien enregistré

### Test 3 : Exports
1. Créer plusieurs soumissions
2. Supprimer certaines soumissions
3. Exporter les disponibilités (format liste et matriciel)
4. ✅ Vérifier que seules les soumissions non supprimées apparaissent

### Test 4 : Statistiques
1. Créer plusieurs soumissions
2. Supprimer certaines soumissions
3. Consulter les statistiques de la session
4. ✅ Vérifier que les compteurs n'incluent pas les soumissions supprimées

## Notes importantes

- Les soumissions supprimées restent dans la base de données avec `deleted_at` rempli
- Elles peuvent être restaurées par l'admin via `restoreSoumission(id)`
- Les logs d'audit conservent la trace de toutes les suppressions et restaurations
- Une suppression définitive (hard delete) est possible mais déconseillée pour garder l'historique


## Débogage

Si les problèmes persistent, consultez le guide de débogage détaillé dans `DEBUG-DISPONIBILITES.md`.

### Logs de débogage ajoutés

Des logs console ont été ajoutés dans `handleEmailCheck` pour faciliter le débogage :

```typescript
console.log('📋 Soumission existante trouvée:', {
    id: existingSubmission.id,
    email: existingSubmission.email,
    deleted_at: existingSubmission.deleted_at,
    nb_disponibilites: existingSubmission.historique_disponibilites?.length || 0
});

console.log('📅 Chargement de', existingSubmission.historique_disponibilites.length, 'disponibilités');

console.log('✅ Disponibilités chargées:', Object.keys(existingAvailabilities).filter(id => existingAvailabilities[id].available).length, 'créneaux sélectionnés');

console.log('❌ Aucune soumission existante trouvée pour', formData.email);
```

### Script SQL de débogage

Un script SQL `debug-disponibilites.sql` a été créé pour vérifier directement dans la base de données :
- Toutes les soumissions pour un email donné
- Le statut (active/supprimée) de chaque soumission
- Le détail des disponibilités dans l'historique
- Le comptage des soumissions actives vs supprimées

### Causes possibles si le problème persiste

1. **Cache du navigateur** : Vider le cache et le Local Storage
2. **Cache React Query** : Rafraîchir la page avec Ctrl+F5
3. **Soft delete non appliqué** : Vérifier `deleted_at` dans la base de données
4. **Plusieurs soumissions** : Vérifier qu'il n'y a qu'une seule soumission par email/session
