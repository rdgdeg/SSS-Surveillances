-- Création de la table share_tokens pour gérer les liens de partage
CREATE TABLE IF NOT EXISTS share_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID NOT NULL UNIQUE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('disponibilites', 'examens', 'rapports')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Index pour améliorer les performances
    CONSTRAINT share_tokens_token_key UNIQUE (token)
);

-- Index pour rechercher rapidement par token
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token);

-- Index pour rechercher par session
CREATE INDEX IF NOT EXISTS idx_share_tokens_session ON share_tokens(session_id);

-- Index pour nettoyer les tokens expirés
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires ON share_tokens(expires_at);

-- Politique RLS : Permettre la lecture publique avec un token valide
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de créer des tokens
CREATE POLICY "Admins can create share tokens" ON share_tokens
    FOR INSERT
    WITH CHECK (true);

-- Politique pour permettre aux admins de voir leurs tokens
CREATE POLICY "Admins can view share tokens" ON share_tokens
    FOR SELECT
    USING (true);

-- Politique pour permettre aux admins de supprimer des tokens
CREATE POLICY "Admins can delete share tokens" ON share_tokens
    FOR DELETE
    USING (true);

-- Fonction pour nettoyer automatiquement les tokens expirés (optionnel)
CREATE OR REPLACE FUNCTION cleanup_expired_share_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM share_tokens
    WHERE expires_at < NOW();
END;
$$;

-- Commentaires pour la documentation
COMMENT ON TABLE share_tokens IS 'Tokens de partage pour accès public en lecture seule';
COMMENT ON COLUMN share_tokens.token IS 'Token UUID unique pour l''accès';
COMMENT ON COLUMN share_tokens.resource_type IS 'Type de ressource partagée (disponibilites, examens, rapports)';
COMMENT ON COLUMN share_tokens.expires_at IS 'Date d''expiration du token';
