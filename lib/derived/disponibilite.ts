/**
 * Calcul de la disponibilité indicative d'un appareil (section 4.1/4.2).
 *
 * Volontairement simple : un pourcentage indicatif, pas un vrai calcul de
 * MTBF/MTTR. Base 100 % pour un appareil EN_SERVICE sans historique récent,
 * dégradé selon son statut courant et le nombre d'interventions ouvertes
 * dans les 30 derniers jours. Jamais stocké — recalculé à la lecture.
 */

import { Ascenseur, Intervention, StatutAppareil } from '@/domain/types';
import { getDateDemo } from '@/data/store';

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Pénalité indicative selon le statut courant de l'appareil. */
const IMPACT_STATUT_COURANT: Record<StatutAppareil, number> = {
  [StatutAppareil.EN_SERVICE]: 0,
  [StatutAppareil.MODE_DEGRADE]: 6,
  [StatutAppareil.A_L_ARRET]: 12,
  [StatutAppareil.EN_PANNE]: 18,
  [StatutAppareil.ARRET_TRAVAUX]: 25,
};

/** Points retirés par intervention récente, plafonnés pour rester lisible. */
const PENALITE_PAR_INTERVENTION_RECENTE = 2;
const PENALITE_INTERVENTIONS_MAX = 15;

const PLANCHER_AFFICHAGE = 60;

export function calculerDisponibilitePourcent(
  ascenseur: Ascenseur,
  interventionsAppareil: Intervention[],
  maintenant: Date = getDateDemo()
): number {
  const seuilRecence = new Date(maintenant.getTime() - 30 * JOUR_MS);
  const nombreInterventionsRecentes = interventionsAppareil.filter(
    (intervention) => new Date(intervention.dateCreation) >= seuilRecence
  ).length;

  const impactStatut = IMPACT_STATUT_COURANT[ascenseur.statutAppareil];
  const impactHistorique = Math.min(
    PENALITE_INTERVENTIONS_MAX,
    nombreInterventionsRecentes * PENALITE_PAR_INTERVENTION_RECENTE
  );

  const pourcentage = 100 - impactStatut - impactHistorique;
  return Math.max(PLANCHER_AFFICHAGE, Math.min(100, Math.round(pourcentage)));
}

/** Classe de couleur Tailwind associée au niveau de disponibilité, pour un affichage cohérent. */
export function classeCouleurDisponibilite(pourcentage: number): string {
  if (pourcentage >= 95) return 'text-emerald-600';
  if (pourcentage >= 85) return 'text-amber-600';
  return 'text-rose-600';
}
