# Guide de Gestion des Créneaux de Test

## 📋 Vue d'ensemble

Ce guide explique comment gérer les créneaux de test pour la période du **02/01/2026 au 20/01/2026** (jours de semaine uniquement).

### Créneaux horaires standards
- **Matin** : 08:15 - 11:00
- **Midi** : 12:15 - 15:00
- **Après-midi** : 15:45 - 18:30

### Période couverte
- **Début** : Jeudi 02/01/2026
- **Fin** : Mardi 20/01/2026
- **Jours** : Uniquement les jours de semaine (lundi à vendredi)
- **Total** : 14 jours × 3 créneaux = **42 créneaux**

---

## 🚀 Insertion des créneaux de test

### Méthode 1 : Via l'interface Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu du fichier `supabase-insert-test-creneaux.sql`
4. Cliquez sur **Run** pour exécuter le script

### Méthode 2 : Via la ligne de commande

```bash
# Si vous utilisez Supabase CLI
supabase db execute < supabase-insert-test-creneaux.sql
```

### ✅ Vérification

Le script affichera automatiquement un résumé des créneaux insérés. Vous pouvez aussi vérifier manuellement :

```sql
SELECT 
    date_surveillance,
    COUNT(*) as nombre_creneaux
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true
AND date_surveillance BETWEEN '2026-01-02' AND '2026-01-20'
GROUP BY date_surveillance
ORDER BY date_surveillance;
```

---

## 🗑️ Suppression des créneaux de test

### Supprimer uniquement les créneaux de test

Utilisez le fichier `supabase-delete-test-creneaux.sql` :

1. Ouvrez **SQL Editor** dans Supabase
2. Copiez le contenu du fichier
3. Exécutez le script

Ce script supprime **uniquement** les créneaux entre le 02/01/2026 et le 20/01/2026.

### ⚠️ Supprimer TOUS les créneaux (Attention!)

Si vous voulez supprimer tous les créneaux de la session active :

```sql
DELETE FROM creneaux 
WHERE session_id IN (SELECT id FROM sessions WHERE is_active = true);
```

---

## ✏️ Modification des créneaux

### Modifier un créneau existant

```sql
-- Exemple : Changer l'heure d'un créneau
UPDATE creneaux 
SET heure_debut_surveillance = '08:30',
    heure_fin_surveillance = '11:15'
WHERE date_surveillance = '2026-01-02'
AND heure_debut_surveillance = '08:15';
```

### Ajouter un nouveau créneau

```sql
-- Récupérer l'ID de la session active
WITH active_session AS (
    SELECT id FROM sessions WHERE is_active = true LIMIT 1
)
INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
SELECT id, '2026-01-02', '19:00', '21:00', 'PRINCIPAL'
FROM active_session;
```

### Supprimer un créneau spécifique

```sql
-- Supprimer un créneau précis
DELETE FROM creneaux 
WHERE date_surveillance = '2026-01-02'
AND heure_debut_surveillance = '15:45';
```

---

## 🎯 Cas d'usage courants

### Ajouter un créneau de réserve

```sql
WITH active_session AS (
    SELECT id FROM sessions WHERE is_active = true LIMIT 1
)
INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
SELECT id, '2026-01-05', '08:15', '11:00', 'RESERVE'
FROM active_session;
```

### Modifier tous les créneaux du matin

```sql
UPDATE creneaux 
SET heure_debut_surveillance = '08:30',
    heure_fin_surveillance = '11:15'
WHERE heure_debut_surveillance = '08:15'
AND date_surveillance BETWEEN '2026-01-02' AND '2026-01-20';
```

### Ajouter un week-end d'examens

```sql
WITH active_session AS (
    SELECT id FROM sessions WHERE is_active = true LIMIT 1
)
INSERT INTO creneaux (session_id, date_surveillance, heure_debut_surveillance, heure_fin_surveillance, type_creneau)
SELECT id, date_val, heure_debut, heure_fin, 'PRINCIPAL'
FROM active_session
CROSS JOIN (VALUES 
    ('2026-01-10'::date, '08:15'::time, '11:00'::time),
    ('2026-01-10'::date, '12:15'::time, '15:00'::time),
    ('2026-01-11'::date, '08:15'::time, '11:00'::time),
    ('2026-01-11'::date, '12:15'::time, '15:00'::time)
) AS t(date_val, heure_debut, heure_fin);
```

---

## 📊 Requêtes utiles

### Compter les créneaux par jour

```sql
SELECT 
    date_surveillance,
    TO_CHAR(date_surveillance, 'Day') as jour_semaine,
    COUNT(*) as nombre_creneaux
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true
GROUP BY date_surveillance
ORDER BY date_surveillance;
```

### Voir tous les créneaux d'une journée

```sql
SELECT 
    date_surveillance,
    heure_debut_surveillance,
    heure_fin_surveillance,
    type_creneau
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true
AND date_surveillance = '2026-01-02'
ORDER BY heure_debut_surveillance;
```

### Statistiques globales

```sql
SELECT 
    COUNT(*) as total_creneaux,
    COUNT(DISTINCT date_surveillance) as nombre_jours,
    MIN(date_surveillance) as premiere_date,
    MAX(date_surveillance) as derniere_date
FROM creneaux c
JOIN sessions s ON c.session_id = s.id
WHERE s.is_active = true;
```

---

## 💡 Conseils

1. **Sauvegardez avant de supprimer** : Exportez vos créneaux avant toute suppression massive
2. **Testez sur une copie** : Si possible, testez vos modifications sur une base de données de développement
3. **Vérifiez la session active** : Assurez-vous qu'une seule session est active à la fois
4. **Utilisez des transactions** : Pour les modifications importantes, utilisez BEGIN/COMMIT/ROLLBACK

---

## 🔧 Dépannage

### Erreur : "Aucune session active trouvée"

Créez d'abord une session active :

```sql
INSERT INTO sessions (name, year, period, is_active) 
VALUES ('Session Janvier 2026', 2026, 1, true);
```

### Les créneaux n'apparaissent pas dans l'interface

Vérifiez que la session est bien active :

```sql
SELECT id, name, is_active FROM sessions WHERE is_active = true;
```

### Doublon de créneaux

Supprimez les doublons :

```sql
DELETE FROM creneaux a
USING creneaux b
WHERE a.id > b.id
AND a.session_id = b.session_id
AND a.date_surveillance = b.date_surveillance
AND a.heure_debut_surveillance = b.heure_debut_surveillance;
```

---

## 📝 Notes

- Les créneaux sont automatiquement supprimés si la session parente est supprimée (CASCADE)
- Le type de créneau par défaut est 'PRINCIPAL'
- Les heures sont stockées au format TIME (HH:MM:SS)
- Les dates sont au format DATE (YYYY-MM-DD)
