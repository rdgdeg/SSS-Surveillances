-- Création simple de la table demandes_modification
-- À exécuter dans l'interface SQL de Supabase

-- 1. Supprimer la table si elle existe
DROP TABLE IF EXISTS demandes_modification CASCADE;

-- 2. Créer la table
CREATE TABLE demandes_modification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_examen TEXT NOT NULL,
    date_examen DATE NOT NULL,
    heure_examen TIME NOT NULL,
    type_demande TEXT NOT NULL CHECK (type_demande IN ('permutation', 'modification', 'message')),
    surveillant_remplacant TEXT,
    surveillance_reprise_date DATE,
    surveillance_reprise_heure TIME,
    description TEXT NOT NULL,
    nom_demandeur TEXT NOT NULL,
    email_demandeur TEXT,
    telephone_demandeur TEXT,
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'traitee', 'refusee')),
    reponse_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    traite_at TIMESTAMP WITH TIME ZONE
);

-- 3. Créer les index
CREATE INDEX idx_demandes_modification_statut ON demandes_modification(statut);
CREATE INDEX idx_demandes_modification_created_at ON demandes_modification(created_at);
CREATE INDEX idx_demandes_modification_date_examen ON demandes_modification(date_examen);

-- 4. Activer RLS
ALTER TABLE demandes_modification ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques
CREATE POLICY "Tout le monde peut créer des demandes" ON demandes_modification
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Les admins peuvent voir toutes les demandes" ON demandes_modification
    FOR SELECT USING (true);

CREATE POLICY "Les admins peuvent modifier les demandes" ON demandes_modification
    FOR UPDATE USING (true);

-- 6. Créer la fonction de mise à jour
CREATE OR REPLACE FUNCTION update_demandes_modification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger
CREATE TRIGGER update_demandes_modification_updated_at
    BEFORE UPDATE ON demandes_modification
    FOR EACH ROW
    EXECUTE FUNCTION update_demandes_modification_updated_at();