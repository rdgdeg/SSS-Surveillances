-- Migration: Ajouter la période 6 = Hors-Session Février
-- Description: Permet de créer des sessions "Hors session février" (rattrapages, examens spéciaux en février).

ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_period_check;

ALTER TABLE sessions
ADD CONSTRAINT sessions_period_check
CHECK (period IN (1, 2, 3, 4, 5, 6));

COMMENT ON COLUMN sessions.period IS
'Période: 1=Janvier, 2=Juin, 3=Août/Septembre, 4=Hors-Session Janvier, 5=Hors-Session Juin, 6=Hors-Session Février';
