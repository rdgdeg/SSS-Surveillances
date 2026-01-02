import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Secretariat {
  code_secretariat: string;
  nom_secretariat: string;
}

interface SecretariatSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const SecretariatSelect: React.FC<SecretariatSelectProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Sélectionner un secrétariat',
  required = false,
  disabled = false,
  error
}) => {
  const [secretariats, setSecretariats] = useState<Secretariat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecretariats();
  }, []);

  const loadSecretariats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consignes_secretariat')
        .select('code_secretariat, nom_secretariat')
        .eq('is_active', true)
        .order('code_secretariat');

      if (error) throw error;
      setSecretariats(data || []);
    } catch (err) {
      console.error('Error loading secretariats:', err);
      // Fallback avec les secrétariats par défaut
      setSecretariats([
        { code_secretariat: 'BAC11', nom_secretariat: 'BAC 11' },
        { code_secretariat: 'DENT', nom_secretariat: 'Faculté de Médecine Dentaire' },
        { code_secretariat: 'FASB', nom_secretariat: 'Faculté de Pharmacie et Sciences Biomédicales' },
        { code_secretariat: 'FSP', nom_secretariat: 'Faculté de Santé Publique' },
        { code_secretariat: 'MED', nom_secretariat: 'Faculté de Médecine' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const baseClassName = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  if (loading) {
    return (
      <select 
        disabled 
        className={`${baseClassName} ${className}`}
      >
        <option>Chargement...</option>
      </select>
    );
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseClassName} ${className}`}
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {secretariats.map((secretariat) => (
          <option 
            key={secretariat.code_secretariat} 
            value={secretariat.code_secretariat}
          >
            {secretariat.code_secretariat} - {secretariat.nom_secretariat}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SecretariatSelect;