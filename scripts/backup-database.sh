#!/bin/bash
# Script de sauvegarde de la base de données Supabase

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Charger les variables d'environnement
if [ ! -f .env.local ]; then
  echo "❌ Erreur: Fichier .env.local non trouvé"
  exit 1
fi

source .env.local

# Extraire les informations de connexion de SUPABASE_URL
# Format: https://xxxxx.supabase.co
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
DB_HOST="db.${PROJECT_REF}.supabase.co"

echo "🔄 Démarrage de la sauvegarde..."
echo "📅 Date: $(date)"
echo "🗄️  Hôte: $DB_HOST"

# Vérifier que pg_dump est installé
if ! command -v pg_dump &> /dev/null; then
  echo "❌ Erreur: pg_dump n'est pas installé"
  echo "Installation: brew install postgresql"
  exit 1
fi

# Sauvegarde complète
echo "📦 Création de la sauvegarde complète..."
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

# Sauvegarde des données uniquement (tables critiques)
echo "📦 Création de la sauvegarde des données critiques..."
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
  -t creneaux \
  -t consignes_secretariat \
  -t examen_auditoires \
  -f "$BACKUP_DIR/backup_donnees_$DATE.sql"

if [ $? -eq 0 ]; then
  echo "✅ Sauvegarde des données créée: backup_donnees_$DATE.sql"
else
  echo "⚠️  Avertissement: Erreur lors de la sauvegarde des données"
fi

# Compresser les sauvegardes
echo "🗜️  Compression des sauvegardes..."
gzip "$BACKUP_DIR/backup_complet_$DATE.dump"
gzip "$BACKUP_DIR/backup_donnees_$DATE.sql"

echo "📦 Sauvegardes compressées"

# Nettoyer les anciennes sauvegardes (garder les X derniers jours)
echo "🧹 Nettoyage des anciennes sauvegardes (> $RETENTION_DAYS jours)..."
find "$BACKUP_DIR" -name "backup_*.gz" -mtime +$RETENTION_DAYS -delete

# Afficher la taille des sauvegardes
echo ""
echo "📊 Taille des sauvegardes créées:"
du -h "$BACKUP_DIR"/backup_*_$DATE.*.gz

echo ""
echo "✅ Sauvegarde terminée avec succès!"
echo "📁 Emplacement: $BACKUP_DIR"
