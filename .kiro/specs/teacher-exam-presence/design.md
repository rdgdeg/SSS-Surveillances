# Design Document - Gestion de la Présence des Enseignants aux Examens

## Overview

Cette fonctionnalité permet aux enseignants de déclarer leur présence aux examens et d'indiquer le nombre de surveillants qu'ils amènent. L'administration peut ensuite consulter ces informations pour calculer les besoins réels en surveillants pour chaque examen.

Le système s'intègre dans l'application existante en ajoutant :
- Une nouvelle table `examens` pour stocker les examens et leurs enseignants
- Une nouvelle table `presences_enseignants` pour les déclarations de présence
- Une interface enseignant pour rechercher et déclarer sa présence
- Une interface admin pour importer les examens et consulter les déclarations
- Un système de notifications pour les examens saisis manuellement

## Architecture

### Database Schema

#### Table: `examens`

```sql
CREATE TABLE examens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  code_examen VARCHAR(50) NOT NULL,
  nom_examen VARCHAR(500) NOT NULL,
  enseignants TEXT[] NOT NULL DEFAULT '{}', -- Array d'emails des enseignants
  date_examen DATE,
  heure_debut TIME,
  heure_fin TIME,
  saisie_manuelle BOOLEAN DEFAULT FALSE,
  cree_par_email VARCHAR(255), -- Email de l'enseignant qui a créé manuellement
  valide BOOLEAN DEFAULT TRUE, -- FALSE si en attente de validation admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, code_examen)
);

CREATE INDEX idx_examens_session ON examens(session_id);
CREATE INDEX idx_examens_code ON examens(code_examen);
CREATE INDEX idx_examens_saisie_manuelle ON examens(saisie_manuelle) WHERE saisie_manuelle = TRUE;
CREATE INDEX idx_examens_valide ON examens(valide) WHERE valide = FALSE;
```

#### Table: `presences_enseignants`

```sql
CREATE TABLE presences_enseignants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examen_id UUID NOT NULL REFERENCES examens(id) ON DELETE CASCADE,
  enseignant_email VARCHAR(255) NOT NULL,
  enseignant_nom VARCHAR(255) NOT NULL,
  enseignant_prenom VARCHAR(255) NOT NULL,
  est_present BOOLEAN NOT NULL,
  nb_surveillants_accompagnants INTEGER DEFAULT 0 CHECK (nb_surveillants_accompagnants >= 0),
  remarque TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(examen_id, enseignant_email)
);

CREATE INDEX idx_presences_examen ON presences_enseignants(examen_id);
CREATE INDEX idx_presences_email ON presences_enseignants(enseignant_email);
```

#### Table: `notifications_admin`

```sql
CREATE TABLE notifications_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'examen_manuel', etc.
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID, -- ID de l'entité concernée (examen, etc.)
  reference_type VARCHAR(50), -- 'examen', etc.
  lu BOOLEAN DEFAULT FALSE,
  archive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_lu ON notifications_admin(lu) WHERE lu = FALSE;
CREATE INDEX idx_notifications_archive ON notifications_admin(archive) WHERE archive = FALSE;
```

### Row Level Security (RLS)

```sql
-- Examens: lecture publique, écriture admin uniquement
ALTER TABLE examens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Examens lisibles par tous" ON examens
  FOR SELECT USING (true);

CREATE POLICY "Examens modifiables par admin" ON examens
  FOR ALL USING (auth.role() = 'authenticated'); -- À adapter selon votre système d'auth

-- Presences: lecture admin, écriture par enseignants
ALTER TABLE presences_enseignants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presences lisibles par admin" ON presences_enseignants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Presences modifiables par enseignant" ON presences_enseignants
  FOR ALL USING (true); -- Tout le monde peut créer/modifier sa propre présence

-- Notifications: admin uniquement
ALTER TABLE notifications_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications admin uniquement" ON notifications_admin
  FOR ALL USING (auth.role() = 'authenticated');
```

## Components and Interfaces

### Admin Components

#### 1. `ExamImport.tsx`

