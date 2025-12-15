#!/bin/bash

# Script pour exécuter la mise à jour des téléphones
# Usage: ./scripts/run-telephone-update.sh

echo "🔍 Étape 1: Liste des surveillants actuels"
echo "SELECT nom, prenom, email, telephone FROM surveillants WHERE is_active = true ORDER BY nom LIMIT 20;" | psql "$DATABASE_URL"

echo ""
echo "🔍 Étape 2: Recherche des correspondances"
psql "$DATABASE_URL" -f scripts/smart-add-telephones.sql

echo ""
echo "✅ Mise à jour terminée!"