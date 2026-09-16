/**
 * Libellés français pour les enums de l'écran Intégrations (section 15).
 * StatutConnexionIntegration a déjà son propre badge (voir
 * components/StatusBadges.tsx, StatutConnexionIntegrationBadge) — non repris
 * ici.
 */

import { DirectionEchange, SystemeExterne } from '@/domain/types';

export const LIBELLE_SYSTEME_EXTERNE: Record<SystemeExterne, string> = {
  [SystemeExterne.SERENITE]: 'Sérénité',
  [SystemeExterne.GETRALINE]: 'Getraline',
  [SystemeExterne.INTENT]: 'Intent',
  [SystemeExterne.CITRON]: 'Citron',
  [SystemeExterne.H2]: 'H2',
  [SystemeExterne.SAP]: 'SAP',
};

export const LIBELLE_DIRECTION_ECHANGE: Record<DirectionEchange, string> = {
  [DirectionEchange.ENTRANT]: 'Entrant',
  [DirectionEchange.SORTANT]: 'Sortant',
};
