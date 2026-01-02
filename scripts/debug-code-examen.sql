-- Script de diagnostic pour le champ code_examen

-- 1. Vérifier si le champ code_examen existe dans la base
SELECT 
    'Champ code_examen dans la base' as check_name,
    CASE 
        WHEN column_name IS NOT NULL THEN 'PRÉSENT' 
        ELSE 'MANQUANT' 
    END as status,
    COALESCE(data_type, 'N/A') as type_donnee
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';

-- 2. Afficher toutes les colonnes de la table demandes_modification
SELECT 
    'Colonnes table demandes_modification' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'demandes_modification'
ORDER BY ordinal_position;

-- 3. Vérifier s'il y a des demandes existantes
SELECT 
    'Demandes existantes' as info,
    COUNT(*) as total_demandes,
    COUNT(code_examen) as demandes_avec_code
FROM demandes_modification;

-- 4. Si le champ n'existe pas, l'ajouter
DO $$
BEGIN
    -- Vérifier si la colonne existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_modification' 
        AND column_name = 'code_examen'
    ) THEN
        -- Ajouter la colonne
        ALTER TABLE demandes_modification 
        ADD COLUMN code_examen TEXT;
        
        -- Créer l'index
        CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
        ON demandes_modification(code_examen);
        
        RAISE NOTICE 'Colonne code_examen ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne code_examen déjà présente';
    END IF;
END $$;

-- 5. Vérification finale
SELECT 
    'Vérification finale' as check_name,
    column_name,
    data_type,
    'AJOUTÉ AVEC SUCCÈS' as status
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';