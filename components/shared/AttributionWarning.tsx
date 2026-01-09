import React from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, FileSpreadsheet, Calendar } from 'lucide-react';

interface AttributionWarningProps {
  examenCode?: string;
  delay?: number;
}

export const showAttributionWarning = (examenCode?: string, delay: number = 1000) => {
  setTimeout(() => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-amber-50 border border-amber-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Attributions modifiées !
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {examenCode && `Pour l'examen ${examenCode}, n`}N'oubliez pas de mettre à jour :
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-amber-600">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    <span>Excel</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Planning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-l border-amber-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              OK
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: 'top-right',
      }
    );
  }, delay);
};

export default function AttributionWarning({ examenCode, delay = 1000 }: AttributionWarningProps) {
  React.useEffect(() => {
    showAttributionWarning(examenCode, delay);
  }, [examenCode, delay]);

  return null;
}