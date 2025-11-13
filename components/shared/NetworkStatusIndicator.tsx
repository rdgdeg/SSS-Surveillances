import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isOnline, onConnectionChange } from '../../lib/networkManager';

export default function NetworkStatusIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Écouter les changements de connexion
    const cleanup = onConnectionChange((isOnline) => {
      setOnline(isOnline);
      setShowNotification(true);
      
      // Masquer la notification après 5 secondes
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    });

    return cleanup;
  }, []);

  // Ne rien afficher si tout est normal et pas de notification
  if (online && !showNotification) {
    return null;
  }

  return (
    <>
      {/* Indicateur permanent en cas de hors-ligne */}
      {!online && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Hors ligne</span>
        </div>
      )}

      {/* Notification temporaire lors du retour en ligne */}
      {online && showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Wifi className="w-5 h-5" />
          <span className="font-medium">Connexion rétablie</span>
        </div>
      )}
    </>
  );
}
