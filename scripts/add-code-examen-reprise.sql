-- Script pour ajouter le champ code examen de reprise pour les permutations

-- 1. Ajouter le champ surveillance_reprise_code_examen
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS surveillance_reprise_code_examen TEXT;

-- 2. Créer l'index
CREATE INDEX IF NOT EXISTS idx_demandes_modification_surveillance_reprise_code_examen 
ON demandes_modification(surveillance_reprise_code_examen);

-- 3. Vérifier que le champ a été ajouté
SELECT 
    'Champ surveillance_reprise_code_examen' as status,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'surveillance_reprise_code_examen';

-- 4. Afficher la structure complète de la table
SELECT 
    'Structure complète demandes_modification' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'demandes_modification'
ORDER BY ordinal_position;

-- Message de confirmation
SELECT 'CHAMP AJOUTÉ - Redémarrez l''application pour voir les changements' as message;