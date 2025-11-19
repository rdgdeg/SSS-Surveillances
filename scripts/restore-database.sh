#!/bin/bash
# Script de restauration de la base de données Supabase

if [ -z "$1" ]; then
  echo "❌ Usage: ./scripts/restore-database.sh <fichier_sauvegarde>"
  echo ""
  echo "Exemples:"
  echo "  ./scripts/restore-database.sh backups/backup_complet_20241119_143000.dump.gz"
  echo "  ./scripts/restore-database.sh backups/backup_donnees_20241119_143000.sql.gz"
  echo ""
  echo "Sauvegardes disponibles:"
  ls -lh backups/backup_*.gz 2>/dev/null | tail -5
  exit 1
fi

BACKUP_FILE=$1

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Erreur: Le fichier $BACKUP_FILE n'existe pas"
  exit 1
fi

# Charger les variables d'environnement
if [ ! -f .env.local ]; then
  echo "❌ Erreur: Fichier .env.local non trouvé"
  exit 1
fi

source .env.local

# Extraire les informations de connexion
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
DB_HOST="db.${PROJECT_REF}.supabase.co"

echo "⚠️  ⚠️  ⚠️  ATTENTION ⚠️  ⚠️  ⚠️"
echo ""
echo "Cette opération va ÉCRASER les données actuelles de la base de données!"
echo ""
echo "📁 Fichier: $BACKUP_FILE"
echo "🗄️  Base de données: $DB_HOST"
echo "📅 Date du fichier: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE")"
echo "📊 Taille: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
read -p "Tapez 'OUI' en majuscules pour confirmer: " confirm

if [ "$confirm" != "OUI" ]; then
  echo "❌ Restauration annulée"
  exit 0
fi

# Vérifier que pg_restore/psql est installé
if ! command -v pg_restore &> /dev/null; then
  echo "❌ Erreur: pg_restore n'est pas installé"
  echo "Installation: brew install postgresql"
  exit 1
fi

# Décompresser si nécessaire
TEMP_FILE=""
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "📦 Décompression..."
  TEMP_FILE="${BACKUP_FILE%.gz}"
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  BACKUP_FILE="$TEMP_FILE"
fi

echo "🔄 Restauration en cours..."
echo "⏳ Cela peut prendre plusieurs minutes..."

# Restaurer selon le type de fichier
if [[ $BACKUP_FILE == *.dump ]]; then
  PGPASSWORD=$SUPABASE_DB_PASSWORD pg_restore \
    -h $DB_HOST \
    -p 5432 \
    -U postgres \
    -d postgres \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
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
  [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
  exit 1
fi

RESTORE_STATUS=$?

# Nettoyer le fichier temporaire
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

if [ $RESTORE_STATUS -eq 0 ]; then
  echo ""
  echo "✅ Restauration terminée avec succès!"
  echo ""
  echo "🔍 Vérifications recommandées:"
  echo "  1. Connectez-vous à l'application"
  echo "  2. Vérifiez les données critiques"
  echo "  3. Testez les fonctionnalités principales"
else
  echo ""
  echo "❌ Erreur lors de la restauration"
  echo "Consultez les messages d'erreur ci-dessus"
  exit 1
fi
