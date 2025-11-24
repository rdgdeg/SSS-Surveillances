-- Migration: Create consignes_secretariat table
-- Description: Stores instructions for each secretariat (arrival time, setup instructions, etc.)
-- Date: 2025-01-15

-- Table: consignes_secretariat
CREATE TABLE IF NOT EXISTS consignes_secretariat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_secretariat VARCHAR(50) NOT NULL UNIQUE,
  nom_secretariat VARCHAR(200) NOT NULL,
  consignes_arrivee TEXT,
  consignes_mise_en_place TEXT,
  consignes_generales TEXT,
  heure_arrivee_suggeree VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default secretariats
INSERT INTO consignes_secretariat (code_secretariat, nom_secretariat, consignes_arrivee, heure_arrivee_suggeree) VALUES
  ('FASB', 'Faculté de Pharmacie et Sciences Biomédicales', 'Veuillez vous présenter à l''accueil de la faculté.', '08:15'),
  ('DENT', 'Faculté de Médecine Dentaire', 'Veuillez vous présenter à l''accueil de la faculté.', '08:15'),
  ('MED', 'Faculté de Médecine', 'Veuillez vous présenter à l''accueil de la faculté.', '08:15'),
  ('BAC11', 'BAC 11', 'Veuillez vous présenter à l''accueil.', '08:15'),
  ('FSP', 'Faculté de Santé Publique', 'Veuillez vous présenter à l''accueil de la faculté.', '08:15')
ON CONFLICT (code_secretariat) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consignes_secretariat_code ON consignes_secretariat(code_secretariat);
CREATE INDEX IF NOT EXISTS idx_consignes_secretariat_active ON consignes_secretariat(is_active);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_consignes_secretariat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consignes_secretariat_updated_at ON consignes_secretariat;
CREATE TRIGGER trigger_consignes_secretariat_updated_at
  BEFORE UPDATE ON consignes_secretariat
  FOR EACH ROW
  EXECUTE FUNCTION update_consignes_secretariat_updated_at();

-- RLS Policies
ALTER TABLE consignes_secretariat ENABLE ROW LEVEL SECURITY;

-- Public can read active consignes
DROP POLICY IF EXISTS "Consignes lisibles par tous" ON consignes_secretariat;
CREATE POLICY "Consignes lisibles par tous" ON consignes_secretariat
  FOR SELECT USING (is_active = true);

-- Authenticated users can manage
DROP POLICY IF EXISTS "Consignes modifiables par authentifiés" ON consignes_secretariat;
CREATE POLICY "Consignes modifiables par authentifiés" ON consignes_secretariat
  FOR ALL USING (true);

-- Comments
COMMENT ON TABLE consignes_secretariat IS 'Consignes spécifiques par secrétariat pour les surveillances';
COMMENT ON COLUMN consignes_secretariat.code_secretariat IS 'Code unique du secrétariat (FASB, DENT, MED, etc.)';
COMMENT ON COLUMN consignes_secretariat.nom_secretariat IS 'Nom complet du secrétariat';
COMMENT ON COLUMN consignes_secretariat.consignes_arrivee IS 'Instructions pour l''arrivée des surveillants';
COMMENT ON COLUMN consignes_secretariat.consignes_mise_en_place IS 'Instructions pour la mise en place de la surveillance';
COMMENT ON COLUMN consignes_secretariat.consignes_generales IS 'Consignes générales supplémentaires';
COMMENT ON COLUMN consignes_secretariat.heure_arrivee_suggeree IS 'Heure d''arrivée suggérée (format HH:MM)';
