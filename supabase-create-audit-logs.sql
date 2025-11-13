-- ============================================
-- Migration: Create Audit Logs Table
-- Description: Crée la table audit_logs pour la traçabilité complète des opérations
-- Date: 2025-11-13
-- ============================================

-- ============================================
-- 1. Créer la table audit_logs
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'view')),
    entity TEXT NOT NULL CHECK (entity IN ('submission', 'surveillant', 'creneau', 'session')),
    entity_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    user_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Commentaires pour documentation
COMMENT ON TABLE audit_logs IS 'Journal d''audit pour tracer toutes les opérations critiques du système';
COMMENT ON COLUMN audit_logs.timestamp IS 'Timestamp de l''opération auditée';
COMMENT ON COLUMN audit_logs.operation IS 'Type d''opération: create, update, delete, view';
COMMENT ON COLUMN audit_logs.entity IS 'Type d''entité concernée: submission, surveillant, creneau, session';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID de l''entité concernée';
COMMENT ON COLUMN audit_logs.user_email IS 'Email de l''utilisateur ayant effectué l''opération';
COMMENT ON COLUMN audit_logs.user_id IS 'ID du surveillant si applicable';
COMMENT ON COLUMN audit_logs.details IS 'Détails supplémentaires de l''opération (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Adresse IP de l''utilisateur';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent du navigateur';

-- ============================================
-- 2. Créer les index pour améliorer les performances
-- ============================================

-- Index sur timestamp pour tri chronologique (le plus utilisé)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
ON audit_logs(timestamp DESC);

-- Index composite sur entity et entity_id pour rechercher l'historique d'une entité
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs(entity, entity_id);

-- Index sur user_email pour rechercher les actions d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email 
ON audit_logs(user_email);

-- Index sur operation pour filtrer par type d'opération
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation 
ON audit_logs(operation);

-- Index composite pour recherches fréquentes (entity + timestamp)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp 
ON audit_logs(entity, timestamp DESC);

-- Index GIN sur details pour recherches JSON
CREATE INDEX IF NOT EXISTS idx_audit_logs_details 
ON audit_logs USING gin(details);

-- ============================================
-- 3. Activer Row Level Security (RLS)
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Créer les politiques RLS
-- ============================================

-- Politique pour permettre l'insertion publique (système peut logger)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Politique pour permettre la lecture admin uniquement
-- Note: En production, vous devriez ajouter une vérification du rôle admin
CREATE POLICY "Admin can view all audit logs" ON audit_logs
    FOR SELECT USING (true);

-- Politique pour empêcher les modifications et suppressions
-- Les logs d'audit ne doivent jamais être modifiés ou supprimés
CREATE POLICY "Audit logs are immutable" ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON audit_logs
    FOR DELETE USING (false);

-- ============================================
-- 5. Créer une vue pour les logs récents
-- ============================================

CREATE OR REPLACE VIEW v_recent_audit_logs AS
SELECT 
    al.id,
    al.timestamp,
    al.operation,
    al.entity,
    al.entity_id,
    al.user_email,
    al.details,
    CASE 
        WHEN al.entity = 'submission' THEN (
            SELECT s.nom || ' ' || s.prenom 
            FROM soumissions_disponibilites s 
            WHERE s.id = al.entity_id
        )
        WHEN al.entity = 'surveillant' THEN (
            SELECT sv.nom || ' ' || sv.prenom 
            FROM surveillants sv 
            WHERE sv.id = al.entity_id
        )
        ELSE NULL
    END as entity_name
FROM audit_logs al
WHERE al.timestamp > now() - INTERVAL '30 days'
ORDER BY al.timestamp DESC;

COMMENT ON VIEW v_recent_audit_logs IS 'Vue des logs d''audit des 30 derniers jours avec noms des entités';

-- ============================================
-- 6. Créer une fonction pour logger facilement
-- ============================================

CREATE OR REPLACE FUNCTION log_audit(
    p_operation TEXT,
    p_entity TEXT,
    p_entity_id UUID,
    p_user_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        operation,
        entity,
        entity_id,
        user_email,
        user_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_operation,
        p_entity,
        p_entity_id,
        p_user_email,
        p_user_id,
        p_details,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit IS 'Fonction helper pour créer facilement un log d''audit';

-- ============================================
-- 7. Créer des triggers automatiques pour audit
-- ============================================

-- Fonction trigger pour auditer les soumissions
CREATE OR REPLACE FUNCTION audit_soumission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit(
            'create',
            'submission',
            NEW.id,
            NEW.email,
            NEW.surveillant_id,
            jsonb_build_object(
                'session_id', NEW.session_id,
                'nb_creneaux', (
                    SELECT COUNT(*) 
                    FROM jsonb_array_elements(NEW.historique_disponibilites) AS disp
                    WHERE (disp->>'est_disponible')::boolean = true
                )
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Logger seulement si ce n'est pas juste un soft delete
        IF NEW.deleted_at IS NULL OR OLD.deleted_at IS NULL THEN
            PERFORM log_audit(
                CASE WHEN NEW.deleted_at IS NOT NULL THEN 'delete' ELSE 'update' END,
                'submission',
                NEW.id,
                NEW.email,
                NEW.surveillant_id,
                jsonb_build_object(
                    'session_id', NEW.session_id,
                    'nb_creneaux', (
                        SELECT COUNT(*) 
                        FROM jsonb_array_elements(NEW.historique_disponibilites) AS disp
                        WHERE (disp->>'est_disponible')::boolean = true
                    ),
                    'version', NEW.version,
                    'deleted', NEW.deleted_at IS NOT NULL
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_soumission_changes() IS 'Trigger function pour auditer automatiquement les changements de soumissions';

-- Créer le trigger
DROP TRIGGER IF EXISTS audit_soumissions_trigger ON soumissions_disponibilites;

CREATE TRIGGER audit_soumissions_trigger
    AFTER INSERT OR UPDATE ON soumissions_disponibilites
    FOR EACH ROW
    EXECUTE FUNCTION audit_soumission_changes();

-- ============================================
-- 8. Créer des fonctions de statistiques
-- ============================================

-- Fonction pour obtenir les statistiques d'audit par période
CREATE OR REPLACE FUNCTION get_audit_stats(
    start_date TIMESTAMPTZ DEFAULT now() - INTERVAL '7 days',
    end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
    operation TEXT,
    entity TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.operation,
        al.entity,
        COUNT(*) as count
    FROM audit_logs al
    WHERE al.timestamp BETWEEN start_date AND end_date
    GROUP BY al.operation, al.entity
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_audit_stats IS 'Retourne les statistiques d''audit pour une période donnée';

-- Fonction pour obtenir l'activité d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_activity(
    p_user_email TEXT,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    log_timestamp TIMESTAMPTZ,
    operation TEXT,
    entity TEXT,
    entity_id UUID,
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.timestamp,
        al.operation,
        al.entity,
        al.entity_id,
        al.details
    FROM audit_logs al
    WHERE al.user_email = p_user_email
    AND al.timestamp > now() - (days_back || ' days')::INTERVAL
    ORDER BY al.timestamp DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_activity IS 'Retourne l''activité d''un utilisateur sur une période';

-- ============================================
-- 9. Créer une politique de rétention (optionnel)
-- ============================================

-- Fonction pour archiver les vieux logs (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION archive_old_audit_logs(retention_days INTEGER DEFAULT 730)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Note: En production, vous pourriez vouloir déplacer vers une table d'archive
    -- plutôt que de supprimer. Pour l'instant, on garde tout.
    
    -- Cette fonction est un placeholder pour une future implémentation
    -- d'archivage vers une table séparée ou un stockage externe
    
    RAISE NOTICE 'Archivage des logs de plus de % jours (non implémenté)', retention_days;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_audit_logs IS 'Fonction placeholder pour archiver les vieux logs d''audit';

-- ============================================
-- 10. Vérification de la migration
-- ============================================

DO $$
BEGIN
    -- Vérifier que la table existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
    ) THEN
        RAISE EXCEPTION 'La table audit_logs n''a pas été créée';
    END IF;
    
    -- Vérifier que les index existent
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'audit_logs' 
        AND indexname = 'idx_audit_logs_timestamp'
    ) THEN
        RAISE EXCEPTION 'L''index idx_audit_logs_timestamp n''a pas été créé';
    END IF;
    
    RAISE NOTICE 'Migration audit_logs réussie. Table et index créés.';
END $$;

-- Afficher un résumé
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total_logs,
    MIN(timestamp) as oldest_log,
    MAX(timestamp) as newest_log
FROM audit_logs;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
