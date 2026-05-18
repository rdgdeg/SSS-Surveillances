-- Créneaux à pourvoir : appels de volontaires par session

CREATE TABLE IF NOT EXISTS creneaux_a_pourvoir (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date_surveillance DATE NOT NULL,
  heure_debut TIME,
  heure_fin TIME,
  nb_personnes_manquantes INT NOT NULL DEFAULT 1 CHECK (nb_personnes_manquantes >= 1),
  libelle TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creneaux_a_pourvoir_session ON creneaux_a_pourvoir(session_id);
CREATE INDEX IF NOT EXISTS idx_creneaux_a_pourvoir_date ON creneaux_a_pourvoir(date_surveillance);

CREATE TABLE IF NOT EXISTS reponses_creneaux_a_pourvoir (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, email)
);

CREATE INDEX IF NOT EXISTS idx_reponses_cap_session ON reponses_creneaux_a_pourvoir(session_id);
CREATE INDEX IF NOT EXISTS idx_reponses_cap_email ON reponses_creneaux_a_pourvoir(email);

CREATE TABLE IF NOT EXISTS reponses_creneaux_a_pourvoir_selections (
  reponse_id UUID NOT NULL REFERENCES reponses_creneaux_a_pourvoir(id) ON DELETE CASCADE,
  creneau_a_pourvoir_id UUID NOT NULL REFERENCES creneaux_a_pourvoir(id) ON DELETE CASCADE,
  PRIMARY KEY (reponse_id, creneau_a_pourvoir_id)
);

CREATE INDEX IF NOT EXISTS idx_selections_creneau ON reponses_creneaux_a_pourvoir_selections(creneau_a_pourvoir_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_creneaux_a_pourvoir_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_creneaux_a_pourvoir_updated ON creneaux_a_pourvoir;
CREATE TRIGGER trg_creneaux_a_pourvoir_updated
  BEFORE UPDATE ON creneaux_a_pourvoir
  FOR EACH ROW EXECUTE FUNCTION update_creneaux_a_pourvoir_updated_at();

DROP TRIGGER IF EXISTS trg_reponses_cap_updated ON reponses_creneaux_a_pourvoir;
CREATE TRIGGER trg_reponses_cap_updated
  BEFORE UPDATE ON reponses_creneaux_a_pourvoir
  FOR EACH ROW EXECUTE FUNCTION update_creneaux_a_pourvoir_updated_at();

-- RLS
ALTER TABLE creneaux_a_pourvoir ENABLE ROW LEVEL SECURITY;
ALTER TABLE reponses_creneaux_a_pourvoir ENABLE ROW LEVEL SECURITY;
ALTER TABLE reponses_creneaux_a_pourvoir_selections ENABLE ROW LEVEL SECURITY;

-- Créneaux : lecture publique si ouvert ; écriture admin (allow all comme creneaux existants)
DROP POLICY IF EXISTS "Public read open creneaux a pourvoir" ON creneaux_a_pourvoir;
CREATE POLICY "Public read open creneaux a pourvoir" ON creneaux_a_pourvoir
  FOR SELECT USING (is_open = true);

DROP POLICY IF EXISTS "Admin all creneaux a pourvoir" ON creneaux_a_pourvoir;
CREATE POLICY "Admin all creneaux a pourvoir" ON creneaux_a_pourvoir
  FOR ALL USING (true) WITH CHECK (true);

-- Réponses : accès public pour inscription (comme soumissions disponibilités)
DROP POLICY IF EXISTS "Public read reponses cap" ON reponses_creneaux_a_pourvoir;
CREATE POLICY "Public read reponses cap" ON reponses_creneaux_a_pourvoir
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert reponses cap" ON reponses_creneaux_a_pourvoir;
CREATE POLICY "Public insert reponses cap" ON reponses_creneaux_a_pourvoir
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update reponses cap" ON reponses_creneaux_a_pourvoir;
CREATE POLICY "Public update reponses cap" ON reponses_creneaux_a_pourvoir
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin delete reponses cap" ON reponses_creneaux_a_pourvoir;
CREATE POLICY "Admin delete reponses cap" ON reponses_creneaux_a_pourvoir
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read selections cap" ON reponses_creneaux_a_pourvoir_selections;
CREATE POLICY "Public read selections cap" ON reponses_creneaux_a_pourvoir_selections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert selections cap" ON reponses_creneaux_a_pourvoir_selections;
CREATE POLICY "Public insert selections cap" ON reponses_creneaux_a_pourvoir_selections
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete selections cap" ON reponses_creneaux_a_pourvoir_selections;
CREATE POLICY "Public delete selections cap" ON reponses_creneaux_a_pourvoir_selections
  FOR DELETE USING (true);

COMMENT ON TABLE creneaux_a_pourvoir IS 'Créneaux publiés pour recrutement de volontaires (places manquantes)';
COMMENT ON TABLE reponses_creneaux_a_pourvoir IS 'Volontaires ayant répondu à un appel créneaux à pourvoir';
COMMENT ON COLUMN creneaux_a_pourvoir.nb_personnes_manquantes IS 'Nombre de personnes encore à trouver pour ce créneau';
