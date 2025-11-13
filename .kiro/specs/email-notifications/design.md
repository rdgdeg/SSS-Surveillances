# Design Document - Système de Notifications Email

## Overview

Ce document décrit l'architecture pour le système de notifications email automatiques. Le système utilisera **Resend** (gratuit jusqu'à 3000 emails/mois) et **Supabase Edge Functions**.

## Architecture

### Stack Technique

**Service d'Email** : Resend
- Gratuit jusqu'à 3000 emails/mois
- API simple
- Tracking intégré
- Support React Email

**Backend** : Supabase Edge Functions (Deno)
**Scheduler** : pg_cron (PostgreSQL)
**Templates** : React Email

### Flux de Données

```
Trigger → Template + Variables → Queue → Edge Function → Resend → Tracking
```

## Components

### 1. Tables Database

#### email_templates
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### email_queue
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  template_type VARCHAR(50),
  priority INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### email_logs
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL,
  resend_id VARCHAR(100),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Edge Functions

**send-email** : Ajoute email à la queue
**process-queue** : Traite les emails en attente
**schedule-reminders** : Planifie les rappels

### 3. Scheduler (pg_cron)

```sql
-- Traiter la queue toutes les 5 minutes
SELECT cron.schedule('process-queue', '*/5 * * * *', ...);

-- Rappels quotidiens à 9h
SELECT cron.schedule('reminders', '0 9 * * *', ...);
```

## Implementation Plan

### Phase 1: Setup
1. Créer compte Resend
2. Créer tables database
3. Déployer Edge Functions

### Phase 2: Templates
1. Créer templates React Email
2. Interface admin

### Phase 3: Integration
1. Confirmation de soumission
2. Notification session

### Phase 4: Automation
1. Rappels automatiques
2. Monitoring

## Next Steps

Voir tasks.md pour le plan d'implémentation détaillé.
