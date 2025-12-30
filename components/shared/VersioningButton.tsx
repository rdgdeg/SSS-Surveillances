import React, { useState } from 'react';
import { Button } from './Button';
import { History, Eye, RotateCcw } from 'lucide-react';
import VersionHistoryPanel from '../admin/VersionHistoryPanel';

interface VersioningButtonProps {
  tableName: string;
  recordId: string;
  onRestore?: () => void;
  variant?: 'button' | 'icon' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Composant bouton pour accéder rapidement au versioning d'un enregistrement
 */
const VersioningButton: React.FC<VersioningButtonProps> = ({
  tableName,
  recordId,
  onRestore,
  variant = 'button',
  size = 'sm',
  className = ''
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const handleClick = () => {
    setShowHistory(true);
  };

  const renderButton = () => {
    const baseClasses = `flex items-center gap-2 ${className}`;
    
    switch (variant) {
      case 'icon':
        return (
          <Button
            variant="ghost"
            size={size}
            onClick={handleClick}
            className={baseClasses}
            title="Voir l'historique des versions"
          >
            <History className="h-4 w-4" />
          </Button>
        );
      
      case 'link':
        return (
          <button
            onClick={handleClick}
            className={`text-blue-600 hover:text-blue-800 underline text-sm ${baseClasses}`}
          >
            <History className="h-3 w-3" />
            Historique
          </button>
        );
      
      default:
        return (
          <Button
            variant="outline"
            size={size}
            onClick={handleClick}
            className={baseClasses}
          >
            <History className="h-4 w-4" />
            Historique
          </Button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      {/* Modal d'historique */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des versions - {tableName}
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowHistory(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <VersionHistoryPanel
                tableName={tableName}
                recordId={recordId}
                onRestore={() => {
                  onRestore?.();
                  setShowHistory(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VersioningButton;