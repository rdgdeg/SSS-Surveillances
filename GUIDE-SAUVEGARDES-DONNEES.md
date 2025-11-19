# Guide de Sauvegarde et Restauration des Données

## 📋 Table des matières
1. [Sauvegardes automatiques Supabase](#sauvegardes-automatiques-supabase)
2. [Sauvegardes manuelles](#sauvegardes-manuelles)
3. [Restauration des données](#restauration-des-données)
4. [Sauvegardes programmées](#sauvegardes-programmées)
5. [Bonnes pratiques](#bonnes-pratiques)

---

## 🔄 Sauvegardes automatiques Supabase

### Sauvegardes intégrées (Plan Pro et supérieur)

Supabase offre des sauvegardes automatiques quotidiennes :
- **Plan Free** : Pas de sauvegardes automatiques
- **Plan Pro** : Sauvegardes quotidiennes conservées 7 jours
- **Plan Team/Enterprise** : Sauvegardes quotidiennes conservées 30 jours

**Accès aux sauvegardes :**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans `Settings` → `Database` → `Backups`
4. Cliquez sur `Restore` pour restaurer une sauvegarde

---

## 💾 Sauvegardes manuelles

### Option 1 : Export via l'interface Supabase (Recommandé pour débuter)

**Étapes :**
1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans `Database` → `Backups`
4. Cliquez sur `Create backup` pour créer une sauvegarde manuelle
5. Téléchargez le fichier `.sql` généré

### Option 2 : Export via pg_dump (Plus flexible)

**Installation de pg_dump :**
```bash
# macOS
brew install postgresql

# Vérifier l'installation
pg_dump --version
```

**Créer une sauvegarde complète :**
```bash
# Récupérer les informations de connexion depuis Supabase Dashboard
# Settings → Database → Connection string

# Format de la commande
pg_dump -h [HOST] -p [PORT] -U postgres -d postgres -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Exemple avec mot de passe
PGPASSWORD=your_password pg_dump -h db.xxxxx.supabase.co -p 5432 -U postgres -d postgres -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

**Créer une sauvegarde en SQL lisible :**
```bash
PGPASSWORD=your_password pg_dump -h db.xxxxx.supabase.co -p 5432 -U postgres -d postgres -f backup_$(date +%Y%m%d_%H%M%S).sql
```

**Sauvegarder uniquement certaines tables :**
```bash
# Tables critiques de votre application
PGPASSWORD=your_password pg_dump -h db.xxxxx.supabase.co -p 5432 -U postgres -d postgres \
  -t examens \
  -t surveillants \
  -t soumissions_disponibilites \
  -t presences_enseignants \
  -t cours \
  -t sessions \
  -t creneaux \
  -f backup_tables_critiques_$(date +%Y%m%d_%H%M%S).sql
```

### Option 3 : Script de sauvegarde automatisé

Je vais créer un script pour vous :

```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Charger les variables d'environnement
source .env.local

# Extraire les informations de connexion de SUPABASE_URL
# Format: https://xxxxx.supabase.co
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
DB_HOST="db.${PROJECT_REF}.supabase.co"

echo "🔄 Démarrage de la sauvegarde..."
echo "📅 Date: $(date)"

# Sauvegarde complète
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p 5432 \
  -U postgres \
  -d postgres \
  -F c \
  -f "$BACKUP_DIR/backup_complet_$DATE.dump"

if [ $? -eq 0 ]; then
  echo "✅ Sauvegarde complète créée: backup_complet_$DATE.dump"
else
  echo "❌ Erreur lors de la sauvegarde complète"
  exit 1
fi

# Sauvegarde en SQL lisible (plus petit, pour Git)
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p 5432 \
  -U postgres \
  -d postgres \
  --data-only \
  -t examens \
  -t surveillants \
  -t soumissions_disponibilites \
  -t presences_enseignants \
  -t cours \
  -t sessions \
  -f "$BACKUP_DIR/backup_donnees_$DATE.sql"

if [ $? -eq 0 ]; then
  echo "✅ Sauvegarde des données créée: backup_donnees_$DATE.sql"
else
  echo "❌ Erreur lors de la sauvegarde des données"
fi

# Compresser les sauvegardes
gzip "$BACKUP_DIR/backup_complet_$DATE.dump"
gzip "$BACKUP_DIR/backup_donnees_$DATE.sql"

echo "📦 Sauvegardes compressées"

# Nettoyer les anciennes sauvegardes (garder les 30 derniers jours)
find "$BACKUP_DIR" -name "backup_*.gz" -mtime +$RETENTION_DAYS -delete
echo "🧹 Anciennes sauvegardes supprimées (> $RETENTION_DAYS jours)"

# Afficher la taille des sauvegardes
echo "📊 Taille des sauvegardes:"
du -h "$BACKUP_DIR"/backup_*_$DATE.*.gz

echo "✅ Sauvegarde terminée avec succès!"
```

**Rendre le script exécutable :**
```bash
chmod +x scripts/backup-database.sh
```

**Exécuter le script :**
```bash
./scripts/backup-database.sh
```

---

## 🔧 Restauration des données

### Option 1 : Restauration via Supabase Dashboard

1. Allez dans `Settings` → `Database` → `Backups`
2. Sélectionnez la sauvegarde à restaurer
3. Cliquez sur `Restore`
4. Confirmez l'opération

⚠️ **Attention** : Cela écrasera toutes les données actuelles !

### Option 2 : Restauration via pg_restore

**Restaurer une sauvegarde complète (.dump) :**
```bash
# ATTENTION: Cela va écraser les données existantes!
PGPASSWORD=your_password pg_restore \
  -h db.xxxxx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  backup_complet_20241119_143000.dump
```

**Restaurer une sauvegarde SQL :**
```bash
PGPASSWORD=your_password psql \
  -h db.xxxxx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f backup_donnees_20241119_143000.sql
```

**Restaurer uniquement certaines tables :**
```bash
# Extraire une table spécifique
PGPASSWORD=your_password pg_restore \
  -h db.xxxxx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -t examens \
  backup_complet_20241119_143000.dump
```

### Option 3 : Script de restauration

```bash
#!/bin/bash
# scripts/restore-database.sh

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-database.sh <fichier_sauvegarde>"
  echo "Exemple: ./scripts/restore-database.sh backups/backup_complet_20241119_143000.dump.gz"
  exit 1
fi

BACKUP_FILE=$1

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Erreur: Le fichier $BACKUP_FILE n'existe pas"
  exit 1
fi

# Charger les variables d'environnement
source .env.local

# Extraire les informations de connexion
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
DB_HOST="db.${PROJECT_REF}.supabase.co"

echo "⚠️  ATTENTION: Cette opération va écraser les données actuelles!"
echo "📁 Fichier: $BACKUP_FILE"
echo "🗄️  Base de données: $DB_HOST"
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
  echo "❌ Restauration annulée"
  exit 0
fi

# Décompresser si nécessaire
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "📦 Décompression..."
  gunzip -k "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

echo "🔄 Restauration en cours..."

# Restaurer selon le type de fichier
if [[ $BACKUP_FILE == *.dump ]]; then
  PGPASSWORD=$SUPABASE_DB_PASSWORD pg_restore \
    -h $DB_HOST \
    -p 5432 \
    -U postgres \
    -d postgres \
    --clean \
    --if-exists \
    "$BACKUP_FILE"
elif [[ $BACKUP_FILE == *.sql ]]; then
  PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
    -h $DB_HOST \
    -p 5432 \
    -U postgres \
    -d postgres \
    -f "$BACKUP_FILE"
else
  echo "❌ Format de fichier non reconnu"
  exit 1
fi

if [ $? -eq 0 ]; then
  echo "✅ Restauration terminée avec succès!"
else
  echo "❌ Erreur lors de la restauration"
  exit 1
fi
```

---

## ⏰ Sauvegardes programmées

### Option 1 : Cron (macOS/Linux)

**Éditer le crontab :**
```bash
crontab -e
```

**Ajouter une sauvegarde quotidienne à 2h du matin :**
```bash
0 2 * * * cd /chemin/vers/votre/projet && ./scripts/backup-database.sh >> /chemin/vers/votre/projet/backups/backup.log 2>&1
```

**Ajouter une sauvegarde hebdomadaire le dimanche à 3h :**
```bash
0 3 * * 0 cd /chemin/vers/votre/projet && ./scripts/backup-database.sh >> /chemin/vers/votre/projet/backups/backup_weekly.log 2>&1
```

### Option 2 : GitHub Actions (Recommandé)

Je vais créer un workflow GitHub Actions pour vous :

```yaml
# .github/workflows/backup-database.yml
name: Database Backup

on:
  schedule:
    # Tous les jours à 2h du matin UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Permet de lancer manuellement

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create backup directory
        run: mkdir -p backups
      
      - name: Create database backup
        env:
          PGPASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          DB_HOST: ${{ secrets.SUPABASE_DB_HOST }}
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          pg_dump -h $DB_HOST -p 5432 -U postgres -d postgres -F c -f backups/backup_$DATE.dump
          gzip backups/backup_$DATE.dump
      
      - name: Upload backup to artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/*.dump.gz
          retention-days: 30
      
      - name: Upload backup to release (optionnel)
        if: github.event_name == 'workflow_dispatch'
        uses: softprops/action-gh-release@v1
        with:
          tag_name: backup-${{ github.run_number }}
          files: backups/*.dump.gz
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Configuration des secrets GitHub :**
1. Allez sur votre repo GitHub
2. `Settings` → `Secrets and variables` → `Actions`
3. Ajoutez :
   - `SUPABASE_DB_PASSWORD` : Votre mot de passe Supabase
   - `SUPABASE_DB_HOST` : `db.xxxxx.supabase.co`

---

## 📝 Bonnes pratiques

### 1. Stratégie de sauvegarde 3-2-1

- **3** copies de vos données
- Sur **2** supports différents
- **1** copie hors site

**Exemple :**
1. Base de données production (Supabase)
2. Sauvegarde locale (votre ordinateur)
3. Sauvegarde cloud (GitHub Actions artifacts ou AWS S3)

### 2. Fréquence recommandée

- **Quotidienne** : Pour les données critiques
- **Hebdomadaire** : Pour les données moins critiques
- **Avant chaque migration** : Toujours !

### 3. Tests de restauration

Testez régulièrement vos sauvegardes :
```bash
# Créer une base de données de test
# Restaurer la sauvegarde
# Vérifier que tout fonctionne
```

### 4. Documentation

Gardez une trace de :
- Date de la sauvegarde
- Taille du fichier
- Version de l'application
- Migrations appliquées

### 5. Sécurité

- ⚠️ Ne commitez JAMAIS les sauvegardes dans Git
- Ajoutez au `.gitignore` :
```
backups/
*.dump
*.dump.gz
*.sql.gz
```

- Chiffrez les sauvegardes sensibles :
```bash
# Chiffrer
gpg -c backup_20241119.dump

# Déchiffrer
gpg backup_20241119.dump.gpg
```

---

## 🚨 En cas d'urgence

### Restauration rapide

1. **Identifier la dernière bonne sauvegarde**
   ```bash
   ls -lh backups/
   ```

2. **Restaurer immédiatement**
   ```bash
   ./scripts/restore-database.sh backups/backup_complet_YYYYMMDD_HHMMSS.dump.gz
   ```

3. **Vérifier les données**
   - Connectez-vous à l'application
   - Vérifiez les tables critiques
   - Testez les fonctionnalités principales

### Contacts d'urgence

- Support Supabase : https://supabase.com/support
- Documentation : https://supabase.com/docs/guides/database/backups

---

## 📊 Monitoring des sauvegardes

### Script de vérification

```bash
#!/bin/bash
# scripts/check-backups.sh

BACKUP_DIR="./backups"
MAX_AGE_HOURS=48

echo "🔍 Vérification des sauvegardes..."

# Trouver la sauvegarde la plus récente
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_complet_*.dump.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ Aucune sauvegarde trouvée!"
  exit 1
fi

# Vérifier l'âge de la sauvegarde
AGE_HOURS=$(( ($(date +%s) - $(stat -f %m "$LATEST_BACKUP")) / 3600 ))

echo "📁 Dernière sauvegarde: $(basename $LATEST_BACKUP)"
echo "⏰ Âge: $AGE_HOURS heures"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
  echo "⚠️  ATTENTION: La sauvegarde a plus de $MAX_AGE_HOURS heures!"
  exit 1
else
  echo "✅ Sauvegarde récente OK"
fi

# Vérifier la taille
SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo "📊 Taille: $SIZE"
```

---

## 🎯 Checklist de sauvegarde

Avant chaque modification importante :

- [ ] Créer une sauvegarde manuelle
- [ ] Vérifier que la sauvegarde est complète
- [ ] Tester la restauration sur un environnement de test
- [ ] Documenter les changements prévus
- [ ] Avoir un plan de rollback

---

## 📞 Support

Pour toute question sur les sauvegardes :
1. Consultez la documentation Supabase
2. Vérifiez les logs de sauvegarde
3. Testez sur un environnement de développement d'abord