Composant pour l'import CSV des examens, similaire à `CourseImport.tsx`.

**Props:**
- `sessionId: string` - ID de la session active

**Features:**
- Sélection de fichier CSV
- Validation du format
- Barre de progression en temps réel
- Affichage des erreurs de validation
- Option d'ignorer les lignes erronées ou annuler
- Résumé de l'import

**CSV Format:**
```
Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
MATH101;Mathématiques I;prof1@univ.be,prof2@univ.be;2025-01-15;09:00;12:00
```

#### 2. `ExamPresencesDashboard.tsx`

Tableau de bord admin pour consulter les présences par session.

**Props:**
- `sessionId: string` - ID de la session sélectionnée

**Features:**
- Liste des examens avec horaires
- Statut de présence de chaque enseignant
- Nombre de surveillants accompagnants
- Calcul automatique des besoins en surveillants
- Filtres: tous / déclarés / en attente / saisis manuellement
- Export CSV des données
- Indicateurs visuels (badges de statut)

**Calcul des besoins:**
```typescript
besoin_surveillants = capacité_base - (enseignant_present ? 1 : 0) - nb_surveillants_accompagnants
```

#### 3. `ManualExamNotifications.tsx`

Composant pour afficher et gérer les notifications d'examens saisis manuellement.

**Features:**
- Liste des examens en attente de validation
- Détails de chaque examen (code, nom, enseignant, date de saisie)
- Actions: valider, modifier, supprimer
- Compteur de notifications non lues
- Archivage des notifications traitées

### Teacher/Public Components

#### 4. `TeacherExamSearch.tsx`

Interface de recherche d'examens pour les enseignants.

**Features:**
- Champ de recherche avec autocomplétion
- Recherche par code ou nom d'examen
- Filtrage par session active
- Affichage des résultats en temps réel
- Option "Examen non trouvé ? Saisir manuellement"

#### 5. `TeacherPresenceForm.tsx`

Formulaire de déclaration de présence.

**Props:**
- `examen: Examen` - Examen sélectionné
- `onSubmit: (data: PresenceData) => void`

**Fields:**
- Informations de l'examen (lecture seule)
- Email de l'enseignant (pré-rempli si connecté)
- Nom et prénom
- Radio buttons: Présent / Absent
- Si présent: champ numérique pour nb de surveillants accompagnants
- Champ remarque (optionnel)

**Validation:**
- Email valide et obligatoire
- Nom et prénom obligatoires
- Nb surveillants >= 0
- Confirmation avant soumission

#### 6. `ManualExamForm.tsx`

Formulaire de saisie manuelle d'un examen.

**Fields:**
- Code d'examen (obligatoire, max 50 caractères)
- Nom d'examen (obligatoire, max 500 caractères)
- Date d'examen (optionnel)
- Heure début (optionnel)
- Heure fin (optionnel)
- Email enseignant (pré-rempli)

**Behavior:**
- Crée l'examen avec `saisie_manuelle = true` et `valide = false`
- Crée une notification admin
- Redirige vers le formulaire de présence

### Shared Components

#### 7. `ExamStatusBadge.tsx`

Badge pour afficher le statut d'un examen.

**Props:**
- `status: 'declared' | 'pending' | 'manual'`

**Variants:**
- `declared`: Badge vert "Déclaré"
- `pending`: Badge orange "En attente"
- `manual`: Badge bleu "Saisie manuelle"

## Data Models

### TypeScript Interfaces

