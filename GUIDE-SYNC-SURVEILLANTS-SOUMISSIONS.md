# Guide : Synchroniser les surveillants depuis les soumissions

## Problème

Quelqu'un a soumis ses disponibilités avec un email qui n'est pas reconnu dans la table `surveillants`. Cette personne apparaît dans les disponibilités mais pas dans la liste des surveillants.

## Solution

Utilisez le script `scripts/sync-surveillants-from-soumissions.sql` pour synchroniser automatiquement.

## Étapes

### 1. Identifier les personnes manquantes

Exécutez d'abord l'étape 1 du script pour voir qui est concerné :

```sql
SELECT 
    sd.email,
    sd.nom,
    sd.prenom,
    sd.type_surveillant,
    COUNT(*) as nb_soumissions
FROM soumissions_disponibilites sd
LEFT JOIN surveillants s ON s.email = sd.email
WHERE s.id IS NULL
GROUP BY sd.email, sd.nom, sd.prenom, sd.type_surveillant
ORDER BY sd.email;
```

Cela vous montrera toutes les personnes qui ont soumis des disponibilités mais qui ne sont pas dans la table surveillants.

### 2. Ajouter les surveillants manquants

Décommentez et exécutez l'étape 2 pour les ajouter automatiquement :

```sql
INSERT INTO surveillants (
    email,
    nom,
    prenom,
    type,
    is_active
)
SELECT DISTINCT ON (sd.email)
    sd.email,
    sd.nom,
    sd.prenom,
    sd.type_surveillant,
    true
FROM soumissions_disponibilites sd
LEFT JOIN surveillants s ON s.email = sd.email
WHERE s.id IS NULL
ON CONFLICT (email) DO NOTHING;
```

### 3. Mettre à jour les liens

Décommentez et exécutez l'étape 3 pour lier les soumissions aux surveillants :

```sql
UPDATE soumissions_disponibilites sd
SET surveillant_id = s.id
FROM surveillants s
WHERE sd.email = s.email
AND sd.surveillant_id IS NULL;
```

### 4. Vérifier

Exécutez l'étape 4 pour confirmer que tout est bien synchronisé :

```sql
SELECT 
    COUNT(*) as total_soumissions,
    COUNT(surveillant_id) as soumissions_avec_surveillant,
    COUNT(*) - COUNT(surveillant_id) as soumissions_sans_surveillant
FROM soumissions_disponibilites;
```

Le nombre de `soumissions_sans_surveillant` devrait être 0.

## Cas d'usage

- **Quelqu'un a soumis avec un email non reconnu** : Utilisez ce script pour l'ajouter automatiquement
- **Import de données** : Après un import de soumissions, synchronisez les surveillants
- **Maintenance régulière** : Exécutez périodiquement pour garder les tables synchronisées

## Notes

- Le script utilise `DISTINCT ON (sd.email)` pour éviter les doublons si une personne a soumis plusieurs fois
- Les champs optionnels (affectation_faculte, telephone, etc.) restent NULL et peuvent être complétés manuellement après
- Le surveillant est créé avec `is_active = true` par défaut
- Le type de surveillant est pris depuis `type_surveillant` de la soumission

## Compléter les informations

Après la synchronisation, vous pouvez compléter les informations manquantes :

```sql
UPDATE surveillants
SET 
    affectation_faculte = 'FASB',
    telephone = '+32...',
    quota_surveillances = 10
WHERE email = 'email@example.com';
```
