/**
 * Libellés français pour les enums propres aux écrans Planning (section 11)
 * et Techniciens (section 12) sans équivalent déjà exposé ailleurs.
 * StatutAbsence et TypeAbsence ont chacun leur propre badge (voir
 * components/StatusBadges.tsx) ; les libellés ci-dessous reprennent le même
 * texte pour la composition de chaînes (TachePlanning.libelle/
 * statutAffichage, qui sont de simples `string`, pas du JSX).
 * StatutMaintenance a son propre badge (StatutMaintenanceBadge) mais pas de
 * libellé texte exporté ailleurs — ajouté ici pour la même raison.
 */

import { StatutAbsence, StatutMaintenance, TypeAbsence } from '@/domain/types';

export const LIBELLE_TYPE_ABSENCE: Record<TypeAbsence, string> = {
  [TypeAbsence.CONGE]: 'Congé',
  [TypeAbsence.MALADIE]: 'Maladie',
  [TypeAbsence.FORMATION]: 'Formation',
  [TypeAbsence.AUTRE]: 'Autre absence',
};

export const LIBELLE_STATUT_ABSENCE: Record<StatutAbsence, string> = {
  [StatutAbsence.PLANIFIEE]: 'Planifiée',
  [StatutAbsence.EN_COURS]: 'En cours',
  [StatutAbsence.TERMINEE]: 'Terminée',
};

export const LIBELLE_STATUT_MAINTENANCE: Record<StatutMaintenance, string> = {
  [StatutMaintenance.PLANIFIEE]: 'Planifiée',
  [StatutMaintenance.EN_COURS_DE_REALISATION]: 'En cours',
  [StatutMaintenance.REALISEE]: 'Réalisée',
  [StatutMaintenance.ANNULEE]: 'Annulée',
};
