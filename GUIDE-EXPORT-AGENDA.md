# Guide d'Export vers l'Agenda

## Vue d'ensemble

Le système d'export vers l'agenda permet aux surveillants d'ajouter facilement leurs surveillances à leur calendrier personnel. Cette fonctionnalité est disponible à plusieurs endroits dans l'application.

## Fonctionnalités

### 🗓️ Types d'export disponibles

1. **Fichier ICS** : Compatible avec tous les calendriers (Outlook, Apple Calendar, Thunderbird, etc.)
2. **Google Calendar** : Ouvre directement dans Google Calendar
3. **Outlook Calendar** : Ouvre dans Outlook Web ou l'application
4. **Yahoo Calendar** : Ouvre dans Yahoo Calendar

### 📍 Où trouver l'export agenda

#### 1. Page "Mes Surveillances" (`/mes-surveillances`)
- **Accès** : Lien dans le footer "Mes Surveillances"
- **Fonctionnalités** :
  - Vue dédiée de toutes vos surveillances
  - Filtres par date (cette semaine, ce mois, à venir)
  - Recherche par nom de surveillant
  - Export individuel par surveillance
  - Export groupé de toutes les surveillances

#### 2. Page Planning (`/planning`)
- **Export groupé** : Sélectionnez un surveillant et cliquez sur "Ajouter à l'agenda"
- **Export individuel** : Bouton sur chaque examen dans la liste

#### 3. Composant CalendarExportButton
- Utilisable dans d'autres pages pour des exports spécifiques

## Utilisation

### Export individuel d'une surveillance

1. Trouvez la surveillance dans la liste
2. Cliquez sur le bouton "Ajouter à l'agenda" (icône calendrier)
3. Choisissez votre méthode d'export :
   - **Télécharger (.ics)** : Fichier à ouvrir avec votre application de calendrier
   - **Google Calendar** : Ouvre une nouvelle fenêtre avec l'événement pré-rempli
   - **Outlook Calendar** : Ouvre Outlook avec l'événement
   - **Yahoo Calendar** : Ouvre Yahoo Calendar avec l'événement

### Export groupé de plusieurs surveillances

1. Allez sur la page "Mes Surveillances" ou utilisez le filtre "Surveillant" sur la page Planning
2. Appliquez les filtres souhaités (date, surveillant)
3. Cliquez sur "Exporter tout" ou "Ajouter à l'agenda"
4. Un fichier ICS contenant toutes les surveillances sera téléchargé

### Informations incluses dans l'export

Chaque événement de calendrier contient :
- **Titre** : "Surveillance - [Nom de l'examen] ([Auditoire])"
- **Date et heure** : Heure de début et fin de la surveillance
- **Lieu** : Auditoire ou "UCLouvain - Secteur des Sciences de la Santé"
- **Description** : Détails de l'examen (type, faculté, horaire)
- **UID unique** : Pour éviter les doublons

## Formats de fichier

### Fichier ICS (iCalendar)
- **Extension** : `.ics`
- **Compatible avec** : Outlook, Apple Calendar, Google Calendar, Thunderbird, etc.
- **Utilisation** : Double-cliquez sur le fichier téléchargé pour l'ouvrir avec votre calendrier

### URLs de calendrier en ligne
- **Google Calendar** : `https://calendar.google.com/calendar/render?action=TEMPLATE&...`
- **Outlook** : `https://outlook.live.com/calendar/0/deeplink/compose?...`
- **Yahoo** : `https://calendar.yahoo.com/?...`

## Exemples d'utilisation

### Cas d'usage 1 : Surveillant occasionnel
1. Va sur "Mes Surveillances"
2. Voit ses 2-3 surveillances du mois
3. Clique sur "Exporter tout"
4. Ouvre le fichier .ics avec Outlook

### Cas d'usage 2 : Surveillant régulier
1. Va sur la page Planning
2. Tape son nom dans le filtre "Surveillant"
3. Clique sur "Ajouter à l'agenda"
4. Télécharge le fichier ICS avec toutes ses surveillances

### Cas d'usage 3 : Export sélectif
1. Va sur "Mes Surveillances"
2. Filtre par "Cette semaine"
3. Exporte individuellement chaque surveillance vers Google Calendar

## Résolution des problèmes

### Le fichier ICS ne s'ouvre pas
- **Solution** : Clic droit → "Ouvrir avec" → Choisir votre application de calendrier
- **Alternative** : Importer manuellement dans votre calendrier

### L'événement n'apparaît pas dans le calendrier
- **Vérifiez** : Que vous avez bien confirmé l'ajout de l'événement
- **Vérifiez** : Que vous regardez la bonne date dans votre calendrier
- **Solution** : Réessayez l'export ou utilisez une autre méthode

### Doublons dans le calendrier
- **Cause** : Export multiple du même événement
- **Solution** : Supprimez les doublons manuellement dans votre calendrier
- **Prévention** : Les UIDs uniques devraient éviter ce problème

### L'URL ne fonctionne pas
- **Cause** : Bloqueur de pop-ups ou problème de navigateur
- **Solution** : Autorisez les pop-ups pour ce site ou utilisez l'export ICS

## Conseils et bonnes pratiques

### Pour les surveillants
- **Exportez régulièrement** : Ajoutez vos nouvelles surveillances dès qu'elles sont assignées
- **Utilisez les filtres** : Pour exporter seulement les surveillances d'une période donnée
- **Vérifiez votre calendrier** : Assurez-vous que les événements sont bien ajoutés

### Pour les administrateurs
- **Communiquez la fonctionnalité** : Informez les surveillants de cette possibilité
- **Testez régulièrement** : Vérifiez que l'export fonctionne correctement
- **Surveillez les retours** : Collectez les commentaires pour améliorer la fonctionnalité

## Développement technique

### Structure des événements
```typescript
interface CalendarEvent {
  title: string;           // "Surveillance - WFARM1300 (Auditoire A)"
  description?: string;    // Détails de l'examen
  location?: string;       // Auditoire ou lieu par défaut
  startDate: Date;        // Date/heure de début
  endDate: Date;          // Date/heure de fin
  uid?: string;           // Identifiant unique
}
```

### Fichiers impliqués
- `lib/calendarUtils.ts` : Utilitaires de génération ICS et URLs
- `components/shared/CalendarExportButton.tsx` : Composant d'export
- `pages/public/MesSurveillancesPage.tsx` : Page dédiée aux surveillances
- `hooks/useSurveillances.ts` : Hook pour récupérer les surveillances

### Personnalisation
- **Titre des événements** : Modifiable dans `surveillanceToCalendarEvent()`
- **Description** : Personnalisable selon les besoins
- **Lieu par défaut** : Configurable dans les utilitaires

## Améliorations futures

### Fonctionnalités envisagées
- **Synchronisation automatique** : Mise à jour automatique du calendrier
- **Notifications** : Rappels avant les surveillances
- **Intégration Exchange** : Support direct pour Exchange Server
- **Calendrier partagé** : Calendrier public des surveillances
- **Export par équipe** : Export groupé pour une équipe de surveillants

### Intégrations possibles
- **Microsoft Graph API** : Intégration directe avec Office 365
- **Google Calendar API** : Ajout automatique sans fichier
- **CalDAV** : Support des serveurs de calendrier standards
- **Webhooks** : Notifications automatiques des changements