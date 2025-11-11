-- ============================================
-- Script de création de la base de données
-- Système de gestion des disponibilités de surveillance
-- ============================================

-- 1. Table des sessions d'examens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    period INTEGER NOT NULL CHECK (period IN (1, 2, 3)),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, period)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_year_period ON sessions(year, period);

-- 2. Table des surveillants
CREATE TABLE IF NOT EXISTS surveillants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('assistant', 'pat', 'jobiste', 'autre')),
    affectation_faculte TEXT,
    affectation_institut TEXT,
    statut_salarial TEXT,
    etp_total NUMERIC(4,2),
    etp_recherche NUMERIC(4,2),
    etp_autre NUMERIC(4,2),
    categorie_presence TEXT,
    fin_absence DATE,
    fin_repos_postnatal DATE,
    type_occupation TEXT,
    telephone TEXT,
    quota_surveillances INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_surveillants_email ON surveillants(email);
CREATE INDEX IF NOT EXISTS idx_surveillants_is_active ON surveillants(is_active);
CREATE INDEX IF NOT EXISTS idx_surveillants_type ON surveillants(type);

-- 3. Table des créneaux de surveillance
CREATE TABLE IF NOT EXISTS creneaux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    examen_id TEXT,
    date_surveillance DATE,
    heure_debut_surveillance TIME,
    heure_fin_surveillance TIME,
    type_creneau TEXT DEFAULT 'PRINCIPAL',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_creneaux_session_id ON creneaux(session_id);
CREATE INDEX IF NOT EXISTS idx_creneaux_date ON creneaux(date_surveillance);
CREATE INDEX IF NOT EXISTS idx_creneaux_type ON creneaux(type_creneau);

