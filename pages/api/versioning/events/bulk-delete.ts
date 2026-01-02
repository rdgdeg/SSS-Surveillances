import { NextApiRequest, NextApiResponse } from 'next';
import { bulkDeleteVersionEvents } from '../../../../lib/enhancedVersioningApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'DELETE') {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { dateFrom, dateTo, tableName, operationType, username } = req.body;

    // Validation des paramètres requis
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ 
        error: 'Les paramètres dateFrom et dateTo sont requis' 
      });
    }

    // Validation des dates
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        error: 'Format de date invalide' 
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({ 
        error: 'La date de début doit être antérieure à la date de fin' 
      });
    }

    // Vérification de sécurité : ne pas permettre de supprimer plus de 90 jours d'historique d'un coup
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 90) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer plus de 90 jours d\'historique en une seule opération' 
      });
    }

    const deletedCount = await bulkDeleteVersionEvents({
      dateFrom,
      dateTo,
      tableName,
      operationType,
      username
    });

    res.status(200).json({ 
      deletedCount,
      message: `${deletedCount} événement(s) supprimé(s) avec succès`
    });

  } catch (error) {
    console.error('Bulk delete API Error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression en masse', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}