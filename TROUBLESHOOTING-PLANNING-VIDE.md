# Dépannage : Planning d'examens vide

## Problème

Le planning d'examens accessible depuis l'accueil (`/planning`) n'affiche aucun examen alors qu'il devrait afficher les examens de la session active.

## Diagnostic

### Étape 1 : Vérifier dans la console du navigateur

1. Ouvrez la page `/planning`
2. Ouvrez la console du navigateur (F12)
3. Regardez les logs qui s'affichent :

```
🔍 Recherche des examens pour la session: [ID] [Nom]
✅ Examens récupérés: X examens
📋 Données: [...]
```

### Étape 2 : Vérifier la section debug

En haut de la page, vous devriez voir une section grise avec :
- Session ID
- Nombre d'examens chargés
- État de chargement
- Message d'erreur éventuel

### Étape 3 : Exécuter le script de diagnostic SQL

1. Connectez-vous à Supabase
2. Ouvrez l'éditeur SQL
3. Copiez/collez le contenu de `scripts/diagnose-planning-vide.sql`
4. Exécutez le script

Le script va vérifier :
- ✅ Structure de la table examens
- ✅ Présence d'une session active
- ✅ Nombre d'examens par session
- ✅ Exemples d'examens
- ✅ Permissions RLS
- ✅ Policies
- ✅ Examens orphelins

## Causes possibles et solutions

### 1. Aucune session active

**Symptôme** : Message "Aucune session d'examens active pour le moment"

**Vérification** :
```sql
SELECT * FROM sessions WHERE is_active = true;
```

**Solution** :
```sql
-- Activer une session
UPDATE sessions 
SET is_active = true 
WHERE id = 'votre-session-id';

-- Désactiver les autres sessions
UPDATE sessions 
SET is_active = false 
WHERE id != 'votre-session-id';
```

### 2. Aucun examen dans la session active

**Symptôme** : "Aucun examen planifié pour cette session"

**Vérification** :
```sql
SELECT COUNT(*) 
FROM examens 
WHERE session_id = (SELECT id FROM sessions WHERE is_active = true);
```

**Solution** : Importez ou créez des examens via l'admin (`/admin/examens`)

### 3. Problème de permissions RLS

**Symptôme** : Erreur dans la console ou 0 examens alors qu'il y en a dans la base

**Vérification** :
```sql
-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'examens';

-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'examens';
```

**Solution** :
```sql
-- Créer une policy de lecture publique pour les examens
CREATE POLICY "Allow public read access to examens" 
ON examens FOR SELECT 
USING (true);
```

### 4. Problème de relation cours_id

**Symptôme** : Examens affichés mais sans informations de cours

**Vérification** :
```sql
-- Examens sans cours
SELECT COUNT(*) FROM examens WHERE cours_id IS NULL;

-- Examens avec cours_id invalide
SELECT COUNT(*) 
FROM examens e
LEFT JOIN cours c ON c.id = e.cours_id
WHERE e.cours_id IS NOT NULL AND c.id IS NULL;
```

**Solution** :
```sql
-- Lier les examens aux cours via l'admin
-- Ou supprimer les examens orphelins
DELETE FROM examens WHERE cours_id IS NULL;
```

### 5. Problème de structure de table

**Symptôme** : Erreur SQL "column does not exist"

**Vérification** :
```sql
-- Vérifier les colonnes de la table examens
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'examens';
```

**Colonnes attendues** :
- `id` (uuid)
- `session_id` (uuid)
- `cours_id` (uuid)
- `local` (text)
- `heure_debut` (time)
- `heure_fin` (time)
- `nb_etudiants` (integer)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Note** : Il n'y a PAS de colonne `date` dans la table examens. La date est stockée dans la table `creneaux` ou doit être ajoutée.

### 6. Colonne date manquante

**Symptôme** : Erreur "column e.date does not exist"

**Solution** : Ajouter la colonne date à la table examens
```sql
-- Ajouter la colonne date si elle n'existe pas
ALTER TABLE examens 
ADD COLUMN IF NOT EXISTS date DATE;

-- Mettre à jour avec des dates par défaut ou depuis les créneaux
UPDATE examens 
SET date = CURRENT_DATE 
WHERE date IS NULL;
```

## Vérification finale

Une fois le problème résolu :

1. Rechargez la page `/planning`
2. Vérifiez que les examens s'affichent
3. Vérifiez que la recherche fonctionne
4. Vérifiez que les examens sont groupés par date

## Logs de débogage

Les logs dans la console vous donnent des informations précieuses :

```javascript
// Session trouvée
🔍 Recherche des examens pour la session: abc-123 Session Décembre 2025

// Examens récupérés
✅ Examens récupérés: 15 examens

// Données brutes
📋 Données: [{id: "...", date: "2025-12-15", ...}, ...]

// Erreur
❌ Erreur lors de la récupération des examens: [détails]
```

## Support

Si le problème persiste :
1. Vérifiez tous les points ci-dessus
2. Consultez les logs de la console
3. Exécutez le script de diagnostic SQL
4. Contactez le support avec les informations collectées

## Checklist de vérification

- [ ] Une session est active (is_active = true)
- [ ] La session contient des examens
- [ ] Les examens ont un cours_id valide
- [ ] La table examens a une colonne date
- [ ] Les permissions RLS permettent la lecture publique
- [ ] Aucune erreur dans la console du navigateur
- [ ] La section debug affiche le bon nombre d'examens
