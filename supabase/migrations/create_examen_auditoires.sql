-- Création de la table pour gérer les auditoires et surveillants par examen
-- Un examen peut avoir plusieurs auditoires, chaque auditoire a ses propres surveillants

-- Table de liaison examen_auditoires
CREATE TABLE IF NOT EXISTS examen_auditoires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examen_id UUID NOT NULL REFERENCES examens(id) ON DELETE CASCADE,
    auditoire TEXT NOT NULL,
    nb_surveillants_requis INTEGER DEFAULT 1,
    surveillants UUID[] DEFAULT '{}', -- Array d'IDs de surveillants
    remarques TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte d'unicité : un auditoire par examen
    UNIQUE(examen_id, auditoire)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_examen_auditoires_examen_id ON examen_auditoires(examen_id);
CREATE INDEX IF NOT EXISTS idx_examen_auditoires_surveillants ON examen_auditoires USING GIN(surveillants);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_examen_auditoires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_examen_auditoires_updated_at
    BEFORE UPDATE ON examen_auditoires
    FOR EACH ROW
    EXECUTE FUNCTION update_examen_auditoires_updated_at();

-- RLS (Row Level Security)
ALTER TABLE examen_auditoires ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre la lecture publique (pour le planning public)
CREATE POLICY "Allow public read access to examen_auditoires"
ON examen_auditoires FOR SELECT
USING (true);

-- Policy pour permettre toutes les opérations (pour l'admin)
CREATE POLICY "Allow all operations on examen_auditoires"
ON examen_auditoires FOR ALL
USING (true)
WITH CHECK (true);

-- Commentaires pour la documentation
COMMENT ON TABLE examen_auditoires IS 'Gestion des auditoires et surveillants par examen';
COMMENT ON COLUMN examen_auditoires.examen_id IS 'Référence à l''examen';
COMMENT ON COLUMN examen_auditoires.auditoire IS 'Nom de l''auditoire (ex: Auditoire A, Salle 101)';
COMMENT ON COLUMN examen_auditoires.nb_surveillants_requis IS 'Nombre de surveillants nécessaires pour cet auditoire';
COMMENT ON COLUMN examen_auditoires.surveillants IS 'Array d''UUIDs des surveillants assignés';
COMMENT ON COLUMN examen_auditoires.remarques IS 'Remarques spécifiques pour cet auditoire';

-- Vue pour faciliter les requêtes avec les noms des surveillants
CREATE OR REPLACE VIEW v_examen_auditoires_with_surveillants AS
SELECT 
    ea.id,
    ea.examen_id,
    ea.auditoire,
    ea.nb_surveillants_requis,
    ea.surveillants,
    ea.remarques,
    ea.created_at,
    ea.updated_at,
    -- Agréger les noms des surveillants
    COALESCE(
        array_agg(
            s.nom || ' ' || s.prenom 
            ORDER BY s.nom, s.prenom
        ) FILTER (WHERE s.id IS NOT NULL),
        '{}'::text[]
    ) as surveillants_noms
FROM examen_auditoires ea
LEFT JOIN LATERAL unnest(ea.surveillants) AS surveillant_id ON true
LEFT JOIN surveillants s ON s.id = surveillant_id
GROUP BY ea.id, ea.examen_id, ea.auditoire, ea.nb_surveillants_requis, 
         ea.surveillants, ea.remarques, ea.created_at, ea.updated_at;

COMMENT ON VIEW v_examen_auditoires_with_surveillants IS 'Vue avec les noms des surveillants pour faciliter l''affichage';
