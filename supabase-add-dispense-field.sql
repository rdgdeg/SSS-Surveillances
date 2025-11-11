-- ============================================
-- Ajout du champ dispense_surveillance
-- ============================================

-- Ajouter le champ dispense_surveillance à la table surveillants
ALTER TABLE surveillants 
ADD COLUMN IF NOT EXISTS dispense_surveillance BOOLEAN DEFAULT false;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_surveillants_dispense ON surveillants(dispense_surveillance);

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN surveillants.dispense_surveillance IS 'Indique si le surveillant est dispensé de surveillance pour la session en cours';

-- Vérifier que le champ a été ajouté
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'surveillants' 
AND column_name = 'dispense_surveillance';