```typescript
export interface Examen {
  id: string;
  session_id: string;
  code_examen: string;
  nom_examen: string;
  enseignants: string[]; // Array d'emails
  date_examen: string | null; // YYYY-MM-DD
  heure_debut: string | null; // HH:MM
  heure_fin: string | null; // HH:MM
  saisie_manuelle: boolean;
  cree_par_email: string | null;
  valide: boolean;
  created_at: string;
  updated_at: string;
}

export interface PresenceEnseignant {
  id: string;
  examen_id: string;
  enseignant_email: string;
  enseignant_nom: string;
  enseignant_prenom: string;
  est_present: boolean;
  nb_surveillants_accompagnants: number;
  remarque: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface NotificationAdmin {
  id: string;
  type: 'examen_manuel' | string;
  titre: string;
  message: string;
  reference_id: string | null;
  reference_type: 'examen' | string | null;
  lu: boolean;
  archive: boolean;
  created_at: string;
}

export interface ExamenWithPresence extends Examen {
  presences: PresenceEnseignant[];
  nb_presences_declarees: number;
  nb_enseignants_total: number;
  besoin_surveillants_calcule: number | null;
}

export interface ExamenImportResult {
  imported: number;
  updated: number;
  errors: string[];
  warnings: string[];
}

export interface PresenceFormData {
  enseignant_email: string;
  enseignant_nom: string;
  enseignant_prenom: string;
  est_present: boolean;
  nb_surveillants_accompagnants: number;
  remarque?: string;
}

export interface ManualExamenFormData {
  code_examen: string;
  nom_examen: string;
  date_examen?: string;
  heure_debut?: string;
  heure_fin?: string;
}
```

## API Functions

### Public API

```typescript
// lib/examenApi.ts

/**
 * Recherche d'examens par code ou nom
 */
export async function searchExamens(
  sessionId: string,
  query: string
): Promise<Examen[]>;

/**
 * Récupère un examen par son ID
 */
export async function getExamenById(id: string): Promise<Examen | null>;

/**
 * Crée un examen manuellement (enseignant)
 */
export async function createManualExamen(
  sessionId: string,
  data: ManualExamenFormData,
  enseignantEmail: string
): Promise<Examen>;

/**
 * Soumet une déclaration de présence
 */
export async function submitPresence(
  examenId: string,
  data: PresenceFormData
): Promise<PresenceEnseignant>;

/**
 * Récupère la présence existante d'un enseignant pour un examen
 */
export async function getExistingPresence(
  examenId: string,
  enseignantEmail: string
): Promise<PresenceEnseignant | null>;
```

### Admin API

```typescript
/**
 * Import CSV d'examens
 */
export async function importExamens(
  sessionId: string,
  examens: ParsedExamen[],
  onProgress?: (current: number, total: number) => void
): Promise<ExamenImportResult>;

/**
 * Récupère tous les examens d'une session avec leurs présences
 */
export async function getExamensWithPresences(
  sessionId: string
): Promise<ExamenWithPresence[]>;

/**
 * Valide un examen saisi manuellement
 */
export async function validateManualExamen(
  examenId: string,
  updates?: Partial<Examen>
): Promise<Examen>;

/**
 * Supprime un examen
 */
export async function deleteExamen(examenId: string): Promise<void>;

/**
 * Récupère les notifications admin non lues
 */
export async function getUnreadNotifications(): Promise<NotificationAdmin[]>;

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(id: string): Promise<void>;

/**
 * Archive une notification
 */
export async function archiveNotification(id: string): Promise<void>;
```

## CSV Parser

### `lib/examenCsvParser.ts`

```typescript
export interface ParsedExamen {
  code_examen: string;
  nom_examen: string;
  enseignants: string[]; // Array d'emails
  date_examen?: string;
  heure_debut?: string;
  heure_fin?: string;
}

export interface ExamenCSVParseResult {
  examens: ParsedExamen[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse le CSV d'examens
 * Format: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
 * Enseignants: emails séparés par des virgules
 */
export function parseExamenCSV(csvContent: string): ExamenCSVParseResult;

/**
 * Valide un fichier CSV d'examens
 */
export function validateExamenCSVFile(file: File): string | null;
```

**Validations:**
- Format CSV avec séparateur point-virgule
- En-têtes obligatoires: Code Examen, Nom Examen, Enseignants
- Code examen: max 50 caractères, obligatoire
- Nom examen: max 500 caractères, obligatoire
- Enseignants: au moins un email valide
- Date: format YYYY-MM-DD si présente
- Heures: format HH:MM si présentes
- Taille fichier: max 10MB

## Error Handling

### Error Types

