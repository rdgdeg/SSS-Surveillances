import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Button } from '../shared/Button';

interface ExamOrphanAlertProps {
  sessionId: string;
  onLinkClick: () => void;
}

export function ExamOrphanAlert({ sessionId, onLinkClick }: ExamOrphanAlertProps) {
  const { data: orphanCount } = useQuery({
    queryKey: ['exam-orphans', sessionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('examens')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .is('cours_id', null);
      
      if (error) throw error;
      return count || 0;
    },
  });

  if (!orphanCount || orphanCount === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Examens non liés à des cours
          </h3>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            <p>
              {orphanCount} examen{orphanCount > 1 ? 's' : ''} n'est pas lié à un cours de la liste générale.
              Les enseignants ne pourront pas déclarer leur présence pour ces examens.
            </p>
          </div>
          <div className="mt-4">
            <Button
              onClick={onLinkClick}
              size="sm"
              variant="outline"
              className="inline-flex items-center"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Lier les examens aux cours
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
