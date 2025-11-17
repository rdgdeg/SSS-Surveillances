# Guide de débogage - Problème des disponibilités

## Problèmes rapportés

1. **Téléphone non obligatoire** : Le champ téléphone ne semble pas être validé
2. **Disponibilités supprimées apparaissent** : Pour mathilde.akue, 3 disponibilités apparaissent alors que tout est décoché et que les données ont été supprimées depuis l'admin

## Corrections appliquées

### 1. Validation du téléphone renforcée

Ajout d'une validation explicite dans `handleEmailCheck` :

```typescript
// Validation du téléphone
if (!formData.telephone || formData.telephone.trim() === '') {
    toast.error('Veuillez renseigner votre numéro de GSM');
    return;
}
```

Le champ a déjà l'attribut `required` HTML5, mais cette validation JavaScript supplémentaire garantit qu'il ne peut pas être vide.

### 2. Logs de débogage ajoutés

Des logs console ont été ajoutés pour tracer :
- Quand une soumission existante est trouvée
- Le nombre de disponibilités chargées
- Quand aucune soumission n'est trouvée

## Comment déboguer

### Étape 1 : Vérifier dans la console du navigateur

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet Console
3. Entrer l'email `mathilde.akue@uclouvain.be`
4. Regarder les logs :
   - `📋 Soumission existante trouvée:` → Si ce message apparaît, une soumission non supprimée existe
   - `❌ Aucune soumission existante trouvée` → Si ce message apparaît, aucune soumission active n'existe
   - `📅 Chargement de X disponibilités` → Nombre de disponibilités dans l'historique
   - `✅ Disponibilités chargées: X créneaux sélectionnés` → Nombre de créneaux cochés

### Étape 2 : Vérifier dans la base de données

Exécuter le script `debug-disponibilites.sql` dans Supabase SQL Editor :

1. Aller dans Supabase Dashboard
2. SQL Editor
3. Copier-coller les requêtes du fichier `debug-disponibilites.sql`
4. Remplacer `SESSION_ID` par l'ID de la session active (obtenu avec la requête 4)
5. Exécuter chaque requête

**Résultats attendus :**

- **Requête 1** : Devrait montrer toutes les soumissions (actives et supprimées)
  - Si `deleted_at IS NOT NULL` → La soumission est supprimée
  - Si `deleted_at IS NULL` → La soumission est active

- **Requête 2** : Montre le détail des disponibilités dans l'historique

- **Requête 3** : Compte les soumissions actives vs supprimées
  - Devrait montrer 0 soumission active si tout a été supprimé

- **Requête 5** : Simule exactement la requête de `getExistingSubmission`
  - Devrait retourner 0 ligne si tout a été supprimé correctement

### Étape 3 : Vérifier le cache

Le problème peut venir du cache :

#### Cache du navigateur
1. Ouvrir DevTools (F12)
2. Onglet Application (Chrome) ou Storage (Firefox)
3. Vérifier :
   - **Local Storage** → Chercher `availabilityFormProgress`
   - **Session Storage** → Vérifier s'il y a des données
4. Supprimer toutes les données de stockage
5. Rafraîchir la page (Ctrl+F5 ou Cmd+Shift+R)

#### Cache de React Query
Le composant utilise `getExistingSubmission` qui peut être mis en cache par React Query.

**Solution** : Rafraîchir la page complètement (pas juste F5, mais Ctrl+F5)

### Étape 4 : Test avec un nouvel email

Pour isoler le problème :

1. Créer un nouvel email de test (ex: `test.debug@uclouvain.be`)
2. Soumettre des disponibilités
3. Les supprimer depuis l'admin
4. Retourner sur le formulaire avec cet email
5. Vérifier que rien n'apparaît

## Scénarios possibles

### Scénario A : La soumission n'est pas vraiment supprimée

**Symptôme** : La requête SQL 5 retourne une ligne

**Cause** : Le soft delete n'a pas fonctionné ou a été annulé

**Solution** : 
```sql
-- Vérifier le deleted_at
SELECT id, email, deleted_at 
FROM soumissions_disponibilites 
WHERE email = 'mathilde.akue@uclouvain.be';

-- Si deleted_at est NULL, forcer la suppression
UPDATE soumissions_disponibilites 
SET deleted_at = NOW() 
WHERE email = 'mathilde.akue@uclouvain.be' 
  AND deleted_at IS NULL;
```

### Scénario B : Cache du navigateur

**Symptôme** : Les logs console montrent "Aucune soumission trouvée" mais les données apparaissent quand même

**Cause** : Le LocalStorage contient encore les anciennes données

**Solution** :
1. Ouvrir DevTools → Application → Local Storage
2. Supprimer la clé `availabilityFormProgress`
3. Rafraîchir la page

### Scénario C : Plusieurs soumissions pour le même email

**Symptôme** : La requête SQL 1 montre plusieurs lignes

**Cause** : Il existe plusieurs soumissions (normalement impossible avec la contrainte unique)

**Solution** :
```sql
-- Supprimer toutes les soumissions pour cet email
UPDATE soumissions_disponibilites 
SET deleted_at = NOW() 
WHERE email = 'mathilde.akue@uclouvain.be';
```

### Scénario D : Le téléphone est pré-rempli depuis la table surveillants

**Symptôme** : Le champ téléphone est rempli automatiquement

**Cause** : L'email existe dans la table `surveillants` avec un téléphone

**Solution** : C'est le comportement normal. Le champ reste éditable maintenant.

## Vérification finale

Après avoir appliqué les corrections :

1. ✅ Vider le cache du navigateur (Ctrl+Shift+Delete)
2. ✅ Supprimer le Local Storage
3. ✅ Rafraîchir la page (Ctrl+F5)
4. ✅ Entrer l'email sans téléphone → Devrait afficher une erreur
5. ✅ Entrer l'email avec téléphone → Devrait vérifier l'email
6. ✅ Si soumission supprimée → Aucune donnée ne devrait apparaître
7. ✅ Le compteur devrait afficher "0 créneaux sélectionnés"

## Contact

Si le problème persiste après ces vérifications :
1. Copier les résultats des requêtes SQL
2. Copier les logs de la console
3. Faire une capture d'écran de l'interface
