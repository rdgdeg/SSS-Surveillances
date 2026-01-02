# Guide de Vérification - Champ Code Examen

## Problème
Le champ "Code de l'examen" n'apparaît pas dans le formulaire de demande de modification.

## Diagnostic Étape par Étape

### Étape 1: Vérifier la Base de Données

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Vérifier si le champ existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';
```

**Résultat attendu :**
```
column_name | data_type
code_examen | text
```

**Si vide :** Le champ n'existe pas dans la base → Passez à l'étape 2

### Étape 2: Ajouter le Champ (Si Manquant)

Exécutez le script `scripts/debug-code-examen.sql` dans Supabase, ou directement :

```sql
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS code_examen TEXT;

CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
ON demandes_modification(code_examen);
```

### Étape 3: Vérifier l'Application

1. **Redémarrer l'application** :
   ```bash
   # Arrêter avec Ctrl+C puis
   npm run dev
   ```

2. **Vider le cache du navigateur** :
   - Chrome/Firefox : Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
   - Ou ouvrir en navigation privée

3. **Tester le formulaire** :
   - Aller sur la page publique
   - Cliquer "Demander une modification"
   - Vérifier que le champ "Code de l'examen" apparaît

### Étape 4: Vérification du Code

Si le champ n'apparaît toujours pas, vérifiez que le composant est bien à jour :

```bash
# Vérifier que les modifications sont bien présentes
grep -n "codeExamen" components/shared/DemandeModificationModal.tsx
```

**Résultat attendu :** Plusieurs lignes avec `codeExamen`

### Étape 5: Test Complet

1. **Remplir le formulaire** avec :
   - Code examen : `TEST001`
   - Nom examen : `Test`
   - Date et heure
   - Vos informations

2. **Soumettre** et vérifier dans l'admin que la demande contient le code

## Solutions aux Problèmes Courants

### Le champ n'apparaît pas après redémarrage

**Cause :** Cache du navigateur ou erreur JavaScript

**Solution :**
1. Ouvrir la console développeur (F12)
2. Vérifier s'il y a des erreurs
3. Forcer le rechargement (Ctrl+Shift+R)

### Erreur "column does not exist" lors de la soumission

**Cause :** Migration non appliquée

**Solution :**
1. Exécuter `scripts/debug-code-examen.sql`
2. Redémarrer l'application

### Le champ apparaît mais la validation échoue

**Cause :** Validation côté client/serveur

**Solution :**
1. Vérifier que le champ est bien rempli
2. Vérifier la console pour les erreurs

## Vérification Finale

Après toutes les étapes :

✅ **Base de données** : Colonne `code_examen` présente  
✅ **Interface** : Champ visible et obligatoire  
✅ **Fonctionnement** : Soumission réussie avec code  
✅ **Admin** : Demande visible avec le code d'examen  

## En Cas de Problème Persistant

Exécutez le diagnostic complet :

```sql
-- Dans Supabase
SELECT 'Structure complète' as info, * 
FROM information_schema.columns 
WHERE table_name = 'demandes_modification'
ORDER BY ordinal_position;
```

Et envoyez-moi :
1. Le résultat de cette requête
2. Une capture d'écran du formulaire
3. Les erreurs de la console (F12)

Je pourrai alors diagnostiquer le problème spécifique.