# Design Document - Intégration Calendrier

## Overview

Cette fonctionnalité ajoute la capacité pour les surveillants d'exporter leurs surveillances vers leurs agendas personnels via des fichiers iCalendar (.ics) standard ou des liens directs vers les services de calendrier populaires. L'implémentation se base sur le standard RFC 5545 pour assurer une compatibilité maximale avec tous les clients de calendrier.

## Architecture

L'architecture suit le pattern existant de l'application avec une séparation claire entre la logique métier, l'interface utilisateur et les services d'export :

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │────│  Calendar Service │────│  iCal Generator │
│                 │    │                  │    │                 │
│ - CalendarButton│    │ - generateICS()  │    │ - formatEvent() │
│ - ExportModal   │    │ - createLinks()  │    │ - formatDate()  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Surveillance  │    │   API Endpoints  │    │   File Download │
│      Data       │    │                  │    │                 │
│                 │    │ - /api/calendar/ │    │ - Blob creation │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Flux de Données

1. **Export Individuel**:
   - Utilisateur clique sur le bouton d'export pour une surveillance
   - Modal s'ouvre avec les options d'export
   - Utilisateur sélectionne une option (iCal, Google, Outlook)
   - Service génère le fichier ou l'URL approprié
   - Téléchargement ou redirection vers le service externe

2. **Export en Lot**:
   - Utilisateur clique sur "Exporter toutes les surveillances"
   - Système récupère toutes les surveillances du surveillant
   - Service génère un fichier .ics unique avec tous les événements
   - Téléchargement automatique du fichier

3. **Intégration dans les Pages Existantes**:
   - Page "Mes Surveillances" : bouton d'export pour chaque ligne + bouton d'export global
   - Page "Planning" : bouton d'export dans la vue calendrier
   - Page "Rapport Surveillances" (admin) : export pour un surveillant spécifique

## Components and Interfaces

### 1. CalendarExportButton Component
Composant réutilisable qui affiche les options d'export calendrier :
```typescript
interface CalendarExportButtonProps {
  surveillance?: Surveillance;
  surveillances?: Surveillance[];
  variant?: 'single' | 'bulk';
  className?: string;
}
```
- Affiche un dropdown avec les options : iCalendar, Google Calendar, Outlook
- Gère les clics et déclenche les actions appropriées
- Support pour export individuel ou en lot

### 2. CalendarExportModal Component
Modal qui s'ouvre lors du clic sur le bouton d'export :
```typescript
interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveillance?: Surveillance;
  surveillances?: Surveillance[];
}
```
- Affiche les différentes options d'export avec des icônes
- Gère les téléchargements de fichiers et ouvertures de liens
- Feedback visuel pour les actions en cours

### 3. CalendarService
Service principal pour la génération des événements calendrier :
```typescript
interface CalendarService {
  generateICSFile(surveillance: Surveillance): Promise<Blob>;
  generateICSFileMultiple(surveillances: Surveillance[]): Promise<Blob>;
  createGoogleCalendarLink(surveillance: Surveillance): string;
  createOutlookLink(surveillance: Surveillance): string;
  downloadICSFile(blob: Blob, filename: string): void;
}
```

### 4. ICalendarGenerator
Générateur de fichiers iCalendar conformes RFC 5545 :
```typescript
interface ICalendarGenerator {
  formatEvent(surveillance: Surveillance): string;
  formatDateTime(date: Date): string;
  generateUID(surveillance: Surveillance): string;
  escapeText(text: string): string;
  formatAlarm(minutesBefore: number): string;
  generateCalendarHeader(): string;
  generateCalendarFooter(): string;
}
```

### 5. CalendarUrlBuilder
Constructeur d'URLs pour les services de calendrier externes :
```typescript
interface CalendarUrlBuilder {
  buildGoogleCalendarUrl(event: CalendarEvent): string;
  buildOutlookUrl(event: CalendarEvent): string;
  encodeUrlParameter(value: string): string;
}
```

### 6. API Endpoints
- `GET /api/calendar/surveillance/:id` - Génère et retourne un fichier .ics pour une surveillance
- `GET /api/calendar/surveillant/:id` - Génère un fichier .ics avec toutes les surveillances d'un surveillant
- `POST /api/calendar/bulk` - Génère un fichier .ics pour une liste spécifique de surveillances

## Data Models

### CalendarEvent
```typescript
interface CalendarEvent {
  uid: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description: string;
  alarm: {
    trigger: string; // "-PT1H" pour 1h avant
    action: "DISPLAY";
    description: string;
  };
  organizer?: {
    name: string;
    email: string;
  };
  categories?: string[];
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}
```

### ExportOptions
```typescript
interface ExportOptions {
  type: 'ics' | 'google' | 'outlook';
  multiple?: boolean;
  surveillanceIds?: string[];
  filename?: string;
  includeAlarms?: boolean;
  alarmMinutesBefore?: number;
}
```

### SurveillanceCalendarData
```typescript
interface SurveillanceCalendarData {
  id: string;
  cours: string;
  auditoire: string;
  dateDebut: Date;
  dateFin: Date;
  typeExamen: string;
  consignesSpecifiques?: string;
  surveillantNom: string;
  surveillantEmail?: string;
}
```

### CalendarExportResult
```typescript
interface CalendarExportResult {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
  eventCount?: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Calendar button presence
*For any* surveillance displayed in the UI, the rendered component should contain a calendar export button
**Validates: Requirements 1.1**

### Property 2: Export options availability
*For any* calendar button click, the system should display iCalendar download, Google Calendar, and Outlook options
**Validates: Requirements 1.2**

### Property 3: iCalendar file generation
*For any* surveillance data, selecting iCalendar download should produce a valid .ics file containing all surveillance details
**Validates: Requirements 1.3**

### Property 4: Google Calendar URL generation
*For any* surveillance data, the generated Google Calendar URL should contain all required parameters with correct surveillance information
**Validates: Requirements 1.4**

### Property 5: Outlook URL generation
*For any* surveillance data, the generated Outlook URL should contain all required parameters with correct surveillance information
**Validates: Requirements 1.5**

### Property 6: Event title formatting
*For any* surveillance data, the generated calendar event should have a title in the format "Surveillance - [Cours] - [Auditoire]"
**Validates: Requirements 2.1**

### Property 7: Date and time preservation
*For any* surveillance data, the generated calendar event should contain identical start and end times
**Validates: Requirements 2.2**

### Property 8: Location inclusion
*For any* surveillance data, the generated calendar event should include the auditoire name as the location
**Validates: Requirements 2.3**

### Property 9: Description inclusion
*For any* surveillance data, the generated calendar event should include exam details and specific instructions in the description
**Validates: Requirements 2.4**

### Property 10: Alarm configuration
*For any* generated calendar event, it should include an alarm set for 1 hour before the start time
**Validates: Requirements 2.5**

### Property 11: Bulk file generation
*For any* collection of surveillances, the bulk export should generate a single iCalendar file containing all events
**Validates: Requirements 3.2**

### Property 12: Multi-event file structure
*For any* multi-surveillance iCalendar file, each surveillance should be represented as a distinct event within the same file
**Validates: Requirements 3.3**

### Property 13: RFC 5545 compliance
*For any* generated iCalendar file, it should conform to the RFC 5545 specification format
**Validates: Requirements 4.1**

### Property 14: UTF-8 encoding
*For any* generated iCalendar file, it should use UTF-8 encoding and properly handle special characters
**Validates: Requirements 4.2**

### Property 15: UTC date formatting
*For any* generated iCalendar file, all dates should be formatted in UTC with appropriate timezone information
**Validates: Requirements 4.3**

### Property 16: Unique event identifiers
*For any* generated calendar event, it should have a unique UID that doesn't collide with other events
**Validates: Requirements 4.4**

### Property 17: File metadata inclusion
*For any* generated iCalendar file, it should include appropriate version and producer metadata
**Validates: Requirements 4.5**

## Implementation Details

### iCalendar File Structure
Le fichier .ics généré suivra cette structure RFC 5545 :
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Système Surveillance//Calendar Export//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:surveillance-{id}-{timestamp}@surveillance-system.local
DTSTART:20241220T090000Z
DTEND:20241220T120000Z
DTSTAMP:20241219T120000Z
SUMMARY:Surveillance - Mathématiques I - Auditoire A1
LOCATION:Auditoire A1
DESCRIPTION:Examen de Mathématiques I\nType: Écrit\nConsignes: Calculatrice autorisée
CATEGORIES:SURVEILLANCE,EXAMEN
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Surveillance dans 1 heure
TRIGGER:-PT1H
END:VALARM
END:VEVENT
END:VCALENDAR
```

### URL Templates pour Services Externes

#### Google Calendar
```
https://calendar.google.com/calendar/render?action=TEMPLATE
&text={title}
&dates={startDateTime}/{endDateTime}
&details={description}
&location={location}
&ctz={timezone}
```

#### Outlook.com
```
https://outlook.live.com/calendar/0/deeplink/compose
?subject={title}
&startdt={startDateTime}
&enddt={endDateTime}
&body={description}
&location={location}
```

