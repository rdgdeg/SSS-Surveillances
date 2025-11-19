# Dépannage : Planning d'Examens Vide

## Symptôme

Le planning d'examens accessible depuis l'accueil (`/planning`) affiche "Aucun examen planifié pour cette session" alors que des examens existent dans la base de données.

## Diagnostic

### Étape 1 : Vérifier les logs dans la console

1. Ouvrez la page `/planning`
2. Ouvrez la console du navigateur (F12)
3. Regardez les logs qui s'affichent :
   - 🔍 "Recherche des examens pour la session: [ID] [Nom]"
   - ✅ "Examens récupérés: X examens"
   - ❌ Messages d'erreur éventuels

### Étape 2 : Vérifier la section Debug

En haut de la page planning, une section grise affiche :
- **Session ID** : L'ID de la session active
- **Examens chargés** : Le nombre d'examens récupérés
- **Loading** : État du chargement
- **Erreur** : Message d'erreur si présent

### Étape 3 : Exécuter le script de diagnostic SQL

1. Connectez-vous à Supabase
2. Ouvrez l'éditeur SQL
3. Copiez le contenu de `scripts/diagnose-planning-vide.sql`
4. Exécutez le script
5. Analysez les résultats

## Causes possibles et solutions

### ❌ Cause 1 : Aucune session active

**Symptôme** :
- Message : "Aucune session d'examens active pour le moment"
- Ou : Session ID = undefined dans la section debug

**Vérification** :
```sql
SELECT id, name, year, is_active 
FROM sessions 
ORDER BY is_active DESC, created_at DESC;
```

**Solution** :
```sql
-- Activer une session existante
UPDATE sessions 
SET is_active = true 
WHERE id = 'VOTRE_SESSION_ID';

-- Ou créer une nouvelle session
INSERT INTO sessions (name, year, is_active)
VALUES ('Décembre 2025 - Janvier 2026', '2025-2026', true);
```

**Dans l'interface admin** :
1. Allez dans `/admin/sessions`
2. Activez une session existante
3. Ou créez une nouvelle session

---

### ❌ Cause 2 : Aucun examen dans la session active

**Symptôme** :
- Session active détectée
- Mais "Examens chargés: 0"
- Message : "Aucun examen planifié pour cette session"

**Vérification** :
```sql
SELECT COUNT(*) as nb_examens
FROM examens e
JOIN sessions s ON e.session_id = s.id
WHERE s.is_active = true;
```

**Solution** :
```sql
-- Vérifier quelle session est active
SELECT id, name FROM sessions WHERE is_active = true;

-- Vérifier les examens existants
SELECT session_id, COUNT(*) 
FROM examens 
GROUP BY session_id;

-- Si les examens sont dans une autre session, soit :
-- 1. Activer la bonne session
UPDATE sessions SET is_active = false WHERE is_active = true;
UPDATE sessions SET is_active = true WHERE id = 'SESSION_AVEC_EXAMENS';

-- 2. Ou déplacer les examens vers la session active
UPDATE examens 
SET session_id = 'SESSION_ACTIVE_ID' 
WHERE session_id = 'ANCIENNE_SESSION_ID';
```

**Dans l'interface admin** :
1. Allez dans `/admin/examens`
2. Vérifiez que des examens existent
3. Importez des examens si nécessaire
4. Vérifiez qu'ils sont dans la session active

---

### ❌ Cause 3 : Problème de permissions RLS

**Symptôme** :
- Erreur dans la console : "permission denied" ou "row-level security policy"
- Examens chargés: 0 malgré des examens existants

**Vérification** :
```sql
-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'examens';

-- Lister les policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'examens';
```

**Solution** :
```sql
-- Créer une policy permissive pour la lecture publique
CREATE POLICY "Allow public read access to examens" 
ON examens FOR SELECT 
USING (true);

-- Ou désactiver RLS (moins sécurisé)
ALTER TABLE examens DISABLE ROW LEVEL SECURITY;
```

