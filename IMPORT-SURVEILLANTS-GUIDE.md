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

Exécutez le script `supabase-insert-surveillants.sql` dans Supabase SQL Editor :

```sql
-- Ce script va insérer les 93 surveillants du fichier CSV
-- avec toutes leurs informations
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

Le fichier CSV contient **93 surveillants** de type assistant avec :
- Toutes les facultés (FASB, FSP, MEDE, ASS, FSM)
- Différents instituts (LDRI, IRSS, IREC, IONS, DDUV, IPSY, IACS, IMCN)
- Différents ETP (de 0.15 à 1.0)
- Quotas calculés (de 1 à 6 surveillances)
- Informations sur les absences et congés maternité

## 🔍 Vérification

Après l'import, vérifiez dans Supabase :

1. **Table Editor** → `surveillants`
2. Vous devriez voir 93 lignes
3. Toutes les colonnes doivent être remplies (sauf téléphone)
4. Les quotas doivent être calculés correctement

## 📝 Prochaines étapes

1. ✅ Exécuter `supabase-update-surveillants-table.sql`
2. ✅ Exécuter `supabase-insert-surveillants.sql`
3. ⏳ Compléter les numéros de téléphone manuellement
4. ⏳ Ajuster les quotas si nécessaire
5. ⏳ Créer une session et des créneaux
6. ⏳ Tester la soumission des disponibilités
