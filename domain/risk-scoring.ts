/**
 * Logique de maintenance prédictive
 * Calcul du score de risque de panne à 7 jours
 *
 * Facteurs pris en compte :
 * - Nombre d'interventions récentes (30 derniers jours)
 * - Temps depuis la dernière intervention clôturée
 * - Type de parc (tertiaire vs résidentiel)
 * - Statut actuel de l'appareil, et présence d'une intervention encore ouverte
 */

import {
  Ascenseur,
  StatutAppareil,
  Intervention,
  StatutIntervention,
  ParcAscenseurs,
  TypeParc,
  RiskScore,
  RiskLevel,
} from './types';

/**
 * Calcule le nombre d'interventions ouvertes dans les N derniers jours
 * sur cet appareil (toute intervention, quel que soit son motif, est un
 * signal d'incident — distinct d'une Maintenance planifiée).
 */
function countInterventionsRecentes(
  interventions: Intervention[],
  ascenseurId: string,
  nbJours: number,
  maintenant: Date = new Date()
): number {
  const seuil = new Date(maintenant);
  seuil.setDate(seuil.getDate() - nbJours);

  return interventions.filter(
    (i) => i.ascenseurId === ascenseurId && new Date(i.dateCreation) >= seuil
  ).length;
}

/**
 * Trouve la date de clôture de la dernière intervention terminée sur cet appareil
 */
function getDerniereInterventionCloturee(
  interventions: Intervention[],
  ascenseurId: string
): Date | null {
  const cloturees = interventions
    .filter((i) => i.ascenseurId === ascenseurId && i.statut === StatutIntervention.CLOTURE && i.dateCloture)
    .sort((a, b) => new Date(b.dateCloture!).getTime() - new Date(a.dateCloture!).getTime());

  if (cloturees.length === 0) return null;
  return new Date(cloturees[0].dateCloture!);
}

/**
 * Calcule le nombre de jours depuis la dernière intervention clôturée
 */