```typescript
export enum ExamenErrorType {
  IMPORT_ERROR = 'import_error',
  VALIDATION_ERROR = 'validation_error',
  DUPLICATE_ERROR = 'duplicate_error',
  NOT_FOUND_ERROR = 'not_found_error',
  PERMISSION_ERROR = 'permission_error'
}
```

### Error Messages

- **Import errors**: Affichage détaillé des lignes en erreur avec possibilité de continuer
- **Validation errors**: Messages clairs sur les champs invalides
- **Duplicate errors**: "Un examen avec ce code existe déjà pour cette session"
- **Not found**: "Examen non trouvé"
- **Permission**: "Vous n'avez pas les droits pour cette action"

## Testing Strategy

### Unit Tests

1. **CSV Parser Tests**
   - Parsing de fichiers valides
   - Gestion des erreurs de format
   - Validation des champs
   - Gestion des caractères spéciaux

2. **API Functions Tests**
   - CRUD operations sur examens
   - CRUD operations sur présences
   - Calcul des besoins en surveillants
   - Gestion des notifications

3. **Validation Tests**
   - Validation des formulaires
   - Validation des données CSV
   - Contraintes de base de données

### Integration Tests

1. **Import Flow**
   - Import complet d'un fichier CSV
   - Gestion des erreurs pendant l'import
   - Mise à jour d'examens existants

2. **Teacher Flow**
   - Recherche d'examen
   - Saisie manuelle d'examen
   - Soumission de présence
   - Modification de présence

3. **Admin Flow**
   - Consultation des présences
   - Validation d'examens manuels
   - Gestion des notifications
   - Calcul des besoins

### E2E Tests (optionnel)

1. Parcours complet enseignant: recherche → déclaration
2. Parcours complet admin: import → consultation → validation
3. Scénario de saisie manuelle avec notification

## UI/UX Considerations

### Responsive Design

- Tous les composants doivent être responsive (mobile, tablet, desktop)
- Tables avec scroll horizontal sur mobile
- Formulaires adaptés aux petits écrans

### Accessibility

- Labels ARIA pour tous les champs de formulaire
- Navigation au clavier
- Contraste des couleurs suffisant
- Messages d'erreur accessibles aux lecteurs d'écran

### Performance

- Pagination pour les listes d'examens (50 par page)
- Debounce sur la recherche (300ms)
- Lazy loading des composants lourds
- Cache des requêtes avec React Query (5 minutes)

### User Feedback

- Loading states pendant les opérations
- Messages de succès/erreur clairs
- Confirmations pour les actions destructives
- Barre de progression pour l'import

## Integration Points

### Existing Features

1. **Sessions**: Les examens sont liés aux sessions existantes
2. **Creneaux**: Possibilité future de lier examens et créneaux
3. **Messages**: Les remarques des enseignants peuvent créer des messages
4. **Auth**: Utilisation du système d'authentification existant

### Future Enhancements

1. **Liaison examens-créneaux**: Associer automatiquement les examens aux créneaux correspondants
2. **Calcul automatique de capacité**: Mettre à jour `nb_surveillants_requis` des créneaux en fonction des présences
3. **Notifications email**: Envoyer des emails aux enseignants pour rappel de déclaration
4. **Statistiques**: Dashboard avec taux de déclaration, besoins totaux, etc.
5. **Export**: Export PDF/Excel des plannings avec présences

## Migration Strategy

### Phase 1: Database Setup
1. Créer les nouvelles tables
2. Ajouter les indexes
3. Configurer RLS

### Phase 2: API Development
1. Implémenter les fonctions API
2. Ajouter les parsers CSV
3. Tests unitaires

### Phase 3: UI Development
1. Composants admin (import, dashboard)
2. Composants enseignant (recherche, formulaires)
3. Composants partagés (badges, etc.)

### Phase 4: Integration & Testing
1. Tests d'intégration
2. Tests E2E
3. Validation avec utilisateurs

### Phase 5: Deployment
1. Migration de la base de données
2. Déploiement du code
3. Documentation utilisateur
4. Formation admin
