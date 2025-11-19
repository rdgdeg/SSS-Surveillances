# Guide Rapide - Sauvegardes

## 🚀 Démarrage rapide

### 1. Configuration initiale (une seule fois)

**Installer PostgreSQL client :**
```bash
brew install postgresql
```

**Ajouter le mot de passe dans .env.local :**
```bash
# Récupérer le mot de passe depuis Supabase Dashboard
# Settings → Database → Database password

# Ajouter dans .env.local :
SUPABASE_DB_PASSWORD=votre_mot_de_passe_ici
```

### 2. Créer une sauvegarde

```bash
./scripts/backup-database.sh
```

Cela crée deux fichiers dans `backups/` :
- `backup_complet_YYYYMMDD_HHMMSS.dump.gz` - Sauvegarde complète
- `backup_donnees_YYYYMMDD_HHMMSS.sql.gz` - Données uniquement

### 3. Vérifier les sauvegardes

```bash
./scripts/check-backups.sh
```

### 4. Restaurer une sauvegarde

```bash
./scripts/restore-database.sh backups/backup_complet_20241119_143000.dump.gz
```

⚠️ **ATTENTION** : Cela écrasera toutes les données actuelles !

---

## 📅 Quand faire une sauvegarde ?

✅ **TOUJOURS avant :**
- Une migration de base de données
- Une modification importante des données
- Une mise à jour majeure de l'application
- La fin de chaque session d'examens

✅ **Recommandé :**
- Quotidiennement (automatique via GitHub Actions)
- Avant chaque import de données
- Après chaque modification manuelle importante

---

## 🔄 Sauvegardes automatiques

### GitHub Actions (Recommandé)

1. **Configurer les secrets GitHub :**
   - Allez sur https://github.com/rdgdeg/SSS-Surveillances/settings/secrets/actions
   - Ajoutez :
     - `SUPABASE_DB_PASSWORD` : Votre mot de passe Supabase
     - `SUPABASE_DB_HOST` : `db.xxxxx.supabase.co` (depuis Supabase Dashboard)

2. **Activer le workflow :**
   - Le workflow est déjà configuré dans `.github/workflows/backup-database.yml`
   - Il s'exécute automatiquement tous les jours à 2h du matin UTC
   - Vous pouvez aussi le lancer manuellement depuis l'onglet "Actions" sur GitHub

3. **Récupérer une sauvegarde :**
   - Allez sur https://github.com/rdgdeg/SSS-Surveillances/actions
   - Cliquez sur le workflow "Database Backup"
   - Téléchargez l'artifact de la sauvegarde souhaitée

---

## 🆘 En cas de problème

### Restauration d'urgence

1. **Identifier la dernière bonne sauvegarde :**
   ```bash
   ls -lh backups/
   ```

2. **Restaurer :**
   ```bash
   ./scripts/restore-database.sh backups/backup_complet_YYYYMMDD_HHMMSS.dump.gz
   ```

3. **Vérifier :**
   - Connectez-vous à l'application
   - Vérifiez que les données sont correctes

### Problèmes courants

**"pg_dump: command not found"**
```bash
brew install postgresql
```

**"FATAL: password authentication failed"**
- Vérifiez que `SUPABASE_DB_PASSWORD` est correct dans `.env.local`
- Récupérez le mot de passe depuis Supabase Dashboard

**"Connection refused"**
- Vérifiez votre connexion internet
- Vérifiez que l'URL Supabase est correcte

---

## 📞 Support

- Documentation complète : `GUIDE-SAUVEGARDES-DONNEES.md`
- Support Supabase : https://supabase.com/support
