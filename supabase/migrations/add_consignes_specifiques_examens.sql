-- Migration: Add specific consignes fields to examens table
-- Description: Allows overriding secretariat consignes for specific exams
-- Date: 2025-01-15

-- Add consignes fields to examens table
ALTER TABLE examens 
ADD COLUMN IF NOT EXISTS consignes_specifiques_arrivee TEXT,
ADD COLUMN IF NOT EXISTS consignes_specifiques_mise_en_place TEXT,
ADD COLUMN IF NOT EXISTS consignes_specifiques_generales TEXT,
ADD COLUMN IF NOT EXISTS utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE;

-- Comments
COMMENT ON COLUMN examens.consignes_specifiques_arrivee IS 'Consignes d''arrivée spécifiques à cet examen (remplace celles du secrétariat si définies)';
COMMENT ON COLUMN examens.consignes_specifiques_mise_en_place IS 'Consignes de mise en place spécifiques à cet examen';
COMMENT ON COLUMN examens.consignes_specifiques_generales IS 'Consignes générales spécifiques à cet examen';
COMMENT ON COLUMN examens.utiliser_consignes_specifiques IS 'Si TRUE, utilise les consignes spécifiques au lieu de celles du secrétariat';
