import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import {
  SurveillanceCalendarEntry,
  formatMonthYear,
  getInitialCalendarMonth,
  getMonthCalendarWeeks,
  getWeekdayLabels,
  groupEntriesByDate,
  toDateKey,
} from '../../lib/surveillantCalendarUtils';

interface SurveillantMonthCalendarProps {
  surveillantName: string;
  entries: SurveillanceCalendarEntry[];
}

export default function SurveillantMonthCalendar({
  surveillantName,
  entries,
}: SurveillantMonthCalendarProps) {
  const initial = useMemo(() => getInitialCalendarMonth(entries), [entries]);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const entriesByDate = useMemo(() => groupEntriesByDate(entries), [entries]);
  const weeks = useMemo(() => getMonthCalendarWeeks(year, month), [year, month]);
  const todayKey = toDateKey(new Date());

  const goPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthEntries = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 sm:px-6 py-4 border-b border-indigo-200 dark:border-indigo-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
              Calendrier — {surveillantName}
            </h2>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-0.5">
              {monthEntries.length} surveillance{monthEntries.length !== 1 ? 's' : ''} ce mois
              {' · '}
              {entries.length} au total sur la session
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="p-2 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[10rem] text-center font-medium text-indigo-900 dark:text-indigo-100 capitalize">
              {formatMonthYear(year, month)}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              className="p-2 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            {getWeekdayLabels().map((label) => (
              <div
                key={label}
                className="bg-gray-50 dark:bg-gray-900/80 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide"
              >
                {label}
              </div>
            ))}

            {weeks.flat().map((day) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === month;
              const dayEntries = entriesByDate.get(key) ?? [];
              const isToday = key === todayKey;

              return (
                <div
                  key={key}
                  className={`min-h-[5.5rem] sm:min-h-[7rem] p-1 sm:p-1.5 flex flex-col bg-white dark:bg-gray-800 ${
                    !inMonth ? 'opacity-40' : ''
                  } ${dayEntries.length > 0 && inMonth ? 'ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800' : ''}`}
                >
                  <span
                    className={`text-xs sm:text-sm font-medium mb-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex-1 space-y-0.5 overflow-y-auto max-h-24 sm:max-h-32">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200/80 dark:border-indigo-700/80 text-[10px] sm:text-xs leading-tight"
                        title={`${entry.nom_examen} — ${entry.auditoire}`}
                      >
                        <div className="font-semibold text-indigo-900 dark:text-indigo-100 truncate flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                          {entry.heure_debut || '?'}
                          {entry.heure_fin ? `–${entry.heure_fin}` : ''}
                        </div>
                        <div className="text-indigo-800 dark:text-indigo-200 truncate font-medium">
                          {entry.code_examen}
                        </div>
                        <div className="text-indigo-700 dark:text-indigo-300 truncate flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                          {entry.auditoire}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="px-6 pb-6 text-sm text-gray-500 dark:text-gray-400 text-center">
          Aucune surveillance attribuée pour ce nom sur la session active.
        </p>
      )}
    </div>
  );
}
