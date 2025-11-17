# Résumé des corrections - Disponibilités

## Problèmes corrigés

### 1. ✅ Disponibilités supprimées qui réapparaissent

**Correction** : Ajout du filtre `.is('deleted_at', null)` dans 7 fonctions différentes pour exclure les soumissions supprimées.

**Fichiers modifiés** :
- `lib/api.ts` (4 fonctions)
- `lib/exportData.ts` (2 fonctions)
- `lib/submissionService.ts` (1 fonction)

### 2. ✅ Téléphone non obligatoire

**Correction** : 
- Retrait de l'attribut `disabled` du champ téléphone
- Ajout d'une validation JavaScript explicite avec message d'erreur

**Fichier modifié** :
- `components/public/AvailabilityForm.tsx`

## Comment tester

### Test 1 : Téléphone obligatoire
1. Aller sur le formulaire de disponibilités
2. Entrer un email sans remplir le téléphone
3. Cliquer sur "Vérifier mon email"
4. ✅ **Résultat attendu** : Message d'erreur "Veuillez renseigner votre numéro de GSM"

### Test 2 : Disponibilités supprimées
1. Soumettre des disponibilités avec un email (ex: test@uclouvain.be)
2. Aller dans l'admin et supprimer cette soumission
3. Retourner sur le formulaire avec le même email
4. Ouvrir la console du navigateur (F12)
5. ✅ **Résultat attendu** : 
   - Log "❌ Aucune soumission existante trouvée"
   - Aucune disponibilité pré-cochée
   - Compteur affiche "0 créneaux sélectionnés"

### Test 3 : Cache navigateur
Si les données apparaissent encore :
1. Ouvrir DevTools (F12)
2. Application → Local Storage
3. Supprimer `availabilityFormProgress`
4. Rafraîchir avec Ctrl+F5
5. Retester

## Outils de débogage créés

### 1. `DEBUG-DISPONIBILITES.md`
Guide complet de débogage avec :
- Instructions étape par étape
- Scénarios possibles et solutions
- Vérifications à effectuer

### 2. `debug-disponibilites.sql`
Script SQL pour vérifier dans la base de données :
- Statut des soumissions (active/supprimée)
- Détail des disponibilités
- Comptage des soumissions

### 3. Logs console
Logs ajoutés dans le code pour tracer :
- Quand une soumission est trouvée
- Nombre de disponibilités chargées
- Quand aucune soumission n'existe

## Prochaines étapes

Si le problème persiste après ces corrections :

1. **Vérifier la console** : Regarder les logs pour comprendre ce qui est chargé
2. **Exécuter le SQL** : Vérifier directement dans la base de données
3. **Vider le cache** : Supprimer Local Storage et rafraîchir
4. **Tester avec un nouvel email** : Isoler le problème

## Notes techniques

### Soft Delete
Le système utilise un soft delete (colonne `deleted_at`) :
- `deleted_at IS NULL` → Soumission active
- `deleted_at IS NOT NULL` → Soumission supprimée

### Contrainte unique
La table a une contrainte unique sur `(session_id, email)` :
- Une seule soumission active par email et par session
- Les soumissions supprimées ne comptent pas dans cette contrainte

### Upsert
Lors de la soumission, le système fait un UPSERT :
- Si une soumission active existe → UPDATE
- Sinon → INSERT
- Les soumissions supprimées sont ignorées (considérées comme inexistantes)
