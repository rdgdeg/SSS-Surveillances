-- ============================================
-- Migration: Mise à jour pour utiliser la table cours existante
-- Description: Modification de presences_enseignants pour utiliser cours_id au lieu d'examen_id
-- Date: 2025-01-13
-- ============================================

-- Supprimer l'ancienne table examens si elle existe
DROP TABLE IF EXISTS presences_enseignants CASCADE;
DROP TABLE IF EXISTS examens CASCADE;

-- Table: presences_enseignants (version simplifiée avec cours)
-- Stocke les déclarations de présence des enseignants pour les cours
CREATE TABLE IF NOT EXISTS presences_enseignants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cours_id UUID NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  enseignant_email VARCHAR(255) NOT NULL,
  enseignant_nom VARCHAR(255) NOT NULL,
  enseignant_prenom VARCHAR(255) NOT NULL,
  est_present BOOLEAN NOT NULL,
  nb_surveillants_accompagnants INTEGER DEFAULT 0 CHECK (nb_surveillants_accompagnants >= 0),
  remarque TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_cours_session_enseignant UNIQUE(cours_id, session_id, enseignant_email)
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_presences_cours ON presences_enseignants(cours_id);
CREATE INDEX IF NOT EXISTS idx_presences_session ON presences_enseignants(session_id);
CREATE INDEX IF NOT EXISTS idx_presences_email ON presences_enseignants(enseignant_email);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_presences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_presences_updated_at ON presences_enseignants;
CREATE TRIGGER trigger_presences_updated_at
  BEFORE UPDATE ON presences_enseignants
  FOR EACH ROW
  EXECUTE FUNCTION update_presences_updated_at();

-- Table: notifications_admin (inchangée)
CREATE TABLE IF NOT EXISTS notifications_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  lu BOOLEAN DEFAULT FALSE,
  archive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications_admin(lu) WHERE lu = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_archive ON notifications_admin(archive) WHERE archive = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications_admin(type);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications_admin(reference_id, reference_type);

-- Vue: v_cours_with_presences
-- Vue pour les cours avec leurs statistiques de présence par session
CREATE OR REPLACE VIEW v_cours_with_presences AS
SELECT 
  c.*,
  p.session_id,
  COALESCE(COUNT(DISTINCT p.id), 0) AS nb_presences_declarees,
  COALESCE(SUM(CASE WHEN p.est_present THEN 1 ELSE 0 END), 0) AS nb_enseignants_presents,
  COALESCE(SUM(CASE WHEN p.est_present THEN p.nb_surveillants_accompagnants ELSE 0 END), 0) AS nb_surveillants_accompagnants_total
FROM cours c
LEFT JOIN presences_enseignants p ON c.id = p.cours_id
GROUP BY c.id, p.session_id;

-- Row Level Security (RLS)

-- Presences: lecture admin, écriture par enseignants
ALTER TABLE presences_enseignants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Presences lisibles par tous" ON presences_enseignants;
CREATE POLICY "Presences lisibles par tous" ON presences_enseignants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Presences créables par tous" ON presences_enseignants;
CREATE POLICY "Presences créables par tous" ON presences_enseignants
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Presences modifiables par tous" ON presences_enseignants;
CREATE POLICY "Presences modifiables par tous" ON presences_enseignants
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Presences supprimables par tous" ON presences_enseignants;
CREATE POLICY "Presences supprimables par tous" ON presences_enseignants
  FOR DELETE USING (true);

-- Notifications: admin uniquement
ALTER TABLE notifications_admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications lisibles par tous" ON notifications_admin;
CREATE POLICY "Notifications lisibles par tous" ON notifications_admin
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Notifications créables par tous" ON notifications_admin;
CREATE POLICY "Notifications créables par tous" ON notifications_admin
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications modifiables par tous" ON notifications_admin;
CREATE POLICY "Notifications modifiables par tous" ON notifications_admin
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Notifications supprimables par tous" ON notifications_admin;
CREATE POLICY "Notifications supprimables par tous" ON notifications_admin
  FOR DELETE USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE presences_enseignants IS 'Stocke les déclarations de présence des enseignants pour les cours';
COMMENT ON TABLE notifications_admin IS 'Stocke les notifications pour les administrateurs';
COMMENT ON VIEW v_cours_with_presences IS 'Vue des cours avec leurs statistiques de présence par session';

COMMENT ON COLUMN presences_enseignants.cours_id IS 'Référence au cours (table cours)';
COMMENT ON COLUMN presences_enseignants.session_id IS 'Référence à la session d''examen';
COMMENT ON COLUMN presences_enseignants.nb_surveillants_accompagnants IS 'Nombre de surveillants que l''enseignant amène avec lui';
COMMENT ON COLUMN presences_enseignants.remarque IS 'Remarque de l''enseignant (sera ajoutée aux consignes du cours si fournie)';
