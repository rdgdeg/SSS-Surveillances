-- Script pour peupler examen_auditoires à partir du champ auditoires existant
-- Ce script parse les auditoires séparés par virgules et crée une ligne par auditoire

-- Fonction pour nettoyer et séparer les auditoires
CREATE OR REPLACE FUNCTION split_and_create_auditoires()
RETURNS void AS $$
DECLARE
    exam_record RECORD;
    auditoire_name TEXT;
    auditoires_array TEXT[];
BEGIN
    -- Pour chaque examen qui a des auditoires
    FOR exam_record IN 
        SELECT id, auditoires 
        FROM examens 
        WHERE auditoires IS NOT NULL 
        AND auditoires != ''
    LOOP
        -- Séparer les auditoires par virgule
        auditoires_array := string_to_array(exam_record.auditoires, ',');
        
        -- Pour chaque auditoire
        FOREACH auditoire_name IN ARRAY auditoires_array
        LOOP
            -- Nettoyer les espaces
            auditoire_name := trim(auditoire_name);
            
            -- Ignorer les chaînes vides
            IF auditoire_name != '' THEN
                -- Insérer dans examen_auditoires (ignorer si existe déjà)
                INSERT INTO examen_auditoires (examen_id, auditoire, nb_surveillants_requis)
                VALUES (exam_record.id, auditoire_name, 1)
                ON CONFLICT (examen_id, auditoire) DO NOTHING;
                
                RAISE NOTICE 'Créé auditoire "%" pour examen %', auditoire_name, exam_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction
SELECT split_and_create_auditoires();

-- Supprimer la fonction (optionnel, pour nettoyer)
DROP FUNCTION split_and_create_auditoires();

-- Afficher un résumé
SELECT 
    'Résumé de la migration' as info,
    COUNT(DISTINCT examen_id) as nb_examens_avec_auditoires,
    COUNT(*) as nb_total_auditoires
FROM examen_auditoires;

-- Afficher quelques exemples
SELECT 
    e.code_examen,
    e.nom_examen,
    e.auditoires as auditoires_originaux,
    array_agg(ea.auditoire ORDER BY ea.auditoire) as auditoires_crees
FROM examens e
JOIN examen_auditoires ea ON ea.examen_id = e.id
GROUP BY e.id, e.code_examen, e.nom_examen, e.auditoires
LIMIT 10;
