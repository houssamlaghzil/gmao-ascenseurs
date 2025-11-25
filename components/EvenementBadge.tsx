/**
 * Badge pour afficher le type d'événement
 */

import { TypeEvenement } from '@/domain/types';

interface EvenementBadgeProps {
  type: TypeEvenement;
}

export default function EvenementBadge({ type }: EvenementBadgeProps) {
  const getConfig = () => {
    switch (type) {
      case TypeEvenement.PANNE_DECLAREE:
        return {
          label: 'Panne déclarée',
          colorClass: 'bg-red-50 text-red-700 border-red-200',
        };
      case TypeEvenement.PANNE_ATTRIBUEE:
        return {
          label: 'Panne attribuée',
          colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case TypeEvenement.DEBUT_REPARATION:
        return {
          label: 'Début réparation',
          colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        };
      case TypeEvenement.FIN_REPARATION:
        return {
          label: 'Fin réparation',
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case TypeEvenement.RETOUR_FONCTIONNEL:
        return {
          label: 'Retour en service',
          colorClass: 'bg-green-50 text-green-700 border-green-200',
        };
      case TypeEvenement.COMMENTAIRE:
        return {
          label: 'Commentaire',
          colorClass: 'bg-gray-50 text-gray-700 border-gray-200',
        };
      default:
        return {
          label: type,
          colorClass: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  const { label, colorClass } = getConfig();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}
    >
      {label}
    </span>
  );
}
