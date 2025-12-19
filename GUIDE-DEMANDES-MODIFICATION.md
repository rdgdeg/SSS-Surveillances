# Guide des Demandes de Modification

## Vue d'ensemble

Le système de demandes de modification permet aux surveillants de soumettre des demandes de changement concernant leurs surveillances directement via l'interface web. Les administrateurs peuvent ensuite traiter ces demandes depuis l'interface d'administration.

## Fonctionnalités

### Pour les Utilisateurs (Surveillants)

#### Accès au Formulaire
- **Bouton dans le header** : Un bouton orange "Demande de modification" est disponible dans le header de toutes les pages publiques
- **Accessible sur mobile et desktop** : Le bouton est adaptatif et fonctionne sur tous les appareils

#### Types de Demandes Disponibles

1. **Demande de modification** : Pour demander un changement général (horaire, conditions, etc.)
2. **Permutation** : Pour échanger sa surveillance avec un autre surveillant
3. **Message général** : Pour envoyer un message à l'administration

#### Formulaire de Demande

**Informations sur l'examen (obligatoires) :**
- Nom de l'examen
- Date de l'examen
- Heure de l'examen

**Type de demande :**
- Sélection du type via menu déroulant

**Informations spécifiques aux permutations :**
- Nom du surveillant qui reprend la surveillance
- Date et heure de la surveillance que vous reprenez

**Description (obligatoire) :**
- Zone de texte libre pour décrire la demande en détail

**Informations de contact (nom obligatoire) :**
- Nom et prénom
- Email (optionnel)
- Téléphone (optionnel)

#### Validation et Envoi
- Validation automatique des champs obligatoires
- Message de confirmation après envoi réussi
- Gestion des erreurs avec messages explicites

### Pour les Administrateurs

#### Accès à la Gestion
- **Menu d'administration** : Lien "Demandes de modification" dans le menu admin (réservé aux admins complets)
- **Route** : `/admin/demandes-modification`

#### Interface de Gestion

**Liste des demandes :**
- Tableau avec toutes les demandes
- Colonnes : Demandeur, Examen, Type, Statut, Date de création
- Badges colorés pour les statuts et types

**Filtres et recherche :**
- Barre de recherche (examen, demandeur, description)
- Filtre par statut (Tous, En attente, En cours, Traitée, Refusée)

**Détail d'une demande :**
- Modal avec toutes les informations
- Affichage conditionnel des informations de permutation
- Historique des modifications

#### Traitement des Demandes

**Statuts disponibles :**
- **En attente** : Demande nouvellement créée
- **En cours** : Demande en cours de traitement
- **Traitée** : Demande résolue positivement
- **Refusée** : Demande rejetée

**Actions possibles :**
- Modifier le statut
- Ajouter une réponse de l'administration
- Horodatage automatique des changements

## Base de Données

### Table `demandes_modification`

```sql
CREATE TABLE demandes_modification (
    id UUID PRIMARY KEY,
    nom_examen TEXT NOT NULL,
    date_examen DATE NOT NULL,
    heure_examen TIME NOT NULL,
    type_demande TEXT NOT NULL CHECK (type_demande IN ('permutation', 'modification', 'message')),
    
    -- Pour les permutations
    surveillant_remplacant TEXT,
    surveillance_reprise_date DATE,
    surveillance_reprise_heure TIME,
    
    -- Description de la demande
    description TEXT NOT NULL,
    
    -- Informations du demandeur
    nom_demandeur TEXT NOT NULL,
    email_demandeur TEXT,
    telephone_demandeur TEXT,
    
    -- Statut de la demande
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'traitee', 'refusee')),
    reponse_admin TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    traite_at TIMESTAMP WITH TIME ZONE
);
```

### Politiques de Sécurité (RLS)

- **Création** : Tout le monde peut créer des demandes (pas d'authentification requise)
- **Lecture** : Seuls les administrateurs peuvent voir les demandes
- **Modification** : Seuls les administrateurs peuvent modifier les demandes

## Installation

### 1. Migration de la Base de Données

```bash
# Appliquer la migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/create_demandes_modification.sql
```

### 2. Vérification des Composants

Les fichiers suivants ont été créés/modifiés :

- `supabase/migrations/create_demandes_modification.sql` - Migration de la base de données
- `components/shared/DemandeModificationModal.tsx` - Composant modal du formulaire
- `pages/admin/DemandesModificationPage.tsx` - Page d'administration
- `components/layouts/MainLayout.tsx` - Ajout du bouton dans le header
- `components/layouts/AdminLayout.tsx` - Ajout du lien dans le menu admin
- `App.tsx` - Ajout de la route d'administration

### 3. Vérification des Permissions

Assurez-vous que :
- Les politiques RLS sont correctement appliquées
- Les utilisateurs admin ont accès à la page
- Le bouton est visible pour tous les utilisateurs publics

## Utilisation

### Workflow Typique

1. **Utilisateur** : Clique sur "Demande de modification" dans le header
2. **Utilisateur** : Remplit le formulaire avec les détails de sa demande
3. **Utilisateur** : Soumet la demande
4. **Système** : Enregistre la demande avec le statut "En attente"
5. **Admin** : Consulte les nouvelles demandes dans l'interface d'administration
6. **Admin** : Traite la demande et met à jour le statut
7. **Admin** : Ajoute une réponse si nécessaire

### Bonnes Pratiques

**Pour les utilisateurs :**
- Être précis dans la description de la demande
- Fournir des informations de contact pour faciliter le suivi
- Pour les permutations, s'assurer que l'autre surveillant est d'accord

**Pour les administrateurs :**
- Traiter les demandes rapidement
- Fournir des réponses claires et détaillées
- Mettre à jour le statut régulièrement

## Maintenance

### Nettoyage des Données

Il est recommandé de nettoyer périodiquement les anciennes demandes traitées :

```sql
-- Supprimer les demandes traitées de plus de 6 mois
DELETE FROM demandes_modification 
WHERE statut IN ('traitee', 'refusee') 
AND traite_at < NOW() - INTERVAL '6 months';
```

### Monitoring

Surveiller :
- Le nombre de demandes en attente
- Le temps de traitement moyen
- Les types de demandes les plus fréquents

### Améliorations Futures

Possibles améliorations :
- Notifications par email aux administrateurs
- Système de notifications pour les demandeurs
- Intégration avec le système de planning
- Export des demandes en CSV
- Statistiques et rapports sur les demandes