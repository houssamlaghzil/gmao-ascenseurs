/**
 * Badge pour afficher le statut d'un ascenseur avec des couleurs appropriées
 */

import { EtatGlobal, SousEtatPanne } from '@/domain/types';

interface StatusBadgeProps {
  etatGlobal: EtatGlobal;
  sousEtatPanne?: SousEtatPanne;
}

export default function StatusBadge({ etatGlobal, sousEtatPanne }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (etatGlobal) {
      case EtatGlobal.FONCTIONNEL:
        return {
          label: 'Fonctionnel',
          colorClass: 'bg-green-100 text-green-800 border-green-200',
        };
      case EtatGlobal.EN_PANNE:
        if (sousEtatPanne === SousEtatPanne.EN_COURS_D_ATTRIBUTION) {
          return {
            label: 'En panne - Non attribué',
            colorClass: 'bg-red-100 text-red-800 border-red-200',
          };
        } else if (sousEtatPanne === SousEtatPanne.ATTRIBUE) {
          return {
            label: 'En panne - Attribué',
            colorClass: 'bg-orange-100 text-orange-800 border-orange-200',
          };
        }
        return {
          label: 'En panne',
          colorClass: 'bg-red-100 text-red-800 border-red-200',
        };
      case EtatGlobal.EN_COURS_DE_REPARATION:
        return {
          label: 'En cours de réparation',
          colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      default:
        return {
          label: 'Inconnu',
          colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const { label, colorClass } = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}
      title={label}
    >
      {label}
    </span>
  );
}
