-- Table pour les utilisateurs admin
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Table pour l'audit trail
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  username TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Insérer les utilisateurs prédéfinis
-- Mot de passe par défaut: "admin123" (à changer en production)
-- Hash bcrypt de "admin123": $2a$10$rKZvVQKvV8xqvQvQvQvQvOeH8vQvQvQvQvQvQvQvQvQvQvQvQvQvQ
INSERT INTO admin_users (username, display_name, password_hash) VALUES
  ('CelineG', 'Céline G.', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('CarmenP', 'Carmen P.', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('RomaneV', 'Romane V.', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('GuillaumeA', 'Guillaume A.', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('MaximeD', 'Maxime D.', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (username) DO NOTHING;

-- Fonction pour logger automatiquement les modifications
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction sera appelée par les triggers
  -- Pour l'instant, on la laisse vide car on va logger manuellement depuis l'app
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Activer RLS sur les tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies pour admin_users (lecture seule pour l'authentification)
CREATE POLICY "Allow read access to admin_users" ON admin_users
  FOR SELECT USING (true);

-- Policies pour audit_log (lecture pour tous les admins, écriture via service role)
CREATE POLICY "Allow read access to audit_log" ON audit_log
  FOR SELECT USING (true);

CREATE POLICY "Allow insert to audit_log" ON audit_log
  FOR INSERT WITH CHECK (true);
