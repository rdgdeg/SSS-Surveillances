-- Migration: Visibilité des créneaux par type de surveillant
-- Description: Permet de restreindre certains créneaux aux jobistes uniquement.
-- Par défaut (false) le créneau est visible par tous ; si true, uniquement par les jobistes.

ALTER TABLE creneaux
ADD COLUMN IF NOT EXISTS visible_jobistes_uniquement BOOLEAN DEFAULT false;

COMMENT ON COLUMN creneaux.visible_jobistes_uniquement IS 'Si true, le créneau n''est affiché que pour les surveillants de type jobiste. Par défaut false = visible par tous.';
