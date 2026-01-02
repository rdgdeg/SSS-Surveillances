-- Script simplifié pour corriger le versioning et ajouter le code examen

-- 1. Ajouter le champ code_examen aux demandes de modification
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS code_examen TEXT;

CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
ON demandes_modification(code_examen);

-- 2. Vérifier que les tables de versioning existent
SELECT 
    'Tables de versioning' as check_name,
    CASE WHEN COUNT(*) = 3 THEN 'OK' ELSE 'ERROR' END as status,
    'Tables trouvées: ' || COUNT(*) as message
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');

-- 3. Vérifier les triggers
SELECT 
    'Triggers installés' as check_name,
    CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'WARNING' END as status,
    'Triggers actifs: ' || COUNT(*) as message
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%';

-- 4. Vérifier la configuration
SELECT 
    'Configuration des tables' as check_name,
    CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'WARNING' END as status,
    'Tables configurées: ' || COUNT(*) as message
FROM versioning_metadata 
WHERE is_enabled = true;

-- 5. Test simple avec la table examens (plus sûre)
DO $$
DECLARE
    v_test_id UUID;
    v_version_count INTEGER;
    v_table_exists BOOLEAN := FALSE;
BEGIN
    -- Vérifier si la table examens existe et a une colonne id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'examens' AND column_name = 'id'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        -- Essayer d'insérer un examen de test
        BEGIN
            INSERT INTO examens (code, nom, date, heure, duree, type_examen)
            VALUES ('TEST001', 'Test Versioning', '2024-01-01', '09:00', 120, 'Écrit')
            RETURNING id INTO v_test_id;
            
            -- Vérifier qu'une version a été créée
            SELECT COUNT(*) INTO v_version_count
            FROM data_versions 
            WHERE table_name = 'examens' AND record_id = v_test_id::TEXT;
            
            RAISE NOTICE 'Test INSERT examens: % versions créées', v_version_count;
            
            -- Modifier l'examen
            UPDATE examens 
            SET nom = 'Test Versioning Modifié'
            WHERE id = v_test_id;
            
            -- Vérifier les versions
            SELECT COUNT(*) INTO v_version_count
            FROM data_versions 
            WHERE table_name = 'examens' AND record_id = v_test_id::TEXT;
            
            RAISE NOTICE 'Test UPDATE examens: % versions totales', v_version_count;
            
            -- Nettoyer
            DELETE FROM examens WHERE id = v_test_id;
            DELETE FROM data_versions WHERE record_id = v_test_id::TEXT;
            DELETE FROM version_snapshots WHERE record_id = v_test_id::TEXT;
            
            RAISE NOTICE 'Test terminé et nettoyé';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors du test avec examens: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Table examens non trouvée ou structure différente';
    END IF;
END $$;

-- 6. Afficher les versions récentes pour vérifier l'activité
SELECT 
    'Activité récente' as info,
    COUNT(*) as versions_7_derniers_jours
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 7. Afficher la configuration actuelle
SELECT 
    'Configuration actuelle' as info,
    table_name,
    is_enabled,
    retention_days,
    max_versions_per_record
FROM versioning_metadata 
WHERE is_enabled = true
ORDER BY table_name;

-- 8. Vérifier que le champ code_examen a été ajouté
SELECT 
    'Champ code_examen' as info,
    CASE WHEN column_name IS NOT NULL THEN 'AJOUTÉ' ELSE 'MANQUANT' END as status
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';

-- 9. Afficher la structure des tables principales pour diagnostic
SELECT 
    'Structure sessions' as table_info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position
LIMIT 5;

SELECT 
    'Structure examens' as table_info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'examens'
ORDER BY ordinal_position
LIMIT 5;

COMMIT;