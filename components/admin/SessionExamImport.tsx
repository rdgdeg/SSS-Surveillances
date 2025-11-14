import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '../shared/Button';

interface SessionExamImportProps {
  sessionId: string;
}

interface ParsedExam {
  code_examen: string;
  nom_examen: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  auditoires: string;
  enseignants: string[];
  secretariat: string;
}

interface ImportResult {
  imported: number;
  updated: number;
  errors: string[];
  warnings: string[];
}

export function SessionExamImport({ sessionId }: SessionExamImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseDate = (dateStr: string): string | null => {
    // Format: DD-MM-YY or DD/MM/YY
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return null;
    
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    
    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }
    
    return `${year}-${month}-${day}`;
  };

  const parseTime = (timeStr: string): string | null => {
    // Format: HHhMM or HH:MM
    const match = timeStr.match(/(\d{1,2})[h:](\d{2})/);
    if (!match) return null;
    
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    
    return `${hours}:${minutes}`;
  };

  const parseDuration = (durationStr: string): number => {
    // Format: HHhMM
    const match = durationStr.match(/(\d{1,2})h(\d{2})/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    return hours * 60 + minutes;
  };

  const parseExamCode = (activite: string): string => {
    // Extract code from format like "WMDS2221=E"
    return activite.split('=')[0].trim();
  };

  const parseEnseignants = (enseignantsStr: string): string[] => {
    if (!enseignantsStr || enseignantsStr.trim() === '') return [];
    
    // Split by comma or semicolon
    return enseignantsStr
      .split(/[,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  };

  const parseCSV = (content: string): { exams: ParsedExam[]; errors: string[] } => {
    const lines = content.split('\n').filter(line => line.trim());
    const exams: ParsedExam[] = [];
    const errors: string[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = parseCSVLine(lines[i]);
        
        if (cols.length < 9) {
          errors.push(`Ligne ${i + 1}: Nombre de colonnes insuffisant`);
          continue;
        }

        const date = parseDate(cols[0]);
        const debut = parseTime(cols[3]);
        const fin = parseTime(cols[4]);
        const duree = parseDuration(cols[2]);
        const code = parseExamCode(cols[5]);

        if (!date) {
          errors.push(`Ligne ${i + 1}: Date invalide (${cols[0]})`);
          continue;
        }

        if (!debut || !fin) {
          errors.push(`Ligne ${i + 1}: Horaire invalide (${cols[3]} - ${cols[4]})`);
          continue;
        }

        exams.push({
          code_examen: code,
          nom_examen: cols[6].trim(),
          date_examen: date,
          heure_debut: debut,
          heure_fin: fin,
          duree_minutes: duree,
          auditoires: cols[7].trim(),
          enseignants: parseEnseignants(cols[8]),
          secretariat: cols[9]?.trim() || 'Non assigné'
        });
      } catch (error) {
        errors.push(`Ligne ${i + 1}: Erreur de parsing - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    return { exams, errors };
  };

  const importExams = async (exams: ParsedExam[]): Promise<ImportResult> => {
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const exam of exams) {
      try {
        // Check if exam already exists
        const { data: existing } = await supabase
          .from('examens')
          .select('id')
          .eq('session_id', sessionId)
          .eq('code_examen', exam.code_examen)
          .maybeSingle();

        if (existing) {
          // Update existing exam
          const { error } = await supabase
            .from('examens')
            .update({
              nom_examen: exam.nom_examen,
              date_examen: exam.date_examen,
              heure_debut: exam.heure_debut,
              heure_fin: exam.heure_fin,
              duree_minutes: exam.duree_minutes,
              auditoires: exam.auditoires,
              enseignants: exam.enseignants,
              secretariat: exam.secretariat,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) throw error;
          updated++;
        } else {
          // Insert new exam
          const { error } = await supabase
            .from('examens')
            .insert({
              session_id: sessionId,
              code_examen: exam.code_examen,
              nom_examen: exam.nom_examen,
              date_examen: exam.date_examen,
              heure_debut: exam.heure_debut,
              heure_fin: exam.heure_fin,
              duree_minutes: exam.duree_minutes,
              auditoires: exam.auditoires,
              enseignants: exam.enseignants,
              secretariat: exam.secretariat,
              saisie_manuelle: false,
              valide: true
            });

          if (error) throw error;
          imported++;
        }

        // Check if cours exists for linking
        const { data: cours } = await supabase
          .from('cours')
          .select('id')
          .eq('code', exam.code_examen)
          .maybeSingle();

        if (!cours) {
          warnings.push(`${exam.code_examen}: Aucun cours correspondant trouvé pour liaison automatique`);
        }
      } catch (error) {
        errors.push(`${exam.code_examen}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    return { imported, updated, errors, warnings };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const content = await selectedFile.text();
      const { exams, errors: parseErrors } = parseCSV(content);

      if (parseErrors.length > 0) {
        setImportResult({
          imported: 0,
          updated: 0,
          errors: parseErrors,
          warnings: []
        });
        return;
      }

      const result = await importExams(exams);
      setImportResult(result);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['examens'] });
      queryClient.invalidateQueries({ queryKey: ['examens-without-cours'] });

      // Reset file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportResult({
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        warnings: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Importer des examens par session
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fichier CSV
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                cursor-pointer disabled:opacity-50"
            />
          </div>

          {selectedFile && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </>
              )}
            </Button>

            {(selectedFile || importResult) && !isImporting && (
              <Button variant="outline" onClick={handleCancel}>
                {importResult ? 'Fermer' : 'Annuler'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className="space-y-4">
          {/* Success Summary */}
          {(importResult.imported > 0 || importResult.updated > 0) && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                    Import réussi
                  </h4>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <p>✓ {importResult.imported} examen(s) créé(s)</p>
                    <p>✓ {importResult.updated} examen(s) mis à jour</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {importResult.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Avertissements ({importResult.warnings.length})
                  </h4>
                  <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1 max-h-48 overflow-y-auto">
                    {importResult.warnings.map((warning, idx) => (
                      <p key={idx}>• {warning}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                    Erreurs ({importResult.errors.length})
                  </h4>
                  <div className="text-xs text-red-800 dark:text-red-200 space-y-1 max-h-48 overflow-y-auto">
                    {importResult.errors.map((error, idx) => (
                      <p key={idx}>• {error}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Format du fichier CSV
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p className="font-medium">Colonnes attendues (séparées par point-virgule) :</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Date (DD-MM-YY ou DD/MM/YY)</li>
            <li>Jour (texte, ignoré)</li>
            <li>Durée (HHhMM, ex: 02h00)</li>
            <li>Heure début (HHhMM ou HH:MM)</li>
            <li>Heure fin (HHhMM ou HH:MM)</li>
            <li>Activité/Code (ex: WMDS2221=E)</li>
            <li>Nom de l'examen</li>
            <li>Auditoires</li>
            <li>Enseignants (séparés par virgules)</li>
            <li>Secrétariat</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
            <p className="font-medium mb-1">Notes importantes :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Les examens existants seront mis à jour</li>
              <li>Les cours doivent être créés séparément dans l'onglet "Lier aux cours"</li>
              <li>Les consignes sont gérées au niveau des cours, pas des examens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
