-- Migration pour ajouter le verrouillage des soumissions de disponibilités

-- 1. Ajouter la colonne lock_submissions à la table sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS lock_submissions BOOLEAN DEFAULT false;

-- 2. Ajouter une colonne pour le message personnalisé
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS lock_message TEXT;

-- 3. Créer un index
CREATE INDEX IF NOT EXISTS idx_sessions_lock_submissions 
ON sessions(lock_submissions) 
WHERE lock_submissions = true;

-- 4. Commentaires
COMMENT ON COLUMN sessions.lock_submissions IS 'Si true, empêche les surveillants de soumettre ou modifier leurs disponibilités';
COMMENT ON COLUMN sessions.lock_message IS 'Message personnalisé affiché quand les soumissions sont verrouillées';

-- 5. Afficher les sessions avec leur statut de verrouillage
SELECT 
    id,
    name,
    is_active,
    lock_submissions,
    CASE 
        WHEN lock_submissions THEN '🔒 Verrouillé'
        ELSE '🔓 Ouvert'
    END as statut,
    lock_message
FROM sessions
ORDER BY year DESC, period DESC;
