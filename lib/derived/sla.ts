/**
 * Calcul dérivé de l'état SLA d'une intervention (section 7.4) — implémente
 * la règle documentée par le type gelé EtatSLACalcule (domain/types.ts) :
 *   - `accesRefuse` ou pas de délai contractuel défini → NON_APPLICABLE (il
 *     n'y a rien à respecter, on ne peut pas juger un délai sur un accès
 *     refusé) ;
 *   - `dateArriveeSite` connue → comparaison FIGÉE à cet instant : le sort
 *     est scellé, il n'y a plus d'état "bientôt dépassé" possible ;
 *   - sinon → compte à rebours en direct par rapport à `maintenant`.
 *
 * Fichier neuf sous lib/derived/ : domain/business-logic.ts et
 * domain/risk-scoring.ts restent inchangés. Réutilisé par l'écran
 * Interventions (sections 7 et 8) et par le Tableau de bord (KPI "hors SLA",
 * taux de respect global, urgences "SLA bientôt dépassé").
 */

import { EtatSLA, EtatSLACalcule, Intervention } from '@/domain/types';

/** Seuil d'alerte "bientôt dépassé" : 15 minutes ou 15 % du délai contractuel, le plus grand des deux. */
function seuilAlerteMinutes(intervention: Intervention): number {
  return Math.max(15, intervention.delaiContractuelMinutes * 0.15);
}

/**
 * État SLA calculé d'une intervention, à l'instant `maintenant` (par défaut
 * l'heure courante). Ne modifie jamais l'intervention — calcul de lecture,
 * jamais stocké (voir EtatSLACalcule).
 */
export function calculerEtatSLA(intervention: Intervention, maintenant: Date = new Date()): EtatSLACalcule {
  const base = {
    interventionId: intervention.id,
    delaiContractuelMinutes: intervention.delaiContractuelMinutes,
    dateLimite: intervention.dateLimiteSLA,
  };

  if (intervention.accesRefuse || !intervention.delaiContractuelMinutes) {
    return { ...base, tempsRestantMinutes: 0, depassementMinutes: 0, pourcentageConsomme: 0, etat: EtatSLA.NON_APPLICABLE };
  }

  const dateLimiteMs = new Date(intervention.dateLimiteSLA).getTime();
  const dateDebutMs = new Date(intervention.dateDebutDecompteSLA).getTime();
  // Comparaison figée à l'arrivée sur site si elle a eu lieu, sinon compte à rebours en direct.
  const referenceMs = intervention.dateArriveeSite ? new Date(intervention.dateArriveeSite).getTime() : maintenant.getTime();

  const tempsRestantMinutes = (dateLimiteMs - referenceMs) / 60_000;
  const depassementMinutes = Math.max(0, -tempsRestantMinutes);
  const pourcentageConsomme = Math.round(((referenceMs - dateDebutMs) / (intervention.delaiContractuelMinutes * 60_000)) * 100);

  let etat: EtatSLA;
  if (intervention.dateArriveeSite) {
    // Le sort est scellé : jamais "bientôt dépassé" une fois l'arrivée constatée.
    etat = tempsRestantMinutes < 0 ? EtatSLA.DEPASSE : EtatSLA.DANS_LES_DELAIS;
  } else if (tempsRestantMinutes < 0) {
    etat = EtatSLA.DEPASSE;
  } else if (tempsRestantMinutes <= seuilAlerteMinutes(intervention)) {
    etat = EtatSLA.BIENTOT_DEPASSE;
  } else {
    etat = EtatSLA.DANS_LES_DELAIS;
  }

  return {
    ...base,
    tempsRestantMinutes: Math.round(tempsRestantMinutes),
    depassementMinutes: Math.round(depassementMinutes),
    pourcentageConsomme,
    etat,
  };
}

/**
 * Prédicat simple utilisé par le KPI dashboard "interventions hors SLA" :
 * état DEPASSE au sens de `calculerEtatSLA` (donc jamais vrai pour un accès
 * refusé ou une intervention sans délai, NON_APPLICABLE par définition).
 */
export function estInterventionHorsSLA(intervention: Intervention, maintenant: Date = new Date()): boolean {
  return calculerEtatSLA(intervention, maintenant).etat === EtatSLA.DEPASSE;
}

/** Taux de respect du SLA (0-100) sur un ensemble d'interventions donné. */
export function calculerTauxRespectSLA(interventions: Intervention[], maintenant: Date = new Date()): number {
  if (interventions.length === 0) return 100;
  const respectees = interventions.filter((i) => calculerEtatSLA(i, maintenant).etat !== EtatSLA.DEPASSE).length;
  return Math.round((respectees / interventions.length) * 100);
}
