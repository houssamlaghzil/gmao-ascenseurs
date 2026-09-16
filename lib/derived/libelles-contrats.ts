/**
 * Libellés français pour les enums de l'écran Contrats (section 14).
 * StatutContrat a déjà son propre badge (voir components/StatusBadges.tsx,
 * StatutContratBadge) — non repris ici.
 */

import { FrequenceMaintenance, NiveauSla } from '@/domain/types';

export const LIBELLE_FREQUENCE_MAINTENANCE: Record<FrequenceMaintenance, string> = {
  [FrequenceMaintenance.MENSUELLE]: 'Mensuelle',
  [FrequenceMaintenance.BIMESTRIELLE]: 'Bimestrielle',
  [FrequenceMaintenance.TRIMESTRIELLE]: 'Trimestrielle',
  [FrequenceMaintenance.SEMESTRIELLE]: 'Semestrielle',
  [FrequenceMaintenance.ANNUELLE]: 'Annuelle',
};

export const LIBELLE_NIVEAU_SLA: Record<NiveauSla, string> = {
  [NiveauSla.STANDARD]: 'Standard',
  [NiveauSla.PREMIUM]: 'Premium',
  [NiveauSla.PRIORITAIRE]: 'Prioritaire',
  [NiveauSla.SUR_MESURE]: 'Sur mesure',
};
