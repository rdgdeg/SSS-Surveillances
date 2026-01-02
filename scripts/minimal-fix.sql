-- Script minimal pour les corrections essentielles

-- 1. Ajouter le champ code_examen (PRIORITÉ 1)
ALTER TABLE demandes_modification 
ADD COLUMN IF NOT EXISTS code_examen TEXT;

CREATE INDEX IF NOT EXISTS idx_demandes_modification_code_examen 
ON demandes_modification(code_examen);

-- 2. Vérifier que c'est ajouté
SELECT 
    'Code examen ajouté' as status,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'demandes_modification' 
AND column_name = 'code_examen';

-- 3. Diagnostic du versioning (sans test qui peut échouer)
SELECT 
    'Tables versioning' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'MANQUANT' END as status
FROM information_schema.tables 
WHERE table_name IN ('data_versions', 'version_snapshots', 'versioning_metadata');

SELECT 
    'Triggers versioning' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'MANQUANT' END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%';

-- 4. Afficher les versions récentes (si elles existent)
SELECT 
    'Versions récentes' as info,
    COUNT(*) as total,
    MAX(created_at) as derniere_version
FROM data_versions 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 5. Configuration versioning (si elle existe)
SELECT 
    'Configuration versioning' as info,
    table_name,
    is_enabled
FROM versioning_metadata 
WHERE is_enabled = true
ORDER BY table_name;

-- Message de fin
SELECT 'CORRECTION TERMINÉE - Redémarrez l''application' as message;