/**
 * Badge de statut d'une intervention (StatutIntervention, section 7.2).
 */

import { StatutIntervention } from '@/domain/types';

interface StatutInterventionBadgeProps {
  statut: StatutIntervention;
}

const CONFIG: Record<StatutIntervention, { bg: string; text: string; border: string; label: string }> = {
  [StatutIntervention.NOUVEAU]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Nouveau' },
  [StatutIntervention.A_AFFECTER]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'À affecter' },
  [StatutIntervention.AFFECTE]: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Affecté' },
  [StatutIntervention.PRIS_EN_CHARGE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pris en charge' },
  [StatutIntervention.EN_COURS]: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'En cours' },
  [StatutIntervention.EN_ATTENTE_DE_PIECE]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'En attente de pièce' },
  [StatutIntervention.A_REPRENDRE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'À reprendre' },
  [StatutIntervention.TERMINE]: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Terminé' },
  [StatutIntervention.A_VALIDER]: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'À valider' },
  [StatutIntervention.CLOTURE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Clôturé' },
};

export default function StatutInterventionBadge({ statut }: StatutInterventionBadgeProps) {
  const config = CONFIG[statut];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}
