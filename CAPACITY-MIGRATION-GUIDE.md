# Guide de Migration - Gestion de la Capacité des Créneaux

## Vue d'ensemble

Ce guide explique comment appliquer les migrations SQL pour ajouter la fonctionnalité de gestion de la capacité des créneaux.

## Prérequis

- Accès à votre projet Supabase
- Droits d'administration sur la base de données

## Étapes d'Installation

### Étape 1 : Ajouter la colonne de capacité

1. Connectez-vous à https://supabase.com
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Copiez et exécutez le contenu du fichier `supabase-add-capacity-column.sql`
5. Cliquez sur **Run**
6. Vérifiez le message de succès

**Ce qui est créé :**
- Colonne `nb_surveillants_requis` dans la table `creneaux`
- Contrainte de validation (valeurs entre 1 et 20)
- Index pour optimiser les performances

### Étape 2 : Créer la vue des statistiques

1. Dans le même **SQL Editor**
2. Copiez et exécutez le contenu du fichier `supabase-create-capacity-view.sql`
3. Cliquez sur **Run**
4. Vérifiez le message de succès

**Ce qui est créé :**
- Vue `v_creneaux_with_stats` qui calcule automatiquement :
  - Le nombre de surveillants disponibles par créneau
  - Le taux de remplissage (pourcentage)
- Index supplémentaire pour optimiser les jointures

## Vérification

### Vérifier la colonne

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'creneaux' 
  AND column_name = 'nb_surveillants_requis';
```

Résultat attendu :
```
column_name              | data_type | is_nullable
-------------------------|-----------|------------
nb_surveillants_requis   | integer   | YES
```

### Vérifier la vue

```sql
-- Tester la vue avec quelques données
SELECT 
  id,
  date_surveillance,
  heure_debut_surveillance,
  nb_surveillants_requis,
  nb_disponibles,
  taux_remplissage
FROM v_creneaux_with_stats
LIMIT 5;
```

### Tester la contrainte

```sql
-- Cette requête devrait échouer (valeur trop grande)
UPDATE creneaux SET nb_surveillants_requis = 25 WHERE id = 'some-id';
-- Erreur attendue: new row violates check constraint "check_nb_surveillants_requis"

-- Cette requête devrait réussir
UPDATE creneaux SET nb_surveillants_requis = 10 WHERE id = 'some-id';
```

## Utilisation

### Définir la capacité d'un créneau

```sql
-- Définir 8 surveillants requis pour un créneau
UPDATE creneaux 
SET nb_surveillants_requis = 8 
WHERE id = 'votre-creneau-id';
```

### Voir les statistiques

```sql
-- Voir tous les créneaux avec leurs statistiques
SELECT 
  date_surveillance,
  heure_debut_surveillance,
  nb_surveillants_requis as requis,
  nb_disponibles as disponibles,
  taux_remplissage as "taux_%"
FROM v_creneaux_with_stats
WHERE nb_surveillants_requis IS NOT NULL
ORDER BY taux_remplissage ASC NULLS LAST;
```

### Identifier les créneaux critiques

```sql
-- Créneaux avec moins de 100% de remplissage
SELECT 
  date_surveillance,
  heure_debut_surveillance,
  nb_surveillants_requis,
  nb_disponibles,
  taux_remplissage
FROM v_creneaux_with_stats
WHERE nb_surveillants_requis IS NOT NULL 
  AND taux_remplissage < 100
ORDER BY taux_remplissage ASC;
```

## Rollback (en cas de problème)

Si vous devez annuler les modifications :

```sql
-- Supprimer la vue
DROP VIEW IF EXISTS v_creneaux_with_stats;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_creneaux_nb_surveillants_requis;

-- Supprimer la contrainte
ALTER TABLE creneaux DROP CONSTRAINT IF EXISTS check_nb_surveillants_requis;

-- Supprimer la colonne
ALTER TABLE creneaux DROP COLUMN IF EXISTS nb_surveillants_requis;
```

## Notes Importantes

1. **Visibilité** : Cette fonctionnalité est uniquement visible dans l'interface admin, jamais pour les surveillants
2. **Performance** : La vue est optimisée mais peut être lente avec beaucoup de données (>10000 créneaux)
3. **Valeurs NULL** : Un créneau sans capacité définie (`NULL`) n'affichera pas de taux de remplissage
4. **Validation** : Les valeurs doivent être entre 1 et 20 (contrainte au niveau base de données)

## Prochaines Étapes

Une fois les migrations appliquées avec succès :

1. ✅ Les colonnes et vues sont prêtes
2. 🔄 Continuer avec la Phase 2 : Modifications du modèle de données TypeScript
3. 🔄 Puis Phase 3 : Fonctions API
4. 🔄 Enfin Phases 4-6 : Interface utilisateur admin

## Support

En cas de problème :
- Vérifiez les logs d'erreur dans Supabase
- Assurez-vous d'avoir les droits nécessaires
- Consultez la documentation Supabase : https://supabase.com/docs
