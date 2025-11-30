import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { updateCreneauCapacity } from '../../lib/api';
import toast from 'react-hot-toast';

interface CapacityInputProps {
  creneauId: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  disabled?: boolean;
  autoSave?: boolean; // Si true, sauvegarde automatiquement après 500ms
}

export const CapacityInput: React.FC<CapacityInputProps> = ({
  creneauId,
  value,
  onChange,
  disabled = false,
  autoSave = true
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour la valeur locale quand la prop change
  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  // Debounce pour la sauvegarde automatique
  useEffect(() => {
    if (!autoSave) return;

    const timer = setTimeout(() => {
      if (localValue !== (value?.toString() || '')) {
        handleSave();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, autoSave]);

  const validateValue = (val: string): { valid: boolean; error?: string; numValue?: number } => {
    if (val === '') {
      return { valid: true, numValue: undefined };
    }

    const num = parseInt(val, 10);
    
    if (isNaN(num)) {
      return { valid: false, error: 'Valeur invalide' };
    }

    if (num < 1 || num > 100) {
      return { valid: false, error: 'Entre 1 et 100' };
    }

    return { valid: true, numValue: num };
  };

  const handleSave = async () => {
    const validation = validateValue(localValue);
    
    if (!validation.valid) {
      setError(validation.error || 'Valeur invalide');
      return;
    }

    setError(null);
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateCreneauCapacity(creneauId, validation.numValue || null);
      
      if (onChange) {
        onChange(validation.numValue);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setError(null);
    setSaveSuccess(false);

    // Si pas d'auto-save, notifier immédiatement le parent
    if (!autoSave && onChange) {
      const validation = validateValue(newValue);
      if (validation.valid) {
        onChange(validation.numValue);
      }
    }
  };

  const handleBlur = () => {
    if (!autoSave) {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <Input
        type="number"
        min="1"
        max="100"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSaving}
        placeholder="Non défini"
        className={`w-24 text-center ${error ? 'border-red-500 focus:ring-red-500' : ''} ${saveSuccess ? 'border-green-500' : ''}`}
      />
      
      {/* Indicateurs de statut */}
      <div className="flex items-center gap-1">
        {isSaving && (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
        )}
        
        {saveSuccess && !isSaving && (
          <Check className="h-4 w-4 text-green-500" />
        )}
        
        {error && !isSaving && (
          <div className="relative group">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
