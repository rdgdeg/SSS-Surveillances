-- ============================================
-- Migration: Create examens table for exam management
-- Description: Creates the examens table to store exam schedules and links to courses
-- Date: 2025-01-13
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: examens
-- Stores examination schedules with course links and supervisor requirements
CREATE TABLE IF NOT EXISTS examens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  cours_id UUID REFERENCES cours(id) ON DELETE SET NULL,
  code_examen VARCHAR(50) NOT NULL,
  nom_examen VARCHAR(500) NOT NULL,
  date_examen DATE,
  heure_debut TIME,
  heure_fin TIME,
  duree_minutes INTEGER,
  auditoires TEXT,
  enseignants TEXT[], -- Array of teacher names/emails
  secretariat VARCHAR(100),
  nb_surveillants_requis INTEGER CHECK (nb_surveillants_requis >= 0 AND nb_surveillants_requis <= 99),
  saisie_manuelle BOOLEAN DEFAULT FALSE,
  cree_par_email VARCHAR(255),
  valide BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_code_date UNIQUE(session_id, code_examen, date_examen)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_examens_session ON examens(session_id);
CREATE INDEX IF NOT EXISTS idx_examens_cours ON examens(cours_id);
CREATE INDEX IF NOT EXISTS idx_examens_date ON examens(date_examen);
CREATE INDEX IF NOT EXISTS idx_examens_code ON examens(code_examen);
CREATE INDEX IF NOT EXISTS idx_examens_secretariat ON examens(secretariat);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_examens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_examens_updated_at ON examens;
CREATE TRIGGER trigger_examens_updated_at
  BEFORE UPDATE ON examens
  FOR EACH ROW
  EXECUTE FUNCTION update_examens_updated_at();

-- Update presences_enseignants table to link to examens
ALTER TABLE presences_enseignants 
  ADD COLUMN IF NOT EXISTS examen_id UUID REFERENCES examens(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_presences_examen ON presences_enseignants(examen_id);

-- Update unique constraint to include examen
-- First, drop the old constraint if it exists
ALTER TABLE presences_enseignants 
  DROP CONSTRAINT IF EXISTS unique_cours_session_enseignant;

-- Add new constraint for examen-based uniqueness
-- Note: We keep cours_id for backward compatibility but add examen_id
ALTER TABLE presences_enseignants 
  ADD CONSTRAINT unique_examen_enseignant UNIQUE(examen_id, enseignant_email);

-- Row Level Security (RLS)
ALTER TABLE examens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (admin-only in application layer)
DROP POLICY IF EXISTS "Examens lisibles par tous" ON examens;
CREATE POLICY "Examens lisibles par tous" ON examens
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Examens créables par tous" ON examens;
CREATE POLICY "Examens créables par tous" ON examens
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Examens modifiables par tous" ON examens;
CREATE POLICY "Examens modifiables par tous" ON examens
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Examens supprimables par tous" ON examens;
CREATE POLICY "Examens supprimables par tous" ON examens
  FOR DELETE USING (true);

-- Comments for documentation
COMMENT ON TABLE examens IS 'Stocke les horaires d''examens avec liens vers les cours et besoins en surveillants';
COMMENT ON COLUMN examens.session_id IS 'Référence à la session d''examen';
COMMENT ON COLUMN examens.cours_id IS 'Référence au cours (peut être NULL si non lié)';
COMMENT ON COLUMN examens.code_examen IS 'Code de l''examen (ex: WMDS2221)';
COMMENT ON COLUMN examens.nom_examen IS 'Nom complet de l''examen';
COMMENT ON COLUMN examens.date_examen IS 'Date de l''examen (YYYY-MM-DD)';
COMMENT ON COLUMN examens.heure_debut IS 'Heure de début (HH:MM)';
COMMENT ON COLUMN examens.heure_fin IS 'Heure de fin (HH:MM)';
COMMENT ON COLUMN examens.duree_minutes IS 'Durée en minutes';
COMMENT ON COLUMN examens.auditoires IS 'Liste des auditoires/salles';
COMMENT ON COLUMN examens.enseignants IS 'Array des noms/emails des enseignants';
COMMENT ON COLUMN examens.secretariat IS 'Secrétariat responsable';
COMMENT ON COLUMN examens.nb_surveillants_requis IS 'Nombre de surveillants nécessaires (0-99)';
COMMENT ON COLUMN examens.saisie_manuelle IS 'Indique si l''examen a été saisi manuellement par un enseignant';
COMMENT ON COLUMN examens.cree_par_email IS 'Email de l''utilisateur qui a créé l''examen';
COMMENT ON COLUMN examens.valide IS 'Indique si l''examen est validé (false pour les saisies manuelles en attente)';

COMMENT ON COLUMN presences_enseignants.examen_id IS 'Référence à l''examen (nouvelle colonne pour lier aux examens)';
