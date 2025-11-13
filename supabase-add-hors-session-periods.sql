-- Migration: Ajouter les périodes "Hors-Session" pour janvier et juin
-- Date: 2025-01-XX
-- Description: Permet de créer des sessions hors-session pour janvier (period=4) et juin (period=5)

-- 1. Supprimer l'ancienne contrainte CHECK sur period (si elle existe)
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS sessions_period_check;

-- 2. Ajouter la nouvelle contrainte CHECK incluant les périodes 4 et 5
ALTER TABLE sessions 
ADD CONSTRAINT sessions_period_check 
CHECK (period IN (1, 2, 3, 4, 5));

-- 3. Ajouter un commentaire pour documenter les valeurs
COMMENT ON COLUMN sessions.period IS 
'Période de la session: 1=Janvier, 2=Juin, 3=Août/Septembre, 4=Hors-Session Janvier, 5=Hors-Session Juin';

-- Vérification
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'sessions_period_check';
