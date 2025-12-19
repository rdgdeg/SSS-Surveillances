import React, { useState } from 'react';
import { Calendar, Download, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import {
  generateICSContent,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  generateYahooCalendarURL,
  downloadICSFile,
  surveillanceToCalendarEvent,
  CalendarEvent
} from '../../lib/calendarUtils';

interface CalendarExportButtonProps {
  surveillance?: {
    nom_examen: string;
    date_examen: string;
    heure_debut: string;
    heure_fin: string;
    auditoire?: string;
    type_examen?: string;
    faculte?: string;
  };
  event?: CalendarEvent;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CalendarExportButton: React.FC<CalendarExportButtonProps> = ({
  surveillance,
  event,
  variant = 'dropdown',
  size = 'sm',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Convertir la surveillance en événement de calendrier si nécessaire
  const calendarEvent = event || (surveillance ? surveillanceToCalendarEvent(surveillance) : null);

  if (!calendarEvent) {
    return null;
  }

  const handleDownloadICS = () => {
    const icsContent = generateICSContent(calendarEvent);
    const filename = `surveillance-${calendarEvent.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
    downloadICSFile(icsContent, filename);
    setIsOpen(false);
  };

  const handleOpenInCalendar = (url: string) => {
    window.open(url, '_blank');
    setIsOpen(false);
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={handleDownloadICS}
        variant="outline"
        size={size}
        className={`${className}`}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Ajouter à l'agenda
      </Button>
    );
  }

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size={size}
        className={`${className} flex items-center`}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Ajouter à l'agenda
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {/* Télécharger fichier ICS */}
              <button
                onClick={handleDownloadICS}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="mr-3 h-4 w-4" />
                Télécharger (.ics)
              </button>

              <div className="border-t border-gray-200 dark:border-gray-600 my-1" />

              {/* Google Calendar */}
              <button
                onClick={() => handleOpenInCalendar(generateGoogleCalendarURL(calendarEvent))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="mr-3 h-4 w-4" />
                Google Calendar
              </button>

              {/* Outlook */}
              <button
                onClick={() => handleOpenInCalendar(generateOutlookCalendarURL(calendarEvent))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="mr-3 h-4 w-4" />
                Outlook Calendar
              </button>

              {/* Yahoo Calendar */}
              <button
                onClick={() => handleOpenInCalendar(generateYahooCalendarURL(calendarEvent))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="mr-3 h-4 w-4" />
                Yahoo Calendar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarExportButton;