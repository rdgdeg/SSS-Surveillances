import { NextApiRequest, NextApiResponse } from 'next';
import { getVersioningStatistics } from '../../../lib/enhancedVersioningApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ 
        error: 'Le paramètre days doit être un nombre entre 1 et 365' 
      });
    }

    const statistics = await getVersioningStatistics(days);
    res.status(200).json(statistics);

  } catch (error) {
    console.error('Statistics API Error:', error);
    res.status(500).json({ 
      error: 'Erreur lors du chargement des statistiques', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}