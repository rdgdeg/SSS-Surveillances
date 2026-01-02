import { NextApiRequest, NextApiResponse } from 'next';
import { exportVersionEvents, FilterOptions } from '../../../../lib/enhancedVersioningApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const format = (req.query.format as string) || 'json';
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Format non supporté. Utilisez json ou csv.' });
    }

    const filters: FilterOptions = {
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      operationType: req.query.operationType as string,
      tableName: req.query.tableName as string,
      username: req.query.username as string,
      searchTerm: req.query.searchTerm as string
    };

    // Nettoyer les filtres vides
    Object.keys(filters).forEach(key => {
      if (!filters[key as keyof FilterOptions]) {
        delete filters[key as keyof FilterOptions];
      }
    });

    const exportData = await exportVersionEvents(filters, format as 'json' | 'csv');

    // Définir les headers appropriés
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `versioning-events-${timestamp}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    // Ajouter BOM pour CSV pour un meilleur support des caractères spéciaux
    if (format === 'csv') {
      res.write('\uFEFF'); // BOM UTF-8
    }

    res.status(200).send(exportData);

  } catch (error) {
    console.error('Export API Error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'export', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}