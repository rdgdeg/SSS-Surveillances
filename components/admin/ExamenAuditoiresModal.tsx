import React from 'react';
import { X } from 'lucide-react';
import ExamenAuditoiresManager from './ExamenAuditoiresManager';

interface Props {
  examenId: string;
  examenNom: string;
  onClose: () => void;
}

export default function ExamenAuditoiresModal({ examenId, examenNom, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Auditoires et Surveillants
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {examenNom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ExamenAuditoiresManager examenId={examenId} />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
