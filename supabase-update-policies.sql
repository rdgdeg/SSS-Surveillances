-- ============================================
-- Script de mise à jour des politiques RLS
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all operations on surveillants" ON surveillants;
DROP POLICY IF EXISTS "Allow all operations on creneaux" ON creneaux;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

-- Ajouter les nouvelles politiques pour permettre les opérations d'administration

-- Sessions : permettre toutes les opérations
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Surveillants : permettre toutes les opérations
CREATE POLICY "Allow all operations on surveillants" ON surveillants
    FOR ALL USING (true) WITH CHECK (true);

-- Créneaux : permettre toutes les opérations
CREATE POLICY "Allow all operations on creneaux" ON creneaux
    FOR ALL USING (true) WITH CHECK (true);

-- Messages : permettre toutes les opérations
CREATE POLICY "Allow all operations on messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);
