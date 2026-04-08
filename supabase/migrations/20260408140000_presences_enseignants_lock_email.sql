-- Empêche le détournement d'une déclaration en changeant l'email (modèle confiance côté données).
CREATE OR REPLACE FUNCTION presences_enseignants_prevent_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.enseignant_email IS DISTINCT FROM OLD.enseignant_email THEN
    RAISE EXCEPTION 'enseignant_email ne peut pas être modifié (utiliser une nouvelle ligne)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_presences_lock_email ON presences_enseignants;
CREATE TRIGGER trigger_presences_lock_email
  BEFORE UPDATE ON presences_enseignants
  FOR EACH ROW
  EXECUTE FUNCTION presences_enseignants_prevent_email_change();

COMMENT ON FUNCTION presences_enseignants_prevent_email_change() IS
  'Les déclarations publiques identifient l''enseignant par email ; l''email reste figé après création.';