-- 4. Table des soumissions de disponibilités
CREATE TABLE IF NOT EXISTS soumissions_disponibilites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    surveillant_id UUID REFERENCES surveillants(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    type_surveillant TEXT NOT NULL,
    remarque_generale TEXT,
    historique_disponibilites JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, email)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_soumissions_session_id ON soumissions_disponibilites(session_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_email ON soumissions_disponibilites(email);
CREATE INDEX IF NOT EXISTS idx_soumissions_surveillant_id ON soumissions_disponibilites(surveillant_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_historique ON soumissions_disponibilites USING gin(historique_disponibilites);

-- 5. Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    expediteur_email TEXT NOT NULL,
    expediteur_nom TEXT,
    expediteur_prenom TEXT,
    sujet TEXT NOT NULL,
    contenu TEXT NOT NULL,
    lu BOOLEAN DEFAULT false,
    archive BOOLEAN DEFAULT false,
    priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_lu ON messages(lu);
CREATE INDEX IF NOT EXISTS idx_messages_archive ON messages(archive);
CREATE INDEX IF NOT EXISTS idx_messages_priorite ON messages(priorite);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- Politiques de sécurité RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveillants ENABLE ROW LEVEL SECURITY;
ALTER TABLE creneaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions_disponibilites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table sessions
-- Lecture publique des sessions actives
CREATE POLICY "Public can view active sessions" ON sessions
    FOR SELECT USING (is_active = true);

-- Permettre toutes les opérations sur les sessions (pour l'admin)
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques pour la table surveillants
-- Lecture publique des surveillants actifs (pour vérification email)
CREATE POLICY "Public can view active surveillants" ON surveillants
    FOR SELECT USING (is_active = true);

-- Permettre toutes les opérations sur les surveillants (pour l'admin)
CREATE POLICY "Allow all operations on surveillants" ON surveillants
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques pour la table creneaux
-- Lecture publique des créneaux des sessions actives
CREATE POLICY "Public can view creneaux of active sessions" ON creneaux
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = creneaux.session_id 
            AND sessions.is_active = true
        )
    );

-- Permettre toutes les opérations sur les créneaux (pour l'admin)
CREATE POLICY "Allow all operations on creneaux" ON creneaux
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques pour la table soumissions_disponibilites
-- Insertion publique des soumissions
CREATE POLICY "Public can insert submissions" ON soumissions_disponibilites
    FOR INSERT WITH CHECK (true);

-- Mise à jour publique des soumissions (upsert)
CREATE POLICY "Public can update own submissions" ON soumissions_disponibilites
    FOR UPDATE USING (true);

-- Lecture publique des soumissions (pour vérification)
CREATE POLICY "Public can view submissions" ON soumissions_disponibilites
    FOR SELECT USING (true);

-- Politiques pour la table messages
-- Insertion publique des messages
CREATE POLICY "Public can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Permettre toutes les opérations sur les messages (pour l'admin)
CREATE POLICY "Allow all operations on messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Données de test (optionnel)
-- ============================================

-- Insérer une session de test
INSERT INTO sessions (name, year, period, is_active) 
VALUES ('Session Test Janvier 2025', 2025, 1, true)
ON CONFLICT (year, period) DO NOTHING;

-- Insérer quelques surveillants de test
INSERT INTO surveillants (email, nom, prenom, type, is_active) 
VALUES 
    ('test1@example.com', 'Dupont', 'Jean', 'assistant', true),
    ('test2@example.com', 'Martin', 'Marie', 'pat', true),
    ('test3@example.com', 'Bernard', 'Pierre', 'jobiste', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Fonctions utilitaires (optionnel)
-- ============================================

-- Fonction pour obtenir le nombre de soumissions par session
CREATE OR REPLACE FUNCTION get_submission_count(session_uuid UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER 
    FROM soumissions_disponibilites 
    WHERE session_id = session_uuid;
$$ LANGUAGE SQL STABLE;

-- Fonction pour obtenir le taux de disponibilité
CREATE OR REPLACE FUNCTION get_availability_rate(session_uuid UUID)
RETURNS NUMERIC AS $$
    SELECT 
        CASE 
            WHEN COUNT(c.*) * COUNT(DISTINCT s.id) = 0 THEN 0
            ELSE (
                SELECT COUNT(*) 
                FROM soumissions_disponibilites sd,
                jsonb_array_elements(sd.historique_disponibilites) AS disp
                WHERE sd.session_id = session_uuid
                AND (disp->>'est_disponible')::boolean = true
            )::NUMERIC / (COUNT(c.*) * COUNT(DISTINCT s.id))::NUMERIC * 100
        END
    FROM creneaux c
    CROSS JOIN soumissions_disponibilites s
    WHERE c.session_id = session_uuid
    AND s.session_id = session_uuid;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Vues utiles (optionnel)
-- ============================================

-- Vue pour obtenir les statistiques de la session active
CREATE OR REPLACE VIEW v_active_session_stats AS
SELECT 
    s.id,
    s.name,
    s.year,
    s.period,
    COUNT(DISTINCT c.id) as total_creneaux,
    COUNT(DISTINCT sd.id) as total_soumissions,
    (SELECT COUNT(*) FROM surveillants WHERE is_active = true) as total_surveillants_actifs
FROM sessions s
LEFT JOIN creneaux c ON c.session_id = s.id
LEFT JOIN soumissions_disponibilites sd ON sd.session_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.year, s.period;

-- ============================================
-- Commentaires sur les tables
-- ============================================

COMMENT ON TABLE sessions IS 'Sessions d''examens (Janvier, Juin, Août)';
COMMENT ON TABLE surveillants IS 'Liste des surveillants disponibles';
COMMENT ON TABLE creneaux IS 'Créneaux de surveillance pour chaque session';
COMMENT ON TABLE soumissions_disponibilites IS 'Soumissions des disponibilités par les surveillants';
COMMENT ON TABLE messages IS 'Messages et remarques des surveillants';

COMMENT ON COLUMN sessions.period IS '1=Janvier, 2=Juin, 3=Août';
COMMENT ON COLUMN surveillants.type IS 'assistant, pat, jobiste, ou autre';
COMMENT ON COLUMN surveillants.etp IS 'Équivalent temps plein (0.00 à 1.00)';
COMMENT ON COLUMN soumissions_disponibilites.historique_disponibilites IS 'Array JSON des disponibilités: [{creneau_id, est_disponible}]';
COMMENT ON COLUMN messages.priorite IS 'basse, normale, haute, ou urgente';
