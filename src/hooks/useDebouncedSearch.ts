import { useState, useEffect } from 'react';

/**
 * Hook pour gérer la recherche avec debouncing
 * Réduit le nombre d'appels API en attendant que l'utilisateur arrête de taper
 * 
 * @param delay Délai en millisecondes avant de déclencher la recherche (défaut: 300ms)
 * @returns Objet contenant le terme de recherche, le terme debounced et les setters
 */
export function useDebouncedSearch(delay = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  return {
    searchTerm,
    debouncedTerm,
    setSearchTerm,
    isDebouncing: searchTerm !== debouncedTerm
  };
}

/**
 * Hook générique pour debouncer n'importe quelle valeur
 * 
 * @param value Valeur à debouncer
 * @param delay Délai en millisecondes (défaut: 300ms)
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
