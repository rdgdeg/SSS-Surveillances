-- Migration: Ajouter les colonnes pour le système d'héritage des consignes
-- Date: 2025-01-02
-- Description: Ajoute les colonnes nécessaires au système d'héritage des consignes

-- Ajouter les colonnes pour les consignes spécifiques
ALTER TABLE examens 
ADD COLUMN IF NOT EXISTS consignes_specifiques_arrivee TEXT,
ADD COLUMN IF NOT EXISTS consignes_specifiques_mise_en_place TEXT,
ADD COLUMN IF NOT EXISTS consignes_specifiques_generales TEXT,
ADD COLUMN IF NOT EXISTS utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN examens.consignes_specifiques_arrivee IS 'Consignes d''arrivée spécifiques à cet examen (optionnel)';
COMMENT ON COLUMN examens.consignes_specifiques_mise_en_place IS 'Consignes de mise en place spécifiques à cet examen (optionnel)';
COMMENT ON COLUMN examens.consignes_specifiques_generales IS 'Consignes générales spécifiques à cet examen (optionnel)';
COMMENT ON COLUMN examens.utiliser_consignes_specifiques IS 'Indique si cet examen utilise des consignes spécifiques (true) ou celles du secrétariat (false)';