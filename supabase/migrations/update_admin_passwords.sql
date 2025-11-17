-- Mettre à jour les mots de passe des utilisateurs admin avec le bon hash
-- Mot de passe: admin123
-- Hash: $2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u

UPDATE admin_users 
SET password_hash = '$2b$10$vFBLAdauAkRrsZ4h1yt1GeZHD1LzTTH5UCUFfdFea27jAm2CN21.u'
WHERE username IN ('CelineG', 'CarmenP', 'RomaneV', 'GuillaumeA', 'MaximeD');

-- Vérifier que les utilisateurs existent
SELECT username, display_name, is_active, created_at 
FROM admin_users 
WHERE username IN ('CelineG', 'CarmenP', 'RomaneV', 'GuillaumeA', 'MaximeD');
