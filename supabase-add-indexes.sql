-- ============================================================================
-- Performance Optimization: Database Indexes
-- ============================================================================
-- This migration adds indexes to frequently queried columns to improve
-- query performance across the application.
--
-- Execute this on your Supabase SQL Editor
-- ============================================================================

-- Surveillants table indexes
-- These columns are frequently used in WHERE clauses and JOINs

CREATE INDEX IF NOT EXISTS idx_surveillants_email 
ON surveillants(email);

CREATE INDEX IF NOT EXISTS idx_surveillants_is_active 
ON surveillants(is_active);

CREATE INDEX IF NOT EXISTS idx_surveillants_type 
ON surveillants(type);

CREATE INDEX IF NOT EXISTS idx_surveillants_affectation_faculte 
ON surveillants(affectation_faculte);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_surveillants_active_type 
ON surveillants(is_active, type);

-- Creneaux table indexes
-- Frequently filtered by session and date

CREATE INDEX IF NOT EXISTS idx_creneaux_session_id 
ON creneaux(session_id);

CREATE INDEX IF NOT EXISTS idx_creneaux_date 
ON creneaux(date_surveillance);

CREATE INDEX IF NOT EXISTS idx_creneaux_type 
ON creneaux(type_creneau);

-- Composite index for session + date queries
CREATE INDEX IF NOT EXISTS idx_creneaux_session_date 
ON creneaux(session_id, date_surveillance);

-- Soumissions_disponibilites table indexes
-- Frequently queried by session and email

CREATE INDEX IF NOT EXISTS idx_soumissions_session_id 
ON soumissions_disponibilites(session_id);

CREATE INDEX IF NOT EXISTS idx_soumissions_email 
ON soumissions_disponibilites(email);

-- Composite index for unique constraint and common queries
CREATE INDEX IF NOT EXISTS idx_soumissions_session_email 
ON soumissions_disponibilites(session_id, email);

CREATE INDEX IF NOT EXISTS idx_soumissions_surveillant_id 
ON soumissions_disponibilites(surveillant_id);

-- Sessions table indexes
-- Frequently filtered by active status

CREATE INDEX IF NOT EXISTS idx_sessions_is_active 
ON sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_sessions_year_period 
ON sessions(year, period);

-- Messages table indexes
-- Frequently filtered by read/archive status

CREATE INDEX IF NOT EXISTS idx_messages_session_id 
ON messages(session_id);

CREATE INDEX IF NOT EXISTS idx_messages_lu 
ON messages(lu);

CREATE INDEX IF NOT EXISTS idx_messages_archive 
ON messages(archive);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

-- Composite index for unread messages query
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(lu, archive, created_at DESC);

-- ============================================================================
-- Verify indexes were created
-- ============================================================================

-- Run this query to see all indexes on your tables:
-- SELECT 
--   tablename, 
--   indexname, 
--   indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- ============================================================================
-- Performance Testing
-- ============================================================================

-- Before and after comparison:
-- EXPLAIN ANALYZE SELECT * FROM surveillants WHERE is_active = true AND type = 'assistant';
-- EXPLAIN ANALYZE SELECT * FROM creneaux WHERE session_id = 'your-session-id' ORDER BY date_surveillance;
-- EXPLAIN ANALYZE SELECT * FROM soumissions_disponibilites WHERE session_id = 'your-session-id' AND email = 'test@example.com';
