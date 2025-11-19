#!/bin/bash
# Script de vérification des sauvegardes

BACKUP_DIR="./backups"
MAX_AGE_HOURS=48

echo "🔍 Vérification des sauvegardes..."
echo ""

# Vérifier que le dossier existe
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Le dossier de sauvegarde n'existe pas: $BACKUP_DIR"
  exit 1
fi

# Trouver la sauvegarde la plus récente
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_complet_*.dump.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ Aucune sauvegarde trouvée dans $BACKUP_DIR"
  echo ""
  echo "💡 Pour créer une sauvegarde:"
  echo "   ./scripts/backup-database.sh"
  exit 1
fi

# Vérifier l'âge de la sauvegarde
AGE_HOURS=$(( ($(date +%s) - $(stat -f %m "$LATEST_BACKUP")) / 3600 ))

echo "📁 Dernière sauvegarde complète:"
echo "   $(basename $LATEST_BACKUP)"
echo ""
echo "⏰ Âge: $AGE_HOURS heures"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
  echo "⚠️  ATTENTION: La sauvegarde a plus de $MAX_AGE_HOURS heures!"
  echo "   Recommandation: Créez une nouvelle sauvegarde"
  EXIT_CODE=1
else
  echo "✅ Sauvegarde récente OK"
  EXIT_CODE=0
fi

# Vérifier la taille
SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo "📊 Taille: $SIZE"

# Compter le nombre de sauvegardes
BACKUP_COUNT=$(ls "$BACKUP_DIR"/backup_complet_*.dump.gz 2>/dev/null | wc -l | tr -d ' ')
echo "📦 Nombre de sauvegardes: $BACKUP_COUNT"

# Afficher les 5 dernières sauvegardes
echo ""
echo "📋 Dernières sauvegardes:"
ls -lh "$BACKUP_DIR"/backup_complet_*.dump.gz 2>/dev/null | tail -5 | awk '{print "   " $9 " (" $5 ")"}'

# Calculer l'espace total utilisé
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "💾 Espace total utilisé: $TOTAL_SIZE"

exit $EXIT_CODE