function joursDepuisDerniereIntervention(
  interventions: Intervention[],
  ascenseurId: string,
  maintenant: Date = new Date()
): number {
  const derniere = getDerniereInterventionCloturee(interventions, ascenseurId);
  if (!derniere) return 365; // Aucune intervention clôturée = considéré comme ancien

  const diff = maintenant.getTime() - derniere.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Une intervention encore ouverte (non clôturée) sur l'appareil est en soi
 * un facteur de risque : l'appareil est activement suivi pour un incident.
 */
function aUneInterventionOuverte(interventions: Intervention[], ascenseurId: string): boolean {
  return interventions.some((i) => i.ascenseurId === ascenseurId && i.statut !== StatutIntervention.CLOTURE);
}

/**
 * Coefficient de risque selon le type de parc
 */
function coefficientTypeParc(typeParc: TypeParc): number {
  switch (typeParc) {
    case TypeParc.TERTIAIRE:
      return 1.3; // Usage intensif
    case TypeParc.COMMERCIAL:
      return 1.2; // Usage modéré
    case TypeParc.RESIDENTIEL:
      return 1.0; // Usage normal
    default:
      return 1.0;
  }
}

/**
 * Bonus de risque selon le statut actuel de l'appareil. ARRET_TRAVAUX est
 * une suspension délibérée (chantier), pas un signal de risque.
 */
function bonusStatutActuel(statut: StatutAppareil): number {
  switch (statut) {
    case StatutAppareil.EN_PANNE:
      return 20;
    case StatutAppareil.A_L_ARRET:
      return 15;
    case StatutAppareil.MODE_DEGRADE:
      return 12;
    case StatutAppareil.ARRET_TRAVAUX:
    case StatutAppareil.EN_SERVICE:
    default:
      return 0;
  }
}

/**
 * Calcule le score de risque de panne à 7 jours
 *
 * Formule :
 * - Base : nombre d'interventions dans les 30 derniers jours × 15 points
 * - Ajout : (jours depuis dernière intervention clôturée / 10) points
 * - Multiplication par coefficient du type de parc
 * - Ajout du bonus de statut actuel + bonus intervention ouverte
 * - Plafonné entre 0 et 100
 */
export function computeRiskScore(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  maintenant: Date = new Date()
): number {
  const interventionsRecentes = countInterventionsRecentes(interventions, ascenseur.id, 30, maintenant);
  const scoreInterventions = interventionsRecentes * 15;

  const joursDepuis = joursDepuisDerniereIntervention(interventions, ascenseur.id, maintenant);
  const scoreTemps = joursDepuis / 10;

  let scoreBase = scoreInterventions + scoreTemps;

  const coef = coefficientTypeParc(parc.type);
  scoreBase *= coef;

  scoreBase += bonusStatutActuel(ascenseur.statutAppareil);
  if (aUneInterventionOuverte(interventions, ascenseur.id)) {
    scoreBase += 15;
  }

  return Math.max(0, Math.min(100, Math.round(scoreBase)));
}

/**
 * Détermine le niveau de risque en fonction du score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return RiskLevel.ELEVE;
  if (score >= 40) return RiskLevel.MODERE;
  return RiskLevel.FAIBLE;
}

/**
 * Génère une explication textuelle du risque
 * Phrase déterministe basée sur les facteurs de risque
 */
export function generateRiskExplanation(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  score: number,
  maintenant: Date = new Date()
): string {
  const interventionsRecentes = countInterventionsRecentes(interventions, ascenseur.id, 30, maintenant);
  const joursDepuis = joursDepuisDerniereIntervention(interventions, ascenseur.id, maintenant);
  const level = getRiskLevel(score);

  let explication = '';

  if (level === RiskLevel.ELEVE) {
    explication = 'Risque élevé de panne. ';
  } else if (level === RiskLevel.MODERE) {
    explication = 'Risque modéré de panne. ';
  } else {
    explication = 'Risque faible de panne. ';
  }

  if (interventionsRecentes === 0) {
    explication += 'Aucune intervention récente enregistrée. ';
  } else if (interventionsRecentes === 1) {
    explication += '1 intervention enregistrée dans les 30 derniers jours. ';
  } else {
    explication += `${interventionsRecentes} interventions enregistrées dans les 30 derniers jours. `;
  }

  if (joursDepuis === 365) {
    explication += 'Aucun historique d\'intervention clôturée disponible. ';
  } else if (joursDepuis < 7) {
    explication += 'Dernière intervention clôturée très récemment (moins de 7 jours). ';
  } else if (joursDepuis < 30) {
    explication += `Dernière intervention clôturée il y a ${joursDepuis} jours. `;
  } else {
    explication += `Dernière intervention clôturée il y a plus de ${Math.floor(joursDepuis / 30)} mois. `;
  }

  if (aUneInterventionOuverte(interventions, ascenseur.id)) {
    explication += 'Une intervention est actuellement ouverte sur cet appareil. ';
  }

  if (parc.type === TypeParc.TERTIAIRE) {
    explication += 'Usage intensif (parc tertiaire).';
  } else if (parc.type === TypeParc.COMMERCIAL) {
    explication += 'Usage modéré (parc commercial).';
  } else {
    explication += 'Usage normal (parc résidentiel).';
  }

  return explication;
}

/**
 * Calcule le RiskScore complet (score + level + explication)
 */
export function computeFullRiskScore(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  maintenant: Date = new Date()
): RiskScore {
  const score = computeRiskScore(ascenseur, interventions, parc, maintenant);
  const level = getRiskLevel(score);
  const explication = generateRiskExplanation(ascenseur, interventions, parc, score, maintenant);

  return { score, level, explication };
}

/**
 * Retourne la couleur CSS pour un niveau de risque
 * Palette froide comme demandé
 */
export function getRiskColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case RiskLevel.FAIBLE:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case RiskLevel.MODERE:
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case RiskLevel.ELEVE:
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  }
}
