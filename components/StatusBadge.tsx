/**
 * Badge de statut d'un appareil (StatutAppareil, section 5) — palette froide.
 */

import { StatutAppareil } from '@/domain/types';

interface StatusBadgeProps {
  statut: StatutAppareil;
  showLabel?: boolean;
}

const CONFIG: Record<StatutAppareil, { bg: string; text: string; border: string; label: string }> = {
  [StatutAppareil.EN_SERVICE]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'En service',
  },
  [StatutAppareil.EN_PANNE]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    label: 'En panne',
  },
  [StatutAppareil.A_L_ARRET]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'À l\'arrêt',
  },
  [StatutAppareil.MODE_DEGRADE]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Mode dégradé',
  },
  [StatutAppareil.ARRET_TRAVAUX]: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: 'Arrêt travaux',
  },
};

export default function StatusBadge({ statut, showLabel = true }: StatusBadgeProps) {
  const config = CONFIG[statut];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {showLabel && config.label}
    </span>
  );
}
