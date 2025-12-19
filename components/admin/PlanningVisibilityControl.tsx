import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Session } from '../../types';

interface Props {
  session: Session;
}

export function PlanningVisibilityControl({ session }: Props) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleVisibility = useMutation({
    mutationFn: async (visible: boolean) => {
      const { error } = await supabase
        .from('sessions')
        .update({ planning_visible: visible })
        .eq('id', session.id);

      if (error) throw error;
    },
    onSuccess: (_, visible) => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      toast.success(
        visible 
          ? 'Planning rendu visible pour le public' 
          : 'Planning masqué pour le public'
      );
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de la visibilité');
    },
  });

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await toggleVisibility.mutateAsync(!session.planning_visible);
    } finally {
      setIsUpdating(false);
    }
  };

  const isVisible = session.planning_visible ?? false;

  return (
    <div className={`rounded-lg border-2 p-4 ${
      isVisible 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
        : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isVisible ? (
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
            <h3 className={`font-semibold ${
              isVisible 
                ? 'text-green-900 dark:text-green-200' 
                : 'text-gray-900 dark:text-gray-200'
            }`}>
              Visibilité du Planning Public
            </h3>
          </div>
          <p className={`text-sm ${
            isVisible 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {isVisible ? (
              <>
                <strong>Planning visible :</strong> Les surveillants peuvent consulter le planning des examens et leurs attributions.
              </>
            ) : (
              <>
                <strong>Planning masqué :</strong> Le planning n'est pas accessible au public. 
                Activez-le quand vous êtes prêt à publier les attributions.
              </>
            )}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isVisible
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : isVisible ? (
            <>
              <EyeOff className="h-4 w-4" />
              Masquer
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Rendre visible
            </>
          )}
        </button>
      </div>

      {!isVisible && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            💡 Conseil : Rendez le planning visible une fois que toutes les attributions sont complètes et vérifiées.
          </p>
        </div>
      )}
    </div>
  );
}
