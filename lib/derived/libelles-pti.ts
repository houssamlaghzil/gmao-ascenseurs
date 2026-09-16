/**
 * Libellés français pour le module PTI/DATI mobile (section 38). Aucun
 * autre écran (web ou mobile) ne consomme ces enums à ce jour — introduits
 * par ce module.
 */

import { EtatProtectionPTI, ModePTI } from '@/domain/types';

export const LIBELLE_ETAT_PROTECTION_PTI: Record<EtatProtectionPTI, string> = {
  [EtatProtectionPTI.PROTECTION_ACTIVE]: 'Protection active',
  [EtatProtectionPTI.PRE_ALERTE]: 'Pré-alerte',
  [EtatProtectionPTI.SOS_DECLENCHE]: 'SOS déclenché',
  [EtatProtectionPTI.INHIBEE_TEMPORAIREMENT]: 'Protection inhibée temporairement',
  [EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS]: 'Réactivation en compte à rebours',
};

export const LIBELLE_MODE_PTI: Record<ModePTI, string> = {
  [ModePTI.INTEGRATION_SERVICE_TIERS]: 'Service tiers',
  [ModePTI.MODULE_INTERNE]: 'Module interne',
};
