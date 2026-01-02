-- Script pour ajouter uniquement les colonnes nécessaires au système d'héritage des consignes
-- Description: Ajoute les colonnes manquantes dans la table examens

-- 1. Vérifier la structure actuelle de la table examens
SELECT 
    'COLONNES ACTUELLES DANS EXAMENS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'examens' 
  AND column_name LIKE '%consignes%'
ORDER BY column_name;

-- 2. Ajouter les colonnes manquantes
DO $add_columns$
BEGIN
    RAISE NOTICE 'Ajout des colonnes pour le système d''héritage des consignes...';
    
    -- Ajouter consignes_specifiques_arrivee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_arrivee') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_arrivee TEXT;
        RAISE NOTICE '✓ Colonne consignes_specifiques_arrivee ajoutée';
    ELSE
        RAISE NOTICE '- Colonne consignes_specifiques_arrivee existe déjà';
    END IF;
    
    -- Ajouter consignes_specifiques_mise_en_place
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_mise_en_place') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_mise_en_place TEXT;
        RAISE NOTICE '✓ Colonne consignes_specifiques_mise_en_place ajoutée';
    ELSE
        RAISE NOTICE '- Colonne consignes_specifiques_mise_en_place existe déjà';
    END IF;
    
    -- Ajouter consignes_specifiques_generales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'consignes_specifiques_generales') THEN
        ALTER TABLE examens ADD COLUMN consignes_specifiques_generales TEXT;
        RAISE NOTICE '✓ Colonne consignes_specifiques_generales ajoutée';
    ELSE
        RAISE NOTICE '- Colonne consignes_specifiques_generales existe déjà';
    END IF;
    
    -- Ajouter utiliser_consignes_specifiques
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'examens' AND column_name = 'utiliser_consignes_specifiques') THEN
        ALTER TABLE examens ADD COLUMN utiliser_consignes_specifiques BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✓ Colonne utiliser_consignes_specifiques ajoutée';
    ELSE
        RAISE NOTICE '- Colonne utiliser_consignes_specifiques existe déjà';
    END IF;
    
    RAISE NOTICE 'Ajout des colonnes terminé.';
END $add_columns$;

-- 3. Vérifier les colonnes après ajout
SELECT 
    'COLONNES APRÈS AJOUT' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'examens' 
  AND column_name LIKE '%consignes%'
ORDER BY column_name;

-- 4. Statistiques sur les examens
SELECT 
    'STATISTIQUES EXAMENS' as section,
    COUNT(*) as total_examens,
    COUNT(CASE WHEN secretariat IS NOT NULL THEN 1 END) as avec_secretariat,
    COUNT(CASE WHEN secretariat IN ('BAC11', 'DENT', 'FASB', 'FSP', 'MED') THEN 1 END) as avec_secretariat_valide
FROM examens;

-- 5. Résumé
SELECT 
    'RÉSUMÉ' as operation,
    'Colonnes ajoutées à la table examens' as action,
    'Vous pouvez maintenant installer le système complet' as prochaine_etape,
    'Exécutez: scripts/install-consignes-heritage-complet.sql' as commande;