**Note** : La table `examens` doit être accessible en lecture publique pour que le planning fonctionne.

---

### ❌ Cause 4 : Problème de relation cours_id

**Symptôme** :
- Examens chargés mais n'apparaissent pas
- Erreur dans la console liée à la relation cours

**Vérification** :
```sql
-- Examens sans cours
SELECT COUNT(*) 
FROM examens 
WHERE cours_id IS NULL;

-- Examens avec cours_id invalide
SELECT e.id, e.cours_id, e.date
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
WHERE e.cours_id IS NOT NULL AND c.id IS NULL;
```

**Solution** :
```sql
-- Lier les examens orphelins à des cours
-- 1. Voir les examens sans cours
SELECT id, date, local FROM examens WHERE cours_id IS NULL;

-- 2. Voir les cours disponibles
SELECT id, code, intitule_complet FROM cours ORDER BY code;

-- 3. Lier un examen à un cours
UPDATE examens 
SET cours_id = 'COURS_ID' 
WHERE id = 'EXAMEN_ID';
```

**Dans l'interface admin** :
1. Allez dans `/admin/examens`
2. Utilisez l'outil "Lier à un cours" pour les examens orphelins
3. Ou importez les examens avec les cours_id corrects

---

## Checklist de vérification rapide

- [ ] Une session est active (`is_active = true`)
- [ ] Des examens existent dans cette session
- [ ] La table `examens` a une policy RLS permettant la lecture publique
- [ ] Les examens ont un `cours_id` valide (ou NULL est géré)
- [ ] La console du navigateur ne montre pas d'erreur
- [ ] La section debug affiche un nombre d'examens > 0

## Test manuel de la requête

Exécutez cette requête dans Supabase avec l'ID de votre session active :

```sql
SELECT 
    e.id,
    e.date,
    e.heure_debut,
    e.heure_fin,
    e.local,
    e.nb_etudiants,
    c.code as cours_code,
    c.intitule_complet as cours_nom
FROM examens e
LEFT JOIN cours c ON e.cours_id = c.id
JOIN sessions s ON e.session_id = s.id
WHERE s.is_active = true
ORDER BY e.date ASC, e.heure_debut ASC;
```

Si cette requête retourne des résultats, le problème vient probablement des permissions RLS.
Si elle ne retourne rien, vérifiez les causes 1 et 2.

## Solutions rapides

### Solution 1 : Activer une session et vérifier les examens

```sql
-- 1. Activer une session
UPDATE sessions SET is_active = true WHERE name = 'Décembre 2025 - Janvier 2026';

-- 2. Vérifier les examens
SELECT COUNT(*) FROM examens e 
JOIN sessions s ON e.session_id = s.id 
WHERE s.is_active = true;
```

### Solution 2 : Créer une policy RLS permissive

```sql
-- Permettre la lecture publique des examens
CREATE POLICY "Allow public read access to examens" 
ON examens FOR SELECT 
USING (true);
```

### Solution 3 : Importer des examens de test

Via l'interface admin (`/admin/examens`), importez un fichier CSV avec ce format :

```csv
code_cours,date,heure_debut,heure_fin,local,nb_etudiants
LBIR1234,2025-12-15,08:30,10:30,Auditoire A,150
LBIR5678,2025-12-16,14:00,16:00,Auditoire B,80
```

## Support

Si le problème persiste après avoir vérifié toutes ces causes :

1. Vérifiez les logs complets dans la console (F12)
2. Exécutez le script de diagnostic complet
3. Vérifiez les permissions de votre compte Supabase
4. Contactez le support : 02/436.16.89

## Logs utiles pour le débogage

Les logs dans la console vous donnent des informations précieuses :

- ✅ `Examens récupérés: 5 examens` → Tout fonctionne
- ❌ `Examens récupérés: 0 examens` → Vérifier causes 1, 2, 3
- ❌ `Erreur lors de la récupération` → Vérifier cause 3 (RLS)
- ❌ `Pas de session active` → Vérifier cause 1
