# Guide d'import des surveillants

## 📋 Structure de la table surveillants

La table a été mise à jour pour inclure toutes les colonnes du fichier CSV :

### Colonnes principales
- `nom` : Nom de famille
- `prenom` : Prénom
- `email` : Email (unique)
- `type` : Type de surveillant (assistant, pat, jobiste, autre)
- `telephone` : Numéro de téléphone (à compléter manuellement)

### Affectations
- `affectation_faculte` : Faculté (FASB, FSP, MEDE, ASS, FSM, etc.)
- `affectation_institut` : Institut (LDRI, IRSS, IREC, IONS, etc.)
- `statut_salarial` : Statut (ST, PX, etc.)

### ETP (Équivalent Temps Plein)
- `etp_total` : ETP total
- `etp_recherche` : ETP recherche
- `etp_autre` : ETP autre activité

### Quota et disponibilité
- `quota_surveillances` : Nombre de surveillances théoriques (calculé automatiquement : 6 × ETP total)
- `categorie_presence` : Catégorie de présence/absence
- `fin_absence` : Date de fin d'absence
- `fin_repos_postnatal` : Date de fin de repos postnatal
- `type_occupation` : Type d'occupation

### Statut
- `is_active` : Actif ou non
- `created_at` : Date de création

## 🚀 Étapes d'installation dans Supabase

### 1. Mettre à jour la structure de la table

Exécutez le script `supabase-update-surveillants-table.sql` dans Supabase SQL Editor :

```sql
-- Ce script va :
-- - Supprimer les données de test
-- - Ajouter toutes les nouvelles colonnes
-- - Renommer l'ancienne colonne etp en etp_total
-- - Supprimer l'ancienne colonne quota_defaut
```

### 2. Insérer les données des surveillants

#### 2a. Insérer les assistants

Exécutez le script `supabase-insert-surveillants.sql` dans Supabase SQL Editor :

```sql
-- Ce script va insérer les 93 assistants du fichier CSV
-- avec toutes leurs informations
-- Quota calculé automatiquement : 6 × ETP total
```

#### 2b. Insérer les PAT

Exécutez le script `supabase-insert-pat.sql` dans Supabase SQL Editor :

```sql
-- Ce script va insérer les 75 PAT du fichier CSV
-- avec toutes leurs informations
-- Quota par défaut = 0 (à ajuster manuellement)
```

## 📥 Import via l'interface web

Vous pouvez également importer des surveillants via l'interface d'administration :

1. Allez dans **Admin** → **Surveillants**
2. Cliquez sur **Importer des surveillants**
3. Sélectionnez votre fichier CSV (format avec séparateur `;`)
4. Le système va :
   - Parser automatiquement toutes les colonnes
   - Calculer le quota de surveillances (6 × ETP total)
   - Convertir les dates au format ISO
   - Créer les surveillants dans la base

### Format CSV attendu

```
Nom;Prénom;Affect.fac;Affect.ins;StSal;EFT T.;EFT R.;EFT A.;Texte cat. prés./abs.;Fin Absc.;Fin R. Pos;D. Type oc;Mails
```

## ✏️ Fonctionnalités disponibles

### Dans l'interface d'administration

- ✅ **Ajouter** un surveillant manuellement
- ✅ **Modifier** les informations d'un surveillant
- ✅ **Supprimer** un surveillant
- ✅ **Filtrer** par faculté, type, statut
- ✅ **Trier** par nom, prénom, email, quota
- ✅ **Rechercher** par nom, prénom ou email
- ✅ **Importer** en masse depuis CSV/Excel
- ✅ **Compléter** le numéro de téléphone
- ✅ **Ajuster** manuellement le quota de surveillances

### Calcul automatique du quota

Le quota de surveillances est calculé automatiquement :
- **Formule** : `quota_surveillances = ROUND(etp_total × 6)`
- **Exemples** :
  - ETP 1.0 → 6 surveillances
  - ETP 0.8 → 5 surveillances
  - ETP 0.5 → 3 surveillances
  - ETP 0.33 → 2 surveillances
  - ETP 0.2 → 1 surveillance

Vous pouvez ensuite ajuster ce quota manuellement si nécessaire.

## 📊 Données importées

### Assistants (93 personnes)
Le fichier `supabase-insert-surveillants.sql` contient **93 surveillants** de type assistant avec :
- Toutes les facultés (FASB, FSP, MEDE, ASS, FSM)
- Différents instituts (LDRI, IRSS, IREC, IONS, DDUV, IPSY, IACS, IMCN)
- Différents ETP (de 0.15 à 1.0)
- Quotas calculés automatiquement (de 1 à 6 surveillances selon ETP)
- Informations sur les absences et congés maternité

### PAT - Personnel Administratif et Technique (75 personnes)
Le fichier `supabase-insert-pat.sql` contient **75 PAT** avec :
- Toutes les facultés (FASB, FSP, MEDE, ASS, FSM)
- Différents ETP (de 0.35 à 1.0)
- **Quota par défaut = 0** (à ajuster manuellement si nécessaire)
- Informations sur les crédits temps, mi-temps médicaux, etc.

## 🔍 Vérification

Après l'import, vérifiez dans Supabase :

1. **Table Editor** → `surveillants`
2. Vous devriez voir **168 lignes** au total :
   - 93 assistants (type = 'assistant')
   - 75 PAT (type = 'pat')
3. Toutes les colonnes doivent être remplies (sauf téléphone)
4. Les quotas doivent être :
   - Assistants : calculés automatiquement (1 à 6 selon ETP)
   - PAT : 0 par défaut

Vous pouvez exécuter cette requête pour vérifier :
```sql
SELECT 
    type,
    COUNT(*) as nombre,
    SUM(CASE WHEN quota_surveillances > 0 THEN 1 ELSE 0 END) as avec_quota,
    AVG(quota_surveillances) as quota_moyen
FROM surveillants
GROUP BY type
ORDER BY type;
```

## 📝 Prochaines étapes

1. ✅ Exécuter `supabase-update-policies.sql` (corriger les politiques RLS)
2. ✅ Exécuter `supabase-update-surveillants-table.sql` (ajouter les colonnes)
3. ✅ Exécuter `supabase-insert-surveillants.sql` (93 assistants)
4. ✅ Exécuter `supabase-insert-pat.sql` (75 PAT)
5. ⏳ Compléter les numéros de téléphone manuellement
6. ⏳ Ajuster les quotas des PAT si nécessaire (par défaut = 0)
7. ⏳ Créer une session et des créneaux
8. ⏳ Tester la soumission des disponibilités

## 💡 Notes importantes

### Différence Assistant vs PAT

- **Assistants** : Quota calculé automatiquement (6 × ETP)
  - Exemple : ETP 1.0 → 6 surveillances, ETP 0.5 → 3 surveillances
  
- **PAT** : Quota par défaut = 0
  - Les PAT ne sont pas obligés de faire des surveillances
  - Vous pouvez ajuster manuellement leur quota s'ils souhaitent participer

### Ajustement des quotas

Pour ajuster le quota d'un PAT qui souhaite participer :
```sql
UPDATE surveillants 
SET quota_surveillances = 3 
WHERE email = 'exemple@uclouvain.be';
```

Ou utilisez l'interface d'administration pour modifier individuellement.