### File Naming Convention
- Export individuel : `surveillance-{cours}-{date}.ics`
- Export multiple : `surveillances-{surveillant}-{session}.ics`
- Caractères spéciaux remplacés par des tirets
- Dates au format YYYY-MM-DD

### Timezone Handling
- Toutes les dates stockées et affichées en heure locale (Europe/Brussels)
- Conversion en UTC pour les fichiers iCalendar
- Inclusion des informations de fuseau horaire dans les événements
- Support des changements d'heure été/hiver

## Security Considerations

### Data Access Control
- Vérification que l'utilisateur ne peut exporter que ses propres surveillances
- Validation des IDs de surveillance avant génération
- Logs d'audit pour tous les exports effectués
- Rate limiting sur les endpoints d'export (max 10 exports/minute)

### Data Sanitization
- Échappement de tous les caractères spéciaux dans les fichiers iCalendar
- Validation et nettoyage des données avant inclusion dans les URLs
- Protection contre l'injection de code dans les descriptions
- Limitation de la taille des champs texte

### File Security
- Génération de fichiers temporaires avec noms aléatorisés
- Nettoyage automatique des fichiers temporaires après téléchargement
- Validation du type MIME des fichiers générés
- Headers de sécurité appropriés pour les téléchargements

## Performance Optimization

### Caching Strategy
- Cache des données de surveillance fréquemment exportées (TTL: 5 minutes)
- Cache des fichiers .ics générés pour éviter la régénération (TTL: 1 heure)
- Invalidation du cache lors de modifications des surveillances
- Compression gzip des réponses API

### Batch Processing
- Traitement asynchrone pour les exports de plus de 20 surveillances
- Pagination des requêtes de données pour les gros volumes
- Limitation du nombre de surveillances par export (max 100)
- Feedback de progression pour les exports volumineux

### Resource Management
- Pool de connexions pour les requêtes base de données
- Limitation de la mémoire utilisée pour la génération de fichiers
- Timeout appropriés pour éviter les blocages
- Monitoring des performances des endpoints d'export

## Error Handling

### Invalid Surveillance Data
- Validation des données de surveillance avant génération avec schémas Zod
- Messages d'erreur explicites pour les données manquantes ou invalides
- Fallback vers des valeurs par défaut sécurisées quand possible
- Logging des tentatives d'export avec données invalides

### File Generation Failures
- Gestion des erreurs de génération de fichiers .ics avec try-catch appropriés
- Retry automatique pour les échecs temporaires (max 3 tentatives)
- Logging détaillé des erreurs pour le debugging
- Notification utilisateur en cas d'échec persistant

### External Service Integration
- Timeout appropriés pour les liens vers services externes (5 secondes)
- Gestion des cas où les services externes ne sont pas disponibles
- Validation des URLs générées avant redirection
- Fallback vers téléchargement .ics si les liens externes échouent

### Browser Compatibility
- Détection des capacités de téléchargement du navigateur
- Fallback pour les navigateurs ne supportant pas l'API Blob
- Gestion des restrictions de popup pour les liens externes
- Messages d'aide pour les utilisateurs avec des navigateurs anciens

### Network and Performance
- Gestion des timeouts réseau pour les requêtes API
- Limitation de la taille des exports en lot (max 100 surveillances)
- Compression des fichiers .ics volumineux
- Cache des données de surveillance pour éviter les requêtes répétées

## Testing Strategy

### Unit Testing
- Tests des fonctions de génération iCalendar avec des données de surveillance variées
- Tests de validation des formats de date et d'encodage
- Tests des fonctions de génération d'URLs pour Google Calendar et Outlook
- Tests de gestion d'erreurs avec des données invalides

### Property-Based Testing
La stratégie de test utilise **fast-check** pour JavaScript/TypeScript avec un minimum de 100 itérations par propriété. Chaque test de propriété sera tagué avec un commentaire référençant explicitement la propriété correspondante du document de design en utilisant le format : '**Feature: calendar-integration, Property {number}: {property_text}**'.

Les tests de propriétés couvriront :
- Génération de fichiers iCalendar valides pour toutes les combinaisons de données de surveillance
- Validation du format des URLs générées pour tous les services de calendrier
- Vérification de la conformité RFC 5545 pour tous les fichiers générés
- Test de l'unicité des UIDs à travers de multiples générations d'événements

### Integration Testing
- Tests d'intégration avec les composants UI existants
- Tests de téléchargement de fichiers dans le navigateur
- Tests de compatibilité avec différents clients de calendrier
- Tests de performance pour l'export de grandes quantités de surveillances