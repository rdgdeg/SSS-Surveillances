-- Script de diagnostic pour le système d'héritage des consignes
-- Description: Vérifie si le système est correctement installé et fonctionne

-- 1. Vérifier les colonnes dans la table examens
SELECT 
    'COLONNES EXAMENS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'examens' 
  AND column_name LIKE '%consignes%'
ORDER BY column_name;

-- 2. Vérifier les fonctions installées
SELECT 
    'FONCTIONS INSTALLÉES' as section,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%consignes%'
ORDER BY p.proname;

-- 3. Vérifier les vues installées
SELECT 
    'VUES INSTALLÉES' as section,
    table_name as view_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%consignes%'
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 4. Vérifier les consignes par secrétariat
SELECT 
    'CONSIGNES PAR SECRÉTARIAT' as section,
    code_secretariat,
    nom_secretariat,
    CASE 
        WHEN consignes_generales IS NULL OR consignes_generales = '' 
        THEN '[Aucune]'
        ELSE LEFT(consignes_generales, 50) || '...'
    END as consignes_generales_apercu,
    is_active
FROM consignes_secretariat 
ORDER BY code_secretariat;

-- 5. Vérifier les examens avec consignes spécifiques
SELECT 
    'EXAMENS AVEC CONSIGNES SPÉCIFIQUES' as section,
    COUNT(*) as total_examens,
    COUNT(CASE WHEN utiliser_consignes_specifiques = true THEN 1 END) as avec_consignes_specifiques,
    COUNT(CASE WHEN consignes_specifiques_generales IS NOT NULL THEN 1 END) as avec_consignes_generales_specifiques
FROM examens;

-- 6. Diagnostic complet
DO $diagnostic$
DECLARE
    v_colonnes_ok BOOLEAN := FALSE;
    v_fonctions_ok BOOLEAN := FALSE;
    v_vues_ok BOOLEAN := FALSE;
    v_count INTEGER;
BEGIN
    RAISE NOTICE 'DIAGNOSTIC DU SYSTÈME D''HÉRITAGE DES CONSIGNES';
    RAISE NOTICE '================================================';
    
    -- Vérifier les colonnes
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_name = 'examens' 
      AND column_name IN ('consignes_specifiques_arrivee', 'consignes_specifiques_mise_en_place', 
                          'consignes_specifiques_generales', 'utiliser_consignes_specifiques');
    
    IF v_count = 4 THEN
        v_colonnes_ok := TRUE;
        RAISE NOTICE '✓ Colonnes dans examens: OK (4/4)';
    ELSE
        RAISE NOTICE '✗ Colonnes dans examens: MANQUANTES (%/4)', v_count;
    END IF;
    
    -- Vérifier les fonctions
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
      AND p.proname IN ('get_consignes_examen', 'initialiser_consignes_specifiques', 'utiliser_consignes_secretariat');
    
    IF v_count = 3 THEN
        v_fonctions_ok := TRUE;
        RAISE NOTICE '✓ Fonctions: OK (3/3)';
    ELSE
        RAISE NOTICE '✗ Fonctions: MANQUANTES (%/3)', v_count;
    END IF;
    
    -- Vérifier les vues
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('examens_with_consignes', 'planning_examens_public', 'stats_consignes_examens')
      AND table_type = 'VIEW';
    
    IF v_count = 3 THEN
        v_vues_ok := TRUE;
        RAISE NOTICE '✓ Vues: OK (3/3)';
    ELSE
        RAISE NOTICE '✗ Vues: MANQUANTES (%/3)', v_count;
    END IF;
    
    RAISE NOTICE '';
    
    -- Résumé
    IF v_colonnes_ok AND v_fonctions_ok AND v_vues_ok THEN
        RAISE NOTICE '🎉 SYSTÈME COMPLÈTEMENT INSTALLÉ ET FONCTIONNEL';
    ELSE
        RAISE NOTICE '⚠️  SYSTÈME INCOMPLET - INSTALLATION REQUISE';
        RAISE NOTICE 'Exécutez: scripts/install-consignes-heritage-complet.sql';
    END IF;
END $diagnostic$;

-- 7. Instructions selon l'état
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
              WHERE n.nspname = 'public' AND p.proname = 'get_consignes_examen') > 0
        THEN 'SYSTÈME INSTALLÉ - Vous pouvez utiliser les fonctions d''héritage'
        ELSE 'SYSTÈME NON INSTALLÉ - Exécutez scripts/install-consignes-heritage-complet.sql'
    END as instruction;