import { NextApiRequest, NextApiResponse } from 'next';
import { 
  getVersionEvents, 
  deleteVersionEvents, 
  FilterOptions 
} from '../../../lib/enhancedVersioningApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Récupérer les événements avec filtres
      const filters: FilterOptions = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        operationType: req.query.operationType as string,
        tableName: req.query.tableName as string,
        username: req.query.username as string,
        searchTerm: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      // Nettoyer les filtres vides
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof FilterOptions]) {
          delete filters[key as keyof FilterOptions];
        }
      });

      const events = await getVersionEvents(filters);
      res.status(200).json(events);

    } else if (req.method === 'DELETE') {
      // Supprimer des événements spécifiques
      const { eventIds } = req.body;

      if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(400).json({ error: 'eventIds requis et doit être un tableau non vide' });
      }

      const deletedCount = await deleteVersionEvents(eventIds);
      res.status(200).json({ deletedCount });

    } else {
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}