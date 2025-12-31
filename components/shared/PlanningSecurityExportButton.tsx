import React from 'react';
import { Download, Shield, Clock } from 'lucide-react';
import { useExport } from '../../hooks/useExport';
import toast from 'react-hot-toast';

interface PlanningSecurityExportButtonProps {
  sessionId: string;
  sessionName: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

export function PlanningSecurityExportButton({
  sessionId,
  sessionName,
  className = '',
  variant = 'outline',
  size = 'md',
  showIcon = true,
  showLabel = true
}: PlanningSecurityExportButtonProps) {
  const { exportPlanningComplet, isExporting } = useExport();

  const handleExport = async () => {
    if (!sessionId || !sessionName) {
      toast.error('Informations de session manquantes');
      return;
    }

    try {
      await exportPlanningComplet(sessionId, sessionName);
      toast.success('Export de sécurité du planning créé avec succès !', {
        duration: 4000,
        icon: '🛡️'
      });
    } catch (error) {
      console.error('Erreur export planning sécurité:', error);
      toast.error('Erreur lors de l\'export de sécurité');
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2'
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const getIconSize = () => {
    return size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={getButtonClasses()}
      title="Export de sécurité du planning complet avec horodatage"
    >
      {showIcon && (
        <div className="relative">
          {isExporting ? (
            <Clock className="animate-spin" size={getIconSize()} />
          ) : (
            <>
              <Download size={getIconSize()} />
              <Shield 
                size={getIconSize() * 0.6} 
                className="absolute -top-1 -right-1 text-green-600" 
              />
            </>
          )}
        </div>
      )}
      
      {showLabel && (
        <span>
          {isExporting ? 'Export en cours...' : 'Export sécurité'}
        </span>
      )}
    </button>
  );
}

export default PlanningSecurityExportButton;