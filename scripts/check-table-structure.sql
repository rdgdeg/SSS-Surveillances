-- Script pour vérifier la structure des tables avant les corrections

-- 1. Vérifier la structure de la table sessions
SELECT 
    'Structure table sessions' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table examens
SELECT 
    'Structure table examens' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'examens'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table demandes_modification
SELECT 
    'Structure table demandes_modification' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'demandes_modification'
ORDER BY ordinal_position;

-- 4. Vérifier les tables de versioning
SELECT 
    'Tables de versioning existantes' as info,
    table_name
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');

-- 5. Vérifier les triggers existants
SELECT 
    'Triggers de versioning' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%'
ORDER BY event_object_table;