/**
 * Utilitaires pour la génération de fichiers de calendrier (ICS)
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  uid?: string;
}

/**
 * Formate une date pour le format ICS (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Échappe les caractères spéciaux pour le format ICS
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Génère un UID unique pour un événement
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sss-uclouvain.be`;
}

/**
 * Génère le contenu d'un fichier ICS pour un événement
 */
export function generateICSContent(event: CalendarEvent): string {
  const uid = event.uid || generateUID();
  const now = new Date();
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SSS UCLouvain//Surveillance Examens//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(event.startDate)}`,
    `DTEND:${formatICSDate(event.endDate)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICSText(event.description)}` : '',
    event.location ? `LOCATION:${escapeICSText(event.location)}` : '',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');

  return icsContent;
}

/**
 * Génère le contenu d'un fichier ICS pour plusieurs événements
 */
export function generateMultipleEventsICS(events: CalendarEvent[]): string {
  const now = new Date();
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SSS UCLouvain//Surveillance Examens//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    const uid = event.uid || generateUID();
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(event.endDate)}`,
      `SUMMARY:${escapeICSText(event.title)}`,
      event.description ? `DESCRIPTION:${escapeICSText(event.description)}` : '',
      event.location ? `LOCATION:${escapeICSText(event.location)}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  
  return icsContent.filter(line => line !== '').join('\r\n');
}

/**
 * Télécharge un fichier ICS
 */
export function downloadICSFile(content: string, filename: string = 'surveillance.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Génère une URL Google Calendar
 */
export function generateGoogleCalendarURL(event: CalendarEvent): string {
  const startDate = event.startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endDate = event.endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
    location: event.location || ''
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Génère une URL Outlook Calendar
 */
export function generateOutlookCalendarURL(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: event.description || '',
    location: event.location || ''
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Génère une URL Yahoo Calendar
 */
export function generateYahooCalendarURL(event: CalendarEvent): string {
  const duration = Math.floor((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60)); // en minutes
  
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: event.startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
    dur: duration.toString(),
    desc: event.description || '',
    in_loc: event.location || ''
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Convertit une surveillance en événement de calendrier
 */
export function surveillanceToCalendarEvent(surveillance: {
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  auditoire?: string;
  type_examen?: string;
  faculte?: string;
}): CalendarEvent {
  // Créer les dates de début et fin
  const startDate = new Date(`${surveillance.date_examen}T${surveillance.heure_debut}`);
  const endDate = new Date(`${surveillance.date_examen}T${surveillance.heure_fin}`);

  // Construire le titre
  let title = `Surveillance - ${surveillance.nom_examen}`;
  if (surveillance.auditoire) {
    title += ` (${surveillance.auditoire})`;
  }

  // Construire la description
  let description = `Surveillance d'examen\n\nExamen: ${surveillance.nom_examen}`;
  if (surveillance.type_examen) {
    description += `\nType: ${surveillance.type_examen}`;
  }
  if (surveillance.faculte) {
    description += `\nFaculté: ${surveillance.faculte}`;
  }
  description += `\nHoraire: ${surveillance.heure_debut} - ${surveillance.heure_fin}`;

  return {
    title,
    description,
    location: surveillance.auditoire || 'UCLouvain - Secteur des Sciences de la Santé',
    startDate,
    endDate,
    uid: `surveillance-${surveillance.nom_examen.replace(/\s+/g, '-').toLowerCase()}-${surveillance.date_examen}@sss-uclouvain.be`
  };
}