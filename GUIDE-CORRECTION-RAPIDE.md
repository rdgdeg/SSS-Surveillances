# Guide de Correction Rapide - Versioning et Code Examen

## Problème Résolu

1. **Code d'examen manquant** dans les demandes de modification
2. **Système de versioning** qui n'enregistre pas les modifications

## Solution en 3 Étapes

### Étape 1: Appliquer la Correction Simple

Dans Supabase SQL Editor, exécuter ce script :

```sql
-- Ajouter le champ code_examen
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS code_examen TEXT;

CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
ON demandes_modification(code_examen);

-- Vérifier que c'est ajouté
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';
```

### Étape 2: Corriger les Triggers de Versioning

Exécuter le contenu du fichier `scripts/fix-versioning-triggers-only.sql` dans Supabase.

### Étape 3: Redémarrer l'Application

```bash
# Arrêter l'application
Ctrl+C

# Redémarrer
npm run dev
```

## Vérification Rapide

### 1. Test du Code Examen

1. Aller sur la page publique
2. Cliquer "Demander une modification"
3. Vérifier que le champ "Code de l'examen" est présent
4. Essayer de soumettre sans le remplir → doit afficher une erreur
5. Remplir le code (ex: WFARM1300) et soumettre → doit fonctionner

### 2. Test du Versioning

1. Se connecter en admin
2. Modifier un examen ou une session
3. Aller dans "Versioning" (menu admin)
4. Vérifier qu'une nouvelle entrée apparaît avec votre nom

## Diagnostic en Cas de Problème

### Vérifier le Champ Code Examen

```sql
SELECT 
    CASE WHEN column_name IS NOT NULL THEN 'OK' ELSE 'MANQUANT' END as status
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';
```

### Vérifier les Triggers de Versioning

```sql
SELECT 
    COUNT(*) as nombre_triggers,
    CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'PROBLÈME' END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%';
```

### Vérifier l'Activité de Versioning

```sql
SELECT 
    COUNT(*) as versions_recentes,
    MAX(created_at) as derniere_version
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '1 day';
```

## Si Ça Ne Marche Toujours Pas

### Option 1: Script Complet
Exécuter `scripts/apply-versioning-fixes-simple.sql`

### Option 2: Réinstallation Complète
Exécuter `VERSIONING-FINAL-INSTALL.sql`

### Option 3: Support
Envoyer les résultats des requêtes de diagnostic ci-dessus.

## Résultat Attendu

Après ces corrections :

✅ **Demandes de modification** : Champ "Code examen" obligatoire  
✅ **Versioning** : Toutes les modifications sont tracées avec votre nom  
✅ **Traçabilité** : Historique complet de qui a fait quoi et quand  

Le système sera opérationnel et vous aurez une traçabilité complète de toutes vos actions administratives.