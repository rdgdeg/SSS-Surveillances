-- Création de la table pour les demandes de modification
CREATE TABLE IF NOT EXISTS demandes_modification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_examen TEXT NOT NULL,
    date_examen DATE NOT NULL,
    heure_examen TIME NOT NULL,
    type_demande TEXT NOT NULL CHECK (type_demande IN ('permutation', 'modification', 'message')),
    
    -- Pour les permutations
    surveillant_remplacant TEXT,
    surveillance_reprise_date DATE,
    surveillance_reprise_heure TIME,
    
    -- Description de la demande
    description TEXT,
    
    -- Informations du demandeur
    nom_demandeur TEXT NOT NULL,
    email_demandeur TEXT,
    telephone_demandeur TEXT,
    
    -- Statut de la demande
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'traitee', 'refusee')),
    reponse_admin TEXT,
    lu BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    traite_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_demandes_modification_statut ON demandes_modification(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_modification_created_at ON demandes_modification(created_at);
CREATE INDEX IF NOT EXISTS idx_demandes_modification_date_examen ON demandes_modification(date_examen);

-- RLS (Row Level Security)
ALTER TABLE demandes_modification ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous de créer des demandes
CREATE POLICY "Tout le monde peut créer des demandes" ON demandes_modification
    FOR INSERT WITH CHECK (true);

-- Politique pour permettre aux admins de voir toutes les demandes
CREATE POLICY "Les admins peuvent voir toutes les demandes" ON demandes_modification
    FOR SELECT USING (true);

-- Politique pour permettre aux admins de modifier les demandes
CREATE POLICY "Les admins peuvent modifier les demandes" ON demandes_modification
    FOR UPDATE USING (true);

-- Politique pour permettre aux admins de supprimer les demandes
CREATE POLICY "Les admins peuvent supprimer les demandes" ON demandes_modification
    FOR DELETE USING (true);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_demandes_modification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_demandes_modification_updated_at
    BEFORE UPDATE ON demandes_modification
    FOR EACH ROW
    EXECUTE FUNCTION update_demandes_modification_updated_at();