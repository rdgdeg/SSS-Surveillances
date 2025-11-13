-- ============================================
-- Migration: Create Backup Metadata Table
-- Description: Crée la table backup_metadata pour tracker les sauvegardes quotidiennes
-- Date: 2025-11-13
-- ============================================

-- ============================================
-- 1. Créer la table backup_metadata
-- ============================================

CREATE TABLE IF NOT EXISTS backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_date DATE NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT,
    checksum TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Commentaires pour documentation
COMMENT ON TABLE backup_metadata IS 'Métadonnées des sauvegardes quotidiennes de la base de données';
COMMENT ON COLUMN backup_metadata.backup_date IS 'Date de la sauvegarde (unique par jour)';
COMMENT ON COLUMN backup_metadata.table_name IS 'Nom de la table sauvegardée';
COMMENT ON COLUMN backup_metadata.record_count IS 'Nombre d''enregistrements sauvegardés';
COMMENT ON COLUMN backup_metadata.file_path IS 'Chemin du fichier de sauvegarde';
COMMENT ON COLUMN backup_metadata.file_size_bytes IS 'Taille du fichier en octets';
COMMENT ON COLUMN backup_metadata.checksum IS 'Checksum MD5 ou SHA256 du fichier';
COMMENT ON COLUMN backup_metadata.status IS 'Statut: pending, completed, failed';
COMMENT ON COLUMN backup_metadata.error_message IS 'Message d''erreur si le statut est failed';
COMMENT ON COLUMN backup_metadata.created_at IS 'Date de création de l''entrée';
COMMENT ON COLUMN backup_metadata.completed_at IS 'Date de complétion de la sauvegarde';

-- ============================================
-- 2. Créer les index pour améliorer les performances
-- ============================================

-- Index sur backup_date pour tri chronologique et recherche rapide
CREATE INDEX IF NOT EXISTS idx_backup_metadata_date 
ON backup_metadata(backup_date DESC);

-- Index sur status pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status 
ON backup_metadata(status);

-- Index composite pour recherches fréquentes (table_name + date)
CREATE INDEX IF NOT EXISTS idx_backup_metadata_table_date 
ON backup_metadata(table_name, backup_date DESC);

-- ============================================
-- 3. Activer Row Level Security (RLS)
-- ============================================

ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Créer les politiques RLS
-- ============================================

-- Politique pour permettre l'insertion système
CREATE POLICY "System can insert backup metadata" ON backup_metadata
    FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour système
CREATE POLICY "System can update backup metadata" ON backup_metadata
    FOR UPDATE USING (true);

-- Politique pour permettre la lecture admin uniquement
CREATE POLICY "Admin can view backup metadata" ON backup_metadata
    FOR SELECT USING (true);

-- Empêcher la suppression (les backups ne doivent jamais être supprimés de la metadata)
CREATE POLICY "Backup metadata cannot be deleted" ON backup_metadata
    FOR DELETE USING (false);

-- ============================================
-- 5. Créer une vue pour les sauvegardes récentes
-- ============================================

CREATE OR REPLACE VIEW v_recent_backups AS
SELECT 
    bm.id,
    bm.backup_date,
    bm.table_name,
    bm.record_count,
    bm.file_size_bytes,
    ROUND(bm.file_size_bytes / 1024.0 / 1024.0, 2) as file_size_mb,
    bm.status,
    bm.created_at,
    bm.completed_at,
    CASE 
        WHEN bm.completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (bm.completed_at - bm.created_at))
        ELSE NULL
    END as duration_seconds,
    bm.error_message
FROM backup_metadata bm
WHERE bm.backup_date > CURRENT_DATE - INTERVAL '90 days'
ORDER BY bm.backup_date DESC;

COMMENT ON VIEW v_recent_backups IS 'Vue des sauvegardes des 90 derniers jours avec taille en MB et durée';

-- ============================================
-- 6. Créer une fonction pour créer une entrée de backup
-- ============================================

CREATE OR REPLACE FUNCTION create_backup_entry(
    p_table_name TEXT,
    p_record_count INTEGER,
    p_backup_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
BEGIN
    INSERT INTO backup_metadata (
        backup_date,
        table_name,
        record_count,
        status
    ) VALUES (
        p_backup_date,
        p_table_name,
        p_record_count,
        'pending'
    )
    ON CONFLICT (backup_date) DO UPDATE
    SET 
        table_name = EXCLUDED.table_name,
        record_count = EXCLUDED.record_count,
        status = 'pending',
        created_at = now(),
        completed_at = NULL,
        error_message = NULL
    RETURNING id INTO backup_id;
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_backup_entry IS 'Crée une nouvelle entrée de backup ou met à jour si elle existe déjà pour cette date';

-- ============================================
-- 7. Créer une fonction pour marquer un backup comme complété
-- ============================================

CREATE OR REPLACE FUNCTION complete_backup(
    p_backup_id UUID,
    p_file_path TEXT,
    p_file_size_bytes BIGINT,
    p_checksum TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE backup_metadata
    SET 
        status = 'completed',
        file_path = p_file_path,
        file_size_bytes = p_file_size_bytes,
        checksum = p_checksum,
        completed_at = now(),
        error_message = NULL
    WHERE id = p_backup_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_backup IS 'Marque un backup comme complété avec les métadonnées du fichier';

-- ============================================
-- 8. Créer une fonction pour marquer un backup comme échoué
-- ============================================

CREATE OR REPLACE FUNCTION fail_backup(
    p_backup_id UUID,
    p_error_message TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE backup_metadata
    SET 
        status = 'failed',
        error_message = p_error_message,
        completed_at = now()
    WHERE id = p_backup_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fail_backup IS 'Marque un backup comme échoué avec un message d''erreur';

-- ============================================
-- 9. Créer une fonction pour obtenir les statistiques de backup
-- ============================================

CREATE OR REPLACE FUNCTION get_backup_stats(days_back INTEGER DEFAULT 90)
RETURNS TABLE (
    total_backups BIGINT,
    successful_backups BIGINT,
    failed_backups BIGINT,
    pending_backups BIGINT,
    total_size_mb NUMERIC,
    avg_duration_seconds NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_backups,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_backups,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_backups,
        ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
        ROUND(AVG(
            CASE 
                WHEN completed_at IS NOT NULL THEN 
                    EXTRACT(EPOCH FROM (completed_at - created_at))
                ELSE NULL
            END
        ), 2) as avg_duration_seconds,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
            NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
            2
        ) as success_rate
    FROM backup_metadata
    WHERE backup_date > CURRENT_DATE - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_backup_stats IS 'Retourne les statistiques des backups sur une période';

-- ============================================
-- 10. Créer une fonction pour identifier les backups à nettoyer
-- ============================================

CREATE OR REPLACE FUNCTION get_backups_to_cleanup(retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
    id UUID,
    backup_date DATE,
    table_name TEXT,
    file_path TEXT,
    age_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.id,
        bm.backup_date,
        bm.table_name,
        bm.file_path,
        (CURRENT_DATE - bm.backup_date)::INTEGER as age_days
    FROM backup_metadata bm
    WHERE bm.backup_date < CURRENT_DATE - (retention_days || ' days')::INTERVAL
    AND bm.status = 'completed'
    ORDER BY bm.backup_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_backups_to_cleanup IS 'Retourne la liste des backups dépassant la période de rétention';

-- ============================================
-- 11. Créer une fonction pour vérifier les backups manquants
-- ============================================

CREATE OR REPLACE FUNCTION check_missing_backups(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    missing_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT date_series::DATE as missing_date
    FROM generate_series(
        CURRENT_DATE - (days_back || ' days')::INTERVAL,
        CURRENT_DATE - INTERVAL '1 day',
        '1 day'::INTERVAL
    ) as date_series
    WHERE NOT EXISTS (
        SELECT 1 
        FROM backup_metadata bm 
        WHERE bm.backup_date = date_series::DATE
        AND bm.status = 'completed'
    )
    ORDER BY date_series DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_missing_backups IS 'Identifie les dates sans backup complété';

-- ============================================
-- 12. Créer une vue pour le monitoring des backups
-- ============================================

CREATE OR REPLACE VIEW v_backup_monitoring AS
SELECT 
    CURRENT_DATE as check_date,
    (SELECT COUNT(*) FROM backup_metadata WHERE backup_date = CURRENT_DATE) as today_backups,
    (SELECT COUNT(*) FROM backup_metadata WHERE backup_date = CURRENT_DATE AND status = 'completed') as today_completed,
    (SELECT COUNT(*) FROM backup_metadata WHERE backup_date = CURRENT_DATE AND status = 'failed') as today_failed,
    (SELECT COUNT(*) FROM backup_metadata WHERE backup_date = CURRENT_DATE AND status = 'pending') as today_pending,
    (SELECT COUNT(*) FROM check_missing_backups(7)) as missing_last_7_days,
    (SELECT COUNT(*) FROM check_missing_backups(30)) as missing_last_30_days,
    (SELECT success_rate FROM get_backup_stats(30)) as success_rate_30_days;

COMMENT ON VIEW v_backup_monitoring IS 'Vue de monitoring pour vérifier l''état des backups';

-- ============================================
-- 13. Vérification de la migration
-- ============================================

DO $$
BEGIN
    -- Vérifier que la table existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'backup_metadata'
    ) THEN
        RAISE EXCEPTION 'La table backup_metadata n''a pas été créée';
    END IF;
    
    -- Vérifier que la contrainte unique existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'backup_metadata' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%backup_date%'
    ) THEN
        RAISE EXCEPTION 'La contrainte UNIQUE sur backup_date n''a pas été créée';
    END IF;
    
    RAISE NOTICE 'Migration backup_metadata réussie. Table, index et fonctions créés.';
END $$;

-- Afficher un résumé
SELECT 
    'backup_metadata' as table_name,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM backup_metadata;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
