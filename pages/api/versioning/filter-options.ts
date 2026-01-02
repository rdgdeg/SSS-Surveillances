import { NextApiRequest, NextApiResponse } from 'next';
import { getFilterOptions } from '../../../lib/enhancedVersioningApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const filterOptions = await getFilterOptions();
    res.status(200).json(filterOptions);

  } catch (error) {
    console.error('Filter options API Error:', error);
    res.status(500).json({ 
      error: 'Erreur lors du chargement des options de filtre', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}