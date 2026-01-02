-- Migration: Add columns for consignes heritage system
-- Description: Adds columns to examens table for specific instructions inheritance
-- Date: 2025-01-02

-- Add columns for specific instructions per exam
ALTER TABLE examens 
ADD COLUMN IF NOT EXISTS consignes_specifiques_arrivee TEXT,
ADD COLUMN IF NOT EXISTS consignes_specifiques_mise_en_place TEXT,
ADD COLUMN IF NOT EXISTS consignes_specifiques_generales TEXT,
ADD COLUMN IF NOT EXISTS utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN examens.consignes_specifiques_arrivee IS 'Instructions d''arrivée spécifiques à cet examen (optionnel)';
COMMENT ON COLUMN examens.consignes_specifiques_mise_en_place IS 'Instructions de mise en place spécifiques à cet examen (optionnel)';
COMMENT ON COLUMN examens.consignes_specifiques_generales IS 'Consignes générales spécifiques à cet examen (optionnel)';
COMMENT ON COLUMN examens.utiliser_consignes_specifiques IS 'Si true, utilise les consignes spécifiques au lieu de celles du secrétariat';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_examens_utiliser_consignes_specifiques 
ON examens(utiliser_consignes_specifiques) 
WHERE utiliser_consignes_specifiques = true;