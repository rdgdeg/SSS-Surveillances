# Guide de Migration - Ajout des Timestamps et Historique

## 📋 Vue d'ensemble

Cette migration ajoute le suivi des dates de soumission et de modification des disponibilités, ainsi qu'un historique léger des modifications.

## ✨ Nouvelles fonctionnalités

### 1. Timestamps automatiques
- **`submitted_at`** : Date et heure de la première soumission (déjà existant)
- **`updated_at`** : Date et heure de la dernière modification (nouveau)
- Mise à jour automatique via trigger PostgreSQL

### 2. Historique des modifications
- **`historique_modifications`** : Array JSONB contenant l'historique
- Chaque entrée contient :
  - `date` : Date et heure de la modification
  - `type` : Type de modification ('modification' ou 'creation')
  - `nb_creneaux` : Nombre de créneaux sélectionnés

### 3. Affichage dans le formulaire
- Bannière d'information affichant :
  - Date de première soumission
  - Date de dernière modification (si différente)
  - Nombre de modifications effectuées
- Affichage uniquement lors de la modification d'une soumission existante

## 🚀 Installation

### Étape 1 : Appliquer la migration SQL

Connectez-vous à votre base de données Supabase et exécutez le fichier :

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase-add-timestamps.sql
```

Ou via l'interface Supabase :
1. Allez dans **SQL Editor**
2. Copiez le contenu de `supabase-add-timestamps.sql`
3. Exécutez le script

### Étape 2 : Vérifier l'installation

```sql
-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'soumissions_disponibilites' 
AND column_name IN ('updated_at', 'historique_modifications');

-- Vérifier que les triggers sont actifs
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'soumissions_disponibilites';
```

## 📊 Structure des données

### Exemple d'historique_modifications

```json
[
  {
    "date": "2025-01-11T10:30:00Z",
    "type": "modification",
    "nb_creneaux": 15
  },
  {
    "date": "2025-01-12T14:20:00Z",
    "type": "modification",
    "nb_creneaux": 18
  }
]
```

## 🎨 Interface utilisateur

### Bannière d'information

Lorsqu'un utilisateur modifie ses disponibilités, il voit :

```
📅 Première soumission : 11/01/2025 à 10:30
   Dernière modification : 12/01/2025 à 14:20 [2 modifications]
```

## 🔧 Fonctionnement technique

### Triggers automatiques

1. **`update_soumissions_updated_at`**
   - Se déclenche avant chaque UPDATE
   - Met à jour automatiquement `updated_at` avec l'heure actuelle

2. **`track_soumissions_modifications`**
   - Se déclenche avant chaque UPDATE
   - Ajoute une entrée dans `historique_modifications` si les disponibilités ont changé
   - Calcule automatiquement le nombre de créneaux sélectionnés

### Rétrocompatibilité

- Les enregistrements existants sont automatiquement mis à jour avec `updated_at = submitted_at`
- L'historique commence à partir de l'application de la migration
- Aucune modification du code existant n'est nécessaire (sauf pour l'affichage)

## 🧪 Tests

### Test 1 : Nouvelle soumission
```sql
-- Insérer une nouvelle soumission
INSERT INTO soumissions_disponibilites (session_id, email, nom, prenom, type_surveillant, historique_disponibilites)
VALUES ('session-uuid', 'test@uclouvain.be', 'Test', 'User', 'assistant', '[{"creneau_id": "creneau-1", "est_disponible": true}]');

-- Vérifier les timestamps
SELECT submitted_at, updated_at FROM soumissions_disponibilites WHERE email = 'test@uclouvain.be';
-- Résultat attendu : submitted_at = updated_at
```

### Test 2 : Modification
```sql
-- Modifier la soumission
UPDATE soumissions_disponibilites 
SET historique_disponibilites = '[{"creneau_id": "creneau-1", "est_disponible": true}, {"creneau_id": "creneau-2", "est_disponible": true}]'
WHERE email = 'test@uclouvain.be';

-- Vérifier les timestamps et l'historique
SELECT submitted_at, updated_at, historique_modifications 
FROM soumissions_disponibilites 
WHERE email = 'test@uclouvain.be';
-- Résultat attendu : updated_at > submitted_at, historique_modifications contient 1 entrée
```

## 📝 Notes importantes

### Performance
- Les triggers sont légers et n'impactent pas significativement les performances
- L'index GIN existant sur `historique_disponibilites` est réutilisé
- Pas d'index supplémentaire nécessaire pour `updated_at` (peu de requêtes de filtrage)

### Stockage
- L'historique est limité aux modifications réelles (pas de duplication)
- Chaque entrée d'historique fait environ 80 bytes
- Impact minimal sur le stockage (< 1KB par soumission avec 10 modifications)

### Maintenance
- Aucune maintenance particulière requise
- L'historique peut être nettoyé si nécessaire :
  ```sql
  UPDATE soumissions_disponibilites 
  SET historique_modifications = '[]'::jsonb 
  WHERE submitted_at < now() - interval '1 year';
  ```

## 🔄 Rollback

Si vous devez annuler la migration :

```sql
-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_soumissions_updated_at ON soumissions_disponibilites;
DROP TRIGGER IF EXISTS track_soumissions_modifications ON soumissions_disponibilites;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS add_modification_history();

-- Supprimer les colonnes (optionnel)
ALTER TABLE soumissions_disponibilites DROP COLUMN IF EXISTS updated_at;
ALTER TABLE soumissions_disponibilites DROP COLUMN IF EXISTS historique_modifications;
```

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.
