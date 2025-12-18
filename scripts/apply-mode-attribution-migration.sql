-- Application sécurisée de la migration mode_attribution

-- 1. Vérifier si la colonne existe déjà
DO $$
BEGIN
    -- Vérifier si la colonne mode_attribution existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'examen_auditoires' 
        AND column_name = 'mode_attribution'
    ) THEN
        -- Ajouter la colonne avec la valeur par défaut
        ALTER TABLE examen_auditoires 
        ADD COLUMN mode_attribution VARCHAR(20) DEFAULT 'auditoire' 
        CHECK (mode_attribution IN ('auditoire', 'secretariat'));
        
        -- Ajouter le commentaire
        COMMENT ON COLUMN examen_auditoires.mode_attribution IS 
        'Mode d''attribution des surveillants: "auditoire" = attribution directe à un auditoire, "secretariat" = surveillants sélectionnés mais auditoires attribués par le secrétariat';
        
        RAISE NOTICE 'Colonne mode_attribution ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne mode_attribution existe déjà';
    END IF;
END $$;

-- 2. Vérifier le résultat
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'examen_auditoires' 
AND column_name = 'mode_attribution';

-- 3. Mettre à jour les données existantes pour s'assurer qu'elles ont la valeur par défaut
UPDATE examen_auditoires 
SET mode_attribution = 'auditoire' 
WHERE mode_attribution IS NULL;

-- 4. Vérifier quelques enregistrements
SELECT 
    id,
    auditoire,
    mode_attribution,
    nb_surveillants_requis
FROM examen_auditoires 
LIMIT 5;