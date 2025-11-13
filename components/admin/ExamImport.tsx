import React, { useState, useRef } from 'react';
import { useExamenImport } from '../../src/hooks/useExamens';

interface ExamImportProps {
  sessionId: string;
}

export function ExamImport({ sessionId }: ExamImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importMutation = useExamenImport((current, total) => {
    setProgress({ current, total });
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setShowErrors(false);
      setPreviewError(null);
      
      // Generate preview
      try {
        const content = await file.text();
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setPreviewError('Le fichier est vide');
          setPreviewData(null);
          return;
        }
        
        // Parse first 10 rows (including header)
        const preview = lines.slice(0, 11).map(line => 
          line.split(';').map(col => col.trim())
        );
        
        setPreviewData(preview);
      } catch (error) {
        setPreviewError('Erreur lors de la lecture du fichier');
        setPreviewData(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setProgress({ current: 0, total: 0 });
      const result = await importMutation.mutateAsync({ sessionId, file: selectedFile });
      
      setImportResult(result);
      setProgress(null);
      
      // Reset file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setProgress(null);
      alert(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setImportResult(null);
    setShowErrors(false);
    setPreviewData(null);
    setPreviewError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Importer des examens</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier CSV
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
              disabled={importMutation.isPending}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Format: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin
          </p>
        </div>

        {selectedFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-900 font-medium">{selectedFile.name}</span>
                <span className="text-xs text-blue-700 ml-2">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CSV Preview */}
        {previewData && previewData.length > 0 && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">
                Aperçu (10 premières lignes)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {previewData[0].map((header, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header || `Col ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap max-w-xs truncate"
                          title={cell}
                        >
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview Error */}
        {previewError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-900">{previewError}</span>
            </div>
          </div>
        )}

        {importMutation.isPending && progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Import en cours...</span>
              <span className="text-sm text-blue-700">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}% complété
            </p>
          </div>
        )}

        {importResult && (
          <div className="space-y-3">
            {/* Résumé de l'import */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900">Import terminé</h4>
                  <div className="mt-2 text-sm text-green-800">
                    <p>{importResult.imported} examen(s) créé(s)</p>
                    <p>{importResult.updated} examen(s) mis à jour</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {importResult.warnings && importResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-900">
                      Avertissements ({importResult.warnings.length})
                    </h4>
                    <div className="mt-2 text-xs text-yellow-800 max-h-32 overflow-y-auto">
                      {importResult.warnings.slice(0, 5).map((warning: string, idx: number) => (
                        <p key={idx} className="mb-1">• {warning}</p>
                      ))}
                      {importResult.warnings.length > 5 && (
                        <p className="text-yellow-700 font-medium">
                          ... et {importResult.warnings.length - 5} autres avertissements
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-900">
                      Erreurs ({importResult.errors.length})
                    </h4>
                    {!showErrors && (
                      <button
                        onClick={() => setShowErrors(true)}
                        className="mt-2 text-xs text-red-700 underline hover:text-red-800"
                      >
                        Afficher les erreurs
                      </button>
                    )}
                    {showErrors && (
                      <div className="mt-2 text-xs text-red-800 max-h-48 overflow-y-auto">
                        {importResult.errors.map((error: string, idx: number) => (
                          <p key={idx} className="mb-1">• {error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Importer
          </button>
          
          {(selectedFile || importResult) && !importMutation.isPending && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {importResult ? 'Fermer' : 'Annuler'}
            </button>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Le fichier doit être au format CSV avec séparateur point-virgule (;)</li>
            <li>Format: Code Examen;Nom Examen;Enseignants;Date;Heure Début;Heure Fin</li>
            <li>Enseignants: emails séparés par des virgules (ex: prof1@univ.be,prof2@univ.be)</li>
            <li>Date au format YYYY-MM-DD (optionnel)</li>
            <li>Heures au format HH:MM (optionnel)</li>
            <li>Les examens existants seront mis à jour</li>
            <li>Taille maximale: 10 MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
