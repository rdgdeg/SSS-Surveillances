-- ============================================
-- Migration: Gestion de la Présence des Enseignants aux Examens
-- Description: Création des tables pour gérer les examens, les présences des enseignants, et les notifications admin
-- Date: 2025-01-13
-- ============================================

-- Table: examens
-- Stocke les examens avec leurs enseignants responsables
CREATE TABLE IF NOT EXISTS examens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  code_examen VARCHAR(50) NOT NULL,
  nom_examen VARCHAR(500) NOT NULL,
  enseignants TEXT[] NOT NULL DEFAULT '{}', -- Array d'emails des enseignants
  date_examen DATE,
  heure_debut TIME,
  heure_fin TIME,
  saisie_manuelle BOOLEAN DEFAULT FALSE,
  cree_par_email VARCHAR(255), -- Email de l'enseignant qui a créé manuellement
  valide BOOLEAN DEFAULT TRUE, -- FALSE si en attente de validation admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_code_examen UNIQUE(session_id, code_examen)
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_examens_session ON examens(session_id);
CREATE INDEX IF NOT EXISTS idx_examens_code ON examens(code_examen);
CREATE INDEX IF NOT EXISTS idx_examens_saisie_manuelle ON examens(saisie_manuelle) WHERE saisie_manuelle = TRUE;
CREATE INDEX IF NOT EXISTS idx_examens_valide ON examens(valide) WHERE valide = FALSE;

-- Trigger pour mettre à jour updated_at
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

-- Table: presences_enseignants
-- Stocke les déclarations de présence des enseignants
CREATE TABLE IF NOT EXISTS presences_enseignants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examen_id UUID NOT NULL REFERENCES examens(id) ON DELETE CASCADE,
  enseignant_email VARCHAR(255) NOT NULL,
  enseignant_nom VARCHAR(255) NOT NULL,
  enseignant_prenom VARCHAR(255) NOT NULL,
  est_present BOOLEAN NOT NULL,
  nb_surveillants_accompagnants INTEGER DEFAULT 0 CHECK (nb_surveillants_accompagnants >= 0),
  remarque TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_examen_enseignant UNIQUE(examen_id, enseignant_email)
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_presences_examen ON presences_enseignants(examen_id);
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

-- Table: notifications_admin
-- Stocke les notifications pour les administrateurs
CREATE TABLE IF NOT EXISTS notifications_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'examen_manuel', etc.
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID, -- ID de l'entité concernée (examen, etc.)
  reference_type VARCHAR(50), -- 'examen', etc.
  lu BOOLEAN DEFAULT FALSE,
  archive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications_admin(lu) WHERE lu = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_archive ON notifications_admin(archive) WHERE archive = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications_admin(type);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications_admin(reference_id, reference_type);

-- Vue: v_examens_with_presences
-- Vue matérialisée pour les examens avec leurs statistiques de présence
CREATE OR REPLACE VIEW v_examens_with_presences AS
SELECT 
  e.*,
  COALESCE(COUNT(DISTINCT p.id), 0) AS nb_presences_declarees,
  COALESCE(array_length(e.enseignants, 1), 0) AS nb_enseignants_total,
  COALESCE(SUM(CASE WHEN p.est_present THEN 1 ELSE 0 END), 0) AS nb_enseignants_presents,
  COALESCE(SUM(CASE WHEN p.est_present THEN p.nb_surveillants_accompagnants ELSE 0 END), 0) AS nb_surveillants_accompagnants_total
FROM examens e
LEFT JOIN presences_enseignants p ON e.id = p.examen_id
GROUP BY e.id;

-- Row Level Security (RLS)

-- Examens: lecture publique, écriture admin uniquement
ALTER TABLE examens ENABLE ROW LEVEL SECURITY;

-- Politique de lecture: tout le monde peut lire les examens
DROP POLICY IF EXISTS "Examens lisibles par tous" ON examens;
CREATE POLICY "Examens lisibles par tous" ON examens
  FOR SELECT USING (true);

-- Politique d'insertion: tout le monde peut créer (pour saisie manuelle)
DROP POLICY IF EXISTS "Examens créables par tous" ON examens;
CREATE POLICY "Examens créables par tous" ON examens
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour: tout le monde peut modifier (admin validera)
DROP POLICY IF EXISTS "Examens modifiables par tous" ON examens;
CREATE POLICY "Examens modifiables par tous" ON examens
  FOR UPDATE USING (true);

-- Politique de suppression: tout le monde peut supprimer (à restreindre en production)
DROP POLICY IF EXISTS "Examens supprimables par tous" ON examens;
CREATE POLICY "Examens supprimables par tous" ON examens
  FOR DELETE USING (true);

-- Presences: lecture admin, écriture par enseignants
ALTER TABLE presences_enseignants ENABLE ROW LEVEL SECURITY;

-- Politique de lecture: tout le monde peut lire
DROP POLICY IF EXISTS "Presences lisibles par tous" ON presences_enseignants;
CREATE POLICY "Presences lisibles par tous" ON presences_enseignants
  FOR SELECT USING (true);

-- Politique d'insertion: tout le monde peut créer sa présence
DROP POLICY IF EXISTS "Presences créables par tous" ON presences_enseignants;
CREATE POLICY "Presences créables par tous" ON presences_enseignants
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour: tout le monde peut modifier sa présence
DROP POLICY IF EXISTS "Presences modifiables par tous" ON presences_enseignants;
CREATE POLICY "Presences modifiables par tous" ON presences_enseignants
  FOR UPDATE USING (true);

-- Politique de suppression: tout le monde peut supprimer
DROP POLICY IF EXISTS "Presences supprimables par tous" ON presences_enseignants;
CREATE POLICY "Presences supprimables par tous" ON presences_enseignants
  FOR DELETE USING (true);

-- Notifications: admin uniquement
ALTER TABLE notifications_admin ENABLE ROW LEVEL SECURITY;

-- Politique de lecture: tout le monde peut lire (admin)
DROP POLICY IF EXISTS "Notifications lisibles par tous" ON notifications_admin;
CREATE POLICY "Notifications lisibles par tous" ON notifications_admin
  FOR SELECT USING (true);

-- Politique d'insertion: tout le monde peut créer
DROP POLICY IF EXISTS "Notifications créables par tous" ON notifications_admin;
CREATE POLICY "Notifications créables par tous" ON notifications_admin
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour: tout le monde peut modifier
DROP POLICY IF EXISTS "Notifications modifiables par tous" ON notifications_admin;
CREATE POLICY "Notifications modifiables par tous" ON notifications_admin
  FOR UPDATE USING (true);

-- Politique de suppression: tout le monde peut supprimer
DROP POLICY IF EXISTS "Notifications supprimables par tous" ON notifications_admin;
CREATE POLICY "Notifications supprimables par tous" ON notifications_admin
  FOR DELETE USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE examens IS 'Stocke les examens avec leurs enseignants responsables';
COMMENT ON TABLE presences_enseignants IS 'Stocke les déclarations de présence des enseignants aux examens';
COMMENT ON TABLE notifications_admin IS 'Stocke les notifications pour les administrateurs';
COMMENT ON VIEW v_examens_with_presences IS 'Vue des examens avec leurs statistiques de présence';

COMMENT ON COLUMN examens.enseignants IS 'Array d''emails des enseignants responsables';
COMMENT ON COLUMN examens.saisie_manuelle IS 'TRUE si l''examen a été saisi manuellement par un enseignant';
COMMENT ON COLUMN examens.valide IS 'FALSE si l''examen est en attente de validation admin';
COMMENT ON COLUMN presences_enseignants.nb_surveillants_accompagnants IS 'Nombre de surveillants que l''enseignant amène avec lui';
