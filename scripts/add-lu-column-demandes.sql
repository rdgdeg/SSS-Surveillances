-- Ajouter la colonne 'lu' à la table demandes_modification
-- À exécuter si la table existe déjà sans cette colonne

-- 1. Ajouter la colonne 'lu' si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_modification' 
        AND column_name = 'lu'
    ) THEN
        ALTER TABLE demandes_modification ADD COLUMN lu BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Rendre la colonne description optionnelle si elle est obligatoire
ALTER TABLE demandes_modification ALTER COLUMN description DROP NOT NULL;

-- 3. Ajouter la politique de suppression si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'demandes_modification' 
        AND policyname = 'Les admins peuvent supprimer les demandes'
    ) THEN
        CREATE POLICY "Les admins peuvent supprimer les demandes" ON demandes_modification
            FOR DELETE USING (true);
    END IF;
END $$;

-- 4. Marquer toutes les demandes existantes comme lues (optionnel)
-- UPDATE demandes_modification SET lu = TRUE WHERE lu IS NULL OR lu = FALSE;

SELECT 'Colonne lu ajoutée et politiques mises à jour avec succès!' as message;