import { Surveillant, SurveillantType } from '../types';

interface CSVRow {
  Nom: string;
  Prénom: string;
  'Affect.fac': string;
  'Affect.ins': string;
  StSal: string;
  'EFT T.': string;
  'EFT R.': string;
  'EFT A.': string;
  'Texte cat. prés./abs.': string;
  'Fin Absc.': string;
  'Fin R. Pos': string;
  'D. Type oc': string;
  Mails: string;
}

export function parseCSV(csvContent: string): Partial<Surveillant>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(';');
  const surveillants: Partial<Surveillant>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });

    const email = row['Mails']?.toLowerCase().trim();
    if (!email) continue;

    const eftTotal = parseFloat(row['EFT T.']?.replace(',', '.') || '0');
    const quotaSurveillances = Math.round(eftTotal * 6);

    const surveillant: Partial<Surveillant> = {
      nom: row['Nom'] || '',
      prenom: row['Prénom'] || '',
      email: email,
      type: SurveillantType.ASSISTANT,
      affectation_faculte: row['Affect.fac'] || '',
      affectation_institut: row['Affect.ins'] || '',
      statut_salarial: row['StSal'] || '',
      etp_total: eftTotal || undefined,
      etp_recherche: parseFloat(row['EFT R.']?.replace(',', '.') || '0') || undefined,
      etp_autre: parseFloat(row['EFT A.']?.replace(',', '.') || '0') || undefined,
      categorie_presence: row['Texte cat. prés./abs.'] || '',
      fin_absence: row['Fin Absc.'] ? convertDate(row['Fin Absc.']) : undefined,
      fin_repos_postnatal: row['Fin R. Pos'] ? convertDate(row['Fin R. Pos']) : undefined,
      type_occupation: row['D. Type oc'] || '',
      quota_surveillances: quotaSurveillances,
      is_active: true,
    };

    surveillants.push(surveillant);
  }

  return surveillants;
}

function convertDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  
  // Format: DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return undefined;
}
