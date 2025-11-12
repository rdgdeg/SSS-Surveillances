import React from 'react';
import { Badge } from './Badge';
import { AlertTriangle, AlertCircle, CheckCircle, Minus } from 'lucide-react';
import { StatutRemplissage } from '../../types';

interface FillRateIndicatorProps {
  disponibles: number;
  requis?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FillRateIndicator: React.FC<FillRateIndicatorProps> = ({
  disponibles,
  requis,
  showDetails = true,
  size = 'md'
}) => {
  // Si pas de capacité définie
  if (!requis) {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge variant="default" className="flex items-center gap-1">
          <Minus className="h-3 w-3" />
          {showDetails && <span>Non défini</span>}
        </Badge>
      </div>
    );
  }

  // Calculer le taux de remplissage
  const taux = (disponibles / requis) * 100;
  
  // Déterminer le statut
  let statut: StatutRemplissage;
  let variant: 'destructive' | 'warning' | 'success';
  let Icon;
  let bgColor: string;
  let textColor: string;

  if (taux < 50) {
    statut = 'critique';
    variant = 'destructive';
    Icon = AlertTriangle;
    bgColor = 'bg-red-100 dark:bg-red-900/30';
    textColor = 'text-red-800 dark:text-red-300';
  } else if (taux < 100) {
    statut = 'alerte';
    variant = 'warning';
    Icon = AlertCircle;
    bgColor = 'bg-orange-100 dark:bg-orange-900/30';
    textColor = 'text-orange-800 dark:text-orange-300';
  } else {
    statut = 'ok';
    variant = 'success';
    Icon = CheckCircle;
    bgColor = 'bg-green-100 dark:bg-green-900/30';
    textColor = 'text-green-800 dark:text-green-300';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (!showDetails) {
    return (
      <div className="relative group">
        <Badge variant={variant} className="flex items-center gap-1">
          <Icon className={iconSizes[size]} />
          <span>{Math.round(taux)}%</span>
        </Badge>
        
        {/* Tooltip au survol */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
          <div className="font-semibold">{disponibles}/{requis} surveillants</div>
          <div className="text-gray-300">Taux: {taux.toFixed(1)}%</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${bgColor} ${textColor} rounded-lg font-medium`}>
      <Icon className={iconSizes[size]} />
      <span className="font-semibold">{disponibles}/{requis}</span>
      <span className="opacity-75">•</span>
      <span className="font-bold">{Math.round(taux)}%</span>
    </div>
  );
};

// Composant pour afficher uniquement le badge de statut
export const FillRateStatusBadge: React.FC<{ statut: StatutRemplissage }> = ({ statut }) => {
  const config = {
    'critique': {
      variant: 'destructive' as const,
      label: 'Critique',
      Icon: AlertTriangle
    },
    'alerte': {
      variant: 'warning' as const,
      label: 'Alerte',
      Icon: AlertCircle
    },
    'ok': {
      variant: 'success' as const,
      label: 'OK',
      Icon: CheckCircle
    },
    'non-defini': {
      variant: 'default' as const,
      label: 'Non défini',
      Icon: Minus
    }
  };

  const { variant, label, Icon } = config[statut];

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
};
