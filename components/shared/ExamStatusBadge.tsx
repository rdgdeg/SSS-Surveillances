import React from 'react';
import { ExamenStatusBadgeVariant } from '../../types';

interface ExamStatusBadgeProps {
  status: ExamenStatusBadgeVariant;
  className?: string;
}

/**
 * Badge pour afficher le statut d'un examen
 * - declared (vert): Présence déclarée
 * - pending (orange): En attente de déclaration
 * - manual (bleu): Saisi manuellement
 */
export function ExamStatusBadge({ status, className = '' }: ExamStatusBadgeProps) {
  const variants = {
    declared: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Déclaré',
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    pending: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      label: 'En attente',
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    manual: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Saisie manuelle',
      icon: (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      )
    }
  };

  const variant = variants[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.bg} ${variant.text} ${className}`}
      role="status"
      aria-label={`Statut: ${variant.label}`}
    >
      {variant.icon}
      {variant.label}
    </span>
  );
}
