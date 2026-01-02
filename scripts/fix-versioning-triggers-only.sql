-- Script pour corriger uniquement les triggers de versioning

-- Fonction améliorée pour enregistrer les versions avec gestion d'erreur
CREATE OR REPLACE FUNCTION trigger_record_version() RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT := 'system';
    v_username TEXT := 'Système';
    v_operation_reason TEXT;
BEGIN
    -- Essayer de récupérer l'utilisateur depuis les variables de session
    BEGIN
        v_user_id := current_setting('app.current_user_id', true);
        v_username := current_setting('app.current_username', true);
        
        -- Si les valeurs sont vides, utiliser les valeurs par défaut
        IF v_user_id IS NULL OR v_user_id = '' THEN
            v_user_id := 'system';
        END IF;
        
        IF v_username IS NULL OR v_username = '' THEN
            v_username := 'Système';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- En cas d'erreur, garder les valeurs par défaut
        v_user_id := 'system';
        v_username := 'Système';
    END;
    
    -- Définir la raison selon l'opération
    CASE TG_OP
        WHEN 'DELETE' THEN v_operation_reason := 'Suppression automatique';
        WHEN 'UPDATE' THEN v_operation_reason := 'Modification automatique';
        WHEN 'INSERT' THEN v_operation_reason := 'Création automatique';
        ELSE v_operation_reason := 'Opération automatique';
    END CASE;
    
    -- Enregistrer la version selon le type d'opération
    BEGIN
        IF TG_OP = 'DELETE' THEN
            PERFORM record_version(
                TG_TABLE_NAME, 
                OLD.id::TEXT, 
                'DELETE',
                row_to_json(OLD)::JSONB, 
                NULL,
                v_user_id, 
                v_username, 
                v_operation_reason
            );
            RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
            PERFORM record_version(
                TG_TABLE_NAME, 
                NEW.id::TEXT, 
                'UPDATE',
                row_to_json(OLD)::JSONB, 
                row_to_json(NEW)::JSONB,
                v_user_id, 
                v_username, 
                v_operation_reason
            );
            RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
            PERFORM record_version(
                TG_TABLE_NAME, 
                NEW.id::TEXT, 
                'INSERT',
                NULL, 
                row_to_json(NEW)::JSONB,
                v_user_id, 
                v_username, 
                v_operation_reason
            );
            RETURN NEW;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- En cas d'erreur dans l'enregistrement de version, continuer l'opération
        RAISE WARNING 'Erreur lors de l''enregistrement de version pour %: %', TG_TABLE_NAME, SQLERRM;
        
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Vérifier que les triggers sont bien installés
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%'
ORDER BY event_object_table;

-- Si aucun trigger n'est trouvé, les réinstaller
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE 'trigger_version_%';
    
    IF trigger_count < 5 THEN
        RAISE NOTICE 'Réinstallation des triggers de versioning...';
        
        -- Créer les triggers pour les tables principales
        DROP TRIGGER IF EXISTS trigger_version_sessions ON sessions CASCADE;
        CREATE TRIGGER trigger_version_sessions 
            AFTER INSERT OR UPDATE OR DELETE ON sessions
            FOR EACH ROW EXECUTE FUNCTION trigger_record_version();
            
        DROP TRIGGER IF EXISTS trigger_version_examens ON examens CASCADE;
        CREATE TRIGGER trigger_version_examens 
            AFTER INSERT OR UPDATE OR DELETE ON examens
            FOR EACH ROW EXECUTE FUNCTION trigger_record_version();
            
        DROP TRIGGER IF EXISTS trigger_version_surveillants ON surveillants CASCADE;
        CREATE TRIGGER trigger_version_surveillants 
            AFTER INSERT OR UPDATE OR DELETE ON surveillants
            FOR EACH ROW EXECUTE FUNCTION trigger_record_version();
            
        DROP TRIGGER IF EXISTS trigger_version_demandes_modification ON demandes_modification CASCADE;
        CREATE TRIGGER trigger_version_demandes_modification 
            AFTER INSERT OR UPDATE OR DELETE ON demandes_modification
            FOR EACH ROW EXECUTE FUNCTION trigger_record_version();
            
        DROP TRIGGER IF EXISTS trigger_version_soumissions_disponibilites ON soumissions_disponibilites CASCADE;
        CREATE TRIGGER trigger_version_soumissions_disponibilites 
            AFTER INSERT OR UPDATE OR DELETE ON soumissions_disponibilites
            FOR EACH ROW EXECUTE FUNCTION trigger_record_version();
            
        RAISE NOTICE 'Triggers réinstallés avec succès';
    ELSE
        RAISE NOTICE 'Triggers déjà installés: %', trigger_count;
    END IF;
END $$;

-- Test final
SELECT 
    'Triggers après correction' as info,
    COUNT(*) as nombre_triggers
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_version_%';