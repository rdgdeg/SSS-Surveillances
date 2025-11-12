-- Ajouter une politique pour permettre la suppression des soumissions
-- Cette politique permet à tous les utilisateurs (notamment l'admin) de supprimer des soumissions

CREATE POLICY "Allow delete submissions" ON soumissions_disponibilites
    FOR DELETE USING (true);
