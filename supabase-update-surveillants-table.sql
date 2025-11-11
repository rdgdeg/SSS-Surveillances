-- ============================================
-- Script de mise à jour de la table surveillants
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Supprimer les anciennes données de test
DELETE FROM surveillants WHERE email LIKE 'test%@example.com';

-- Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE surveillants 
ADD COLUMN IF NOT EXISTS affectation_institut TEXT,
ADD COLUMN IF NOT EXISTS statut_salarial TEXT,
ADD COLUMN IF NOT EXISTS etp_total NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS etp_recherche NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS etp_autre NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS categorie_presence TEXT,
ADD COLUMN IF NOT EXISTS fin_absence DATE,
ADD COLUMN IF NOT EXISTS fin_repos_postnatal DATE,
ADD COLUMN IF NOT EXISTS type_occupation TEXT,
ADD COLUMN IF NOT EXISTS telephone TEXT,
ADD COLUMN IF NOT EXISTS quota_surveillances INTEGER;

-- Renommer l'ancienne colonne etp si elle existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'surveillants' AND column_name = 'etp') THEN
        ALTER TABLE surveillants RENAME COLUMN etp TO etp_total;
    END IF;
END $$;

-- Supprimer l'ancienne colonne quota_defaut si elle existe
ALTER TABLE surveillants DROP COLUMN IF EXISTS quota_defaut;

-- Mettre à jour la contrainte de type
ALTER TABLE surveillants DROP CONSTRAINT IF EXISTS surveillants_type_check;
ALTER TABLE surveillants ADD CONSTRAINT surveillants_type_check 
    CHECK (type IN ('assistant', 'pat', 'jobiste', 'autre'));
