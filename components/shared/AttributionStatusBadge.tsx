import React from 'react';

interface AttributionStatusBadgeProps {
  requis: number;
  attribues: number;
  size?: 'sm' | 'md';
}

export function AttributionStatusBadge({ requis, attribues, size = 'md' }: AttributionStatusBadgeProps) {
  const getStatus = () => {
    if (requis === 0) return { color: 'bg-gray-400', label: 'Non défini', tooltip: 'Aucun surveillant requis défini' };
    if (attribues === 0) return { color: 'bg-red-500', label: 'Non attribué', tooltip: `0/${requis} surveillants attribués` };
    if (attribues >= requis) return { color: 'bg-green-500', label: 'Complet', tooltip: `${attribues}/${requis} surveillants attribués` };
    return { color: 'bg-orange-500', label: 'Partiel', tooltip: `${attribues}/${requis} surveillants attribués` };
  };

  const status = getStatus();
  const sizeClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <div className="flex items-center gap-1.5" title={status.tooltip}>
      <div className={`${sizeClass} rounded-full ${status.color} flex-shrink-0`} />
      {size === 'md' && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {attribues}/{requis}
        </span>
      )}
    </div>
  );
}
