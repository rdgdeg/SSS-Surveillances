# Guide - Synchronisation des téléphones

## Problème résolu

Lorsqu'un surveillant remplit le formulaire de disponibilités et indique son numéro de téléphone, celui-ci n'était pas visible dans la liste des surveillants de l'admin.

## Solution implémentée

### 1. Ajout de la colonne téléphone

La colonne `telephone` a été ajoutée à la table `soumissions_disponibilites` pour stocker le numéro de téléphone saisi lors de la soumission.

### 2. Synchronisation automatique

Un trigger PostgreSQL synchronise automatiquement le téléphone :
- **Quand** : À chaque nouvelle soumission ou modification
- **Condition** : Si un téléphone est fourni ET que le surveillant existe dans la base
- **Action** : Met à jour le téléphone dans la table `surveillants` (uniquement si vide)

### 3. Migration des données existantes

La migration synchronise également les téléphones déjà présents dans les soumissions vers la table surveillants.

## Comment ça marche

### Flux de données

```
Formulaire de disponibilités
         ↓
   (surveillant remplit son téléphone)
         ↓
soumissions_disponibilites.telephone
         ↓
   (trigger automatique)
         ↓
surveillants.telephone
         ↓
   Visible dans l'admin
```

### Règles de synchronisation

1. **Priorité aux données existantes** : Si un surveillant a déjà un téléphone dans la table `surveillants`, il n'est PAS écrasé
2. **Dernière soumission** : Si plusieurs soumissions existent, c'est le téléphone de la plus récente qui est utilisé
3. **Automatique** : Aucune action manuelle nécessaire

## Vérification

### Voir les téléphones synchronisés

```sql
SELECT 
    s.nom,
    s.prenom,
    s.email,
    s.telephone as telephone_surveillant,
    sub.telephone as telephone_derniere_soumission,
    sub.submitted_at
FROM surveillants s
LEFT JOIN LATERAL (
    SELECT telephone, submitted_at
    FROM soumissions_disponibilites
    WHERE surveillant_id = s.id
    AND telephone IS NOT NULL
    ORDER BY submitted_at DESC
    LIMIT 1
) sub ON true
ORDER BY s.nom;
```

### Forcer une synchronisation manuelle

Si nécessaire, vous pouvez forcer la synchronisation avec le script :

```bash
# Depuis Supabase Dashboard → SQL Editor
# Exécuter le contenu de scripts/sync-telephones.sql
```

## Affichage dans l'interface

Le téléphone est maintenant visible dans :

1. **Liste des surveillants** (SurveillantsPage)
   - Colonne "Téléphone" dans le tableau principal

2. **Disponibilités - Vue par surveillant** (DisponibilitesPage)
   - 📞 sous le nom du surveillant

3. **Disponibilités - Vue par créneau** (DisponibilitesPage)
   - 📞 dans l'en-tête de colonne

## Cas particuliers

### Surveillant sans téléphone

Si un surveillant n'a jamais rempli de téléphone dans aucune soumission :
- La colonne affiche "-" dans la liste
- Aucun téléphone n'apparaît dans les disponibilités

### Mise à jour du téléphone

Si un surveillant change son téléphone dans une nouvelle soumission :
- Le nouveau téléphone est enregistré dans `soumissions_disponibilites`
- Le téléphone dans `surveillants` est mis à jour UNIQUEMENT s'il était vide
- Pour forcer une mise à jour, modifier manuellement dans la liste des surveillants

### Surveillant non lié

Si une soumission n'est pas liée à un surveillant (`surveillant_id` est NULL) :
- Le téléphone est stocké dans la soumission
- Il n'est PAS synchronisé vers la table surveillants
- Il reste visible dans les vues de disponibilités

## Maintenance

### Nettoyer les doublons

Si plusieurs soumissions ont des téléphones différents pour le même surveillant :

```sql
-- Voir les conflits
SELECT 
    surveillant_id,
    COUNT(DISTINCT telephone) as nb_telephones_differents,
    array_agg(DISTINCT telephone) as telephones
FROM soumissions_disponibilites
WHERE surveillant_id IS NOT NULL
AND telephone IS NOT NULL
GROUP BY surveillant_id
HAVING COUNT(DISTINCT telephone) > 1;
```

### Mettre à jour manuellement

Pour forcer la mise à jour d'un téléphone spécifique :

```sql
UPDATE surveillants
SET telephone = '0123456789'
WHERE email = 'lisa.albert@uclouvain.be';
```

## Fichiers modifiés

- `supabase/migrations/sync_telephone_from_soumissions.sql` - Migration principale
- `scripts/sync-telephones.sql` - Script de synchronisation manuelle
- `types.ts` - Ajout de `telephone?` dans `SoumissionDisponibilite`
- `pages/admin/DisponibilitesPage.tsx` - Affichage du téléphone
- `pages/admin/SurveillantsPage.tsx` - Affichage du téléphone (déjà présent)

## Dépannage

### Le téléphone n'apparaît pas

1. Vérifier que la migration a été appliquée :
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'soumissions_disponibilites' 
   AND column_name = 'telephone';
   ```

2. Vérifier que le téléphone est dans la soumission :
   ```sql
   SELECT nom, prenom, telephone, submitted_at
   FROM soumissions_disponibilites
   WHERE email = 'lisa.albert@uclouvain.be'
   ORDER BY submitted_at DESC;
   ```

3. Forcer la synchronisation :
   ```sql
   -- Exécuter scripts/sync-telephones.sql
   ```

### Le trigger ne fonctionne pas

Vérifier que le trigger existe :
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_telephone';
```

Si absent, réappliquer la migration.

## Notes importantes

- ⚠️ La synchronisation ne fonctionne que si `surveillant_id` est renseigné
- ⚠️ Les téléphones existants dans `surveillants` ne sont jamais écrasés
- ✅ La synchronisation est automatique pour toutes les nouvelles soumissions
- ✅ Le téléphone reste visible même si la synchronisation échoue (stocké dans la soumission)
