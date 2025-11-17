-- Ajout de nouveaux champs pour les présences enseignants

-- Type de présence de l'enseignant
CREATE TYPE presence_type AS ENUM (
    'present_full',      -- Présent pour surveillance complète (retire 1 surveillant)
    'present_partial',   -- Présent mais pas pour toute la surveillance (compte 1 surveillant)
    'absent'            -- Absent
);

-- Type d'examen
CREATE TYPE exam_type AS ENUM (
    'ecrit',    -- Examen écrit
    'qcm',      -- QCM
    'autre'     -- Autre (à préciser)
);

-- Ajouter les nouveaux champs à la table presences_enseignants
ALTER TABLE presences_enseignants 
ADD COLUMN IF NOT EXISTS type_presence presence_type DEFAULT 'present_full',
ADD COLUMN IF NOT EXISTS type_examen exam_type,
ADD COLUMN IF NOT EXISTS type_examen_autre TEXT,
ADD COLUMN IF NOT EXISTS historique_remarques JSONB DEFAULT '[]'::jsonb;

-- Migrer les données existantes
-- Si est_present = true, on considère que c'est present_full
-- Si est_present = false, on considère que c'est absent
UPDATE presences_enseignants
SET type_presence = CASE 
    WHEN est_present = true THEN 'present_full'::presence_type
    ELSE 'absent'::presence_type
END
WHERE type_presence IS NULL;

-- Créer un index sur type_presence pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_presences_type_presence ON presences_enseignants(type_presence);

-- Fonction pour ajouter une remarque à l'historique
CREATE OR REPLACE FUNCTION add_remarque_to_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la remarque a changé et n'est pas vide, l'ajouter à l'historique
    IF NEW.remarque IS NOT NULL AND NEW.remarque != '' AND 
       (OLD.remarque IS NULL OR OLD.remarque != NEW.remarque) THEN
        NEW.historique_remarques = COALESCE(NEW.historique_remarques, '[]'::jsonb) || 
            jsonb_build_object(
                'date', NOW(),
                'enseignant_email', NEW.enseignant_email,
                'enseignant_nom', NEW.enseignant_nom || ' ' || NEW.enseignant_prenom,
                'remarque', NEW.remarque
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour l'historique des remarques
DROP TRIGGER IF EXISTS trigger_add_remarque_history ON presences_enseignants;
CREATE TRIGGER trigger_add_remarque_history
    BEFORE UPDATE ON presences_enseignants
    FOR EACH ROW
    EXECUTE FUNCTION add_remarque_to_history();

-- Commentaires pour la documentation
COMMENT ON COLUMN presences_enseignants.type_presence IS 'Type de présence: present_full (surveillance complète), present_partial (présence partielle), absent';
COMMENT ON COLUMN presences_enseignants.type_examen IS 'Type d''examen: ecrit, qcm, autre';
COMMENT ON COLUMN presences_enseignants.type_examen_autre IS 'Précision si type_examen = autre';
COMMENT ON COLUMN presences_enseignants.historique_remarques IS 'Historique des remarques ajoutées par différents enseignants';
