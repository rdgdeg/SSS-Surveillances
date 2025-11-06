import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSurveillant } from '../../lib/api';
import { SurveillantType } from '../../types';
import * as XLSX from 'xlsx';

interface ImportedSurveillant {
  nom: string;
  prenom: string;
  email: string;
  type: SurveillantType;
  affectation_faculte?: string;
  etp?: number;
  quota_defaut?: number;
  is_active: boolean;
}

interface ImportResult {
  success: ImportedSurveillant[];
  errors: { row: number; error: string; data: any }[];
}

const SurveillantImport: React.FC<{ onImportComplete: () => void }> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        toast.error('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx)');
      }
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    const result: string[][] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        // Simple CSV parsing - peut être amélioré pour gérer les guillemets
        const fields = line.split(/[,;\t]/).map(field => field.trim().replace(/^"|"$/g, ''));
        result.push(fields);
      }
    }
    
    return result;
  };

  const mapSurveillantType = (value: string): SurveillantType => {
    const normalized = value.toLowerCase().trim();
    
    if (normalized.includes('assistant') || normalized === 'st') return SurveillantType.ASSISTANT;
    if (normalized.includes('pat') || normalized.includes('personnel')) return SurveillantType.PAT;
    if (normalized.includes('jobiste')) return SurveillantType.JOBISTE;
    
    return SurveillantType.AUTRE;
  };

  const processImportData = (data: string[][]): ImportResult => {
    const result: ImportResult = { success: [], errors: [] };
    
    if (data.length < 2) {
      result.errors.push({ row: 0, error: 'Fichier vide ou sans données', data: null });
      return result;
    }

    const headers = data[0].map(h => h.toLowerCase().trim());
    console.log('Headers détectés:', headers);

    // Mapping des colonnes basé sur votre fichier
    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => {
          const headerClean = h.toLowerCase().trim().replace(/[.\s]/g, '');
          const nameClean = name.toLowerCase().replace(/[.\s]/g, '');
          return headerClean.includes(nameClean) || nameClean.includes(headerClean);
        });
        if (index !== -1) return index;
      }
      return -1;
    };

    const nomIndex = getColumnIndex(['nom', 'name', 'lastname']);
    const prenomIndex = getColumnIndex(['prénom', 'prenom', 'firstname']);
    const emailIndex = getColumnIndex(['mails', 'mail', 'email', 'e-mail']);
    const typeIndex = getColumnIndex(['stsal', 'type', 'statut', 'status']);
    const faculteIndex = getColumnIndex(['affectfac', 'faculte', 'faculty', 'affectation']);
    const etpIndex = getColumnIndex(['eft t', 'eftt', 'etp', 'fte']);
    const etpRIndex = getColumnIndex(['eft r', 'eftr']);
    const etpAIndex = getColumnIndex(['eft a', 'efta']);

    if (nomIndex === -1 || prenomIndex === -1) {
      result.errors.push({ 
        row: 0, 
        error: 'Colonnes obligatoires manquantes: Nom et Prénom requis', 
        data: headers 
      });
      return result;
    }

    // Traiter chaque ligne (en sautant l'en-tête)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      try {
        const nom = row[nomIndex]?.trim();
        const prenom = row[prenomIndex]?.trim();
        
        if (!nom || !prenom) {
          result.errors.push({ 
            row: i + 1, 
            error: 'Nom ou prénom manquant', 
            data: row 
          });
          continue;
        }

        // Générer email si manquant
        let email = emailIndex !== -1 ? row[emailIndex]?.trim() : '';
        if (!email) {
          // Générer email basé sur nom.prenom@uclouvain.be
          const nomClean = nom.toLowerCase().replace(/[^a-z]/g, '');
          const prenomClean = prenom.toLowerCase().replace(/[^a-z]/g, '');
          email = `${prenomClean}.${nomClean}@uclouvain.be`;
        }

        // Déterminer le type
        const typeValue = typeIndex !== -1 ? row[typeIndex]?.trim() || '' : '';
        const type = mapSurveillantType(typeValue);

        // Faculté
        const affectation_faculte = faculteIndex !== -1 ? row[faculteIndex]?.trim() : undefined;

        // ETP - prendre la première valeur ETP disponible
        let etp: number | undefined;
        const etpColumns = [etpIndex, etpRIndex, etpAIndex].filter(idx => idx !== -1);
        for (const idx of etpColumns) {
          if (row[idx] && row[idx].trim()) {
            const etpValue = parseFloat(row[idx].replace(',', '.'));
            if (!isNaN(etpValue) && etpValue > 0) {
              etp = etpValue;
              break;
            }
          }
        }

        const surveillant: ImportedSurveillant = {
          nom,
          prenom,
          email,
          type,
          affectation_faculte,
          etp,
          quota_defaut: undefined, // À définir manuellement si nécessaire
          is_active: true
        };

        result.success.push(surveillant);

      } catch (error) {
        result.errors.push({ 
          row: i + 1, 
          error: `Erreur de traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 
          data: row 
        });
      }
    }

    return result;
  };

  const processFile = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      let data: string[][];

      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        data = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Traitement Excel avec xlsx
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en tableau 2D
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        data = jsonData as string[][];
      } else {
        toast.error('Format de fichier non supporté');
        return;
      }

      const result = processImportData(data);
      setImportResult(result);
      setShowPreview(true);

      if (result.success.length > 0) {
        toast.success(`${result.success.length} surveillants prêts à importer`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erreurs détectées`);
      }

    } catch (error) {
      toast.error('Erreur lors de la lecture du fichier');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const executeImport = async () => {
    if (!importResult?.success.length) return;

    setIsProcessing(true);
    let imported = 0;
    let failed = 0;

    try {
      for (const surveillant of importResult.success) {
        try {
          await createSurveillant(surveillant);
          imported++;
        } catch (error) {
          failed++;
          console.error('Erreur import surveillant:', surveillant, error);
        }
      }

      toast.success(`Import terminé: ${imported} créés, ${failed} échecs`);
      
      if (imported > 0) {
        onImportComplete();
        setFile(null);
        setImportResult(null);
        setShowPreview(false);
      }

    } catch (error) {
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Nom,Prénom,AffectFac,AffectLins,StSal,EFT T.,EFT R.,EFT A.,Texte cat. prés./abs.,Fin Absc.,Fin R. Pos,D. Type sc,Mails
Akue,Mathilde,FASB,LDRI,ST,1,,,,,14.09.2026,,mathilde.akue@uclouvain.be
Albert,Lisa,FSP,IRSS,ST,1,,,,,14.09.2027,,lisa.albert@uclouvain.be
Alves Jorge,Sara,FSP,IPSY,ST,1,,,,,14.09.2026,,sara.alvesjorge@uclouvain.be
André,Grégoire,ASS,IREC,ST,0.8,,,,,14.09.2026,,gregoire.andre@uclouvain.be`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_surveillants_uclouvain.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import de surveillants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger le modèle CSV
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Sélectionnez un fichier CSV ou Excel
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">CSV, XLS ou XLSX jusqu'à 10MB</p>
              </div>
            </div>
          </div>

          {file && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={processFile} disabled={isProcessing}>
                    {isProcessing ? 'Traitement...' : 'Analyser'}
                  </Button>
                  <Button variant="ghost" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de l'import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{importResult.success.length} surveillants valides</span>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">{importResult.errors.length} erreurs</span>
                </div>
              </div>
            </div>

            {importResult.success.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Surveillants à importer:</h4>
                <div className="max-h-40 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left">Nom</th>
                        <th className="px-3 py-2 text-left">Prénom</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.success.slice(0, 10).map((s, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{s.nom}</td>
                          <td className="px-3 py-2">{s.prenom}</td>
                          <td className="px-3 py-2">{s.email}</td>
                          <td className="px-3 py-2">{s.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.success.length > 10 && (
                    <p className="p-2 text-center text-gray-500">
                      ... et {importResult.success.length - 10} autres
                    </p>
                  )}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Erreurs détectées:</h4>
                <div className="max-h-32 overflow-y-auto border rounded bg-red-50 dark:bg-red-900/20">
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="p-2 border-b text-sm">
                      <span className="font-medium">Ligne {error.row}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Annuler
              </Button>
              <Button 
                onClick={executeImport} 
                disabled={isProcessing || importResult.success.length === 0}
              >
                {isProcessing ? 'Import en cours...' : `Importer ${importResult.success.length} surveillants`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SurveillantImport;