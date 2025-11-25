/**
 * Badge de statut pour les ascenseurs
 * Palette froide selon les specs UX
 */

import { EtatGlobal, SousEtatPanne } from '@/domain/types';

interface StatusBadgeProps {
  etatGlobal: EtatGlobal;
  sousEtatPanne?: SousEtatPanne;
  showLabel?: boolean;
}

export default function StatusBadge({
  etatGlobal,
  sousEtatPanne,
  showLabel = true,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (etatGlobal) {
      case EtatGlobal.FONCTIONNEL:
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          label: 'Fonctionnel',
        };
      case EtatGlobal.EN_PANNE:
        if (sousEtatPanne === SousEtatPanne.EN_COURS_D_ATTRIBUTION) {
          return {
            bg: 'bg-rose-50',
            text: 'text-rose-700',
            border: 'border-rose-200',
            label: 'Panne - En attente',
          };
        } else if (sousEtatPanne === SousEtatPanne.ATTRIBUE) {
          return {
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            border: 'border-orange-200',
            label: 'Panne - Attribuée',
          };
        }
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          label: 'En panne',
        };
      case EtatGlobal.EN_COURS_DE_REPARATION:
        return {
          bg: 'bg-cyan-50',
          text: 'text-cyan-700',
          border: 'border-cyan-200',
          label: 'En réparation',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          label: 'Inconnu',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {showLabel && config.label}
    </span>
  );
}
