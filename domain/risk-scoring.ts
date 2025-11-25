/**
 * Logique de maintenance prédictive
 * Calcul du score de risque de panne à 7 jours
 * 
 * Facteurs pris en compte :
 * - Nombre de pannes récentes (30 derniers jours)
 * - Temps depuis la dernière réparation
 * - Type de parc (tertiaire vs résidentiel)
 * - État actuel de l'ascenseur
 */

import {
  Ascenseur,
  EtatGlobal,
  EvenementHistorique,
  TypeEvenement,
  ParcAscenseurs,
  TypeParc,
  RiskScore,
  RiskLevel,
} from './types';

/**
 * Calcule le nombre de pannes dans les N derniers jours
 */
function countPannesRecentes(
  historique: EvenementHistorique[],
  ascenseurId: string,
  nbJours: number
): number {
  const seuil = new Date();
  seuil.setDate(seuil.getDate() - nbJours);

  return historique.filter(
    (evt) =>
      evt.ascenseurId === ascenseurId &&
      evt.typeEvenement === TypeEvenement.PANNE_DECLAREE &&
      new Date(evt.dateHeure) >= seuil
  ).length;
}

/**
 * Trouve la date de la dernière réparation terminée
 */
function getDerniereReparation(
  historique: EvenementHistorique[],
  ascenseurId: string
): Date | null {
  const reparations = historique
    .filter(
      (evt) =>
        evt.ascenseurId === ascenseurId &&
        evt.typeEvenement === TypeEvenement.FIN_REPARATION
    )
    .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());

  if (reparations.length === 0) return null;
  return new Date(reparations[0].dateHeure);
}

/**
 * Calcule le nombre de jours depuis la dernière réparation
 */
function joursDepuisDerniereReparation(
  historique: EvenementHistorique[],
  ascenseurId: string
): number {
  const derniereReparation = getDerniereReparation(historique, ascenseurId);
  if (!derniereReparation) return 365; // Aucune réparation = considéré comme ancien

  const maintenant = new Date();
  const diff = maintenant.getTime() - derniereReparation.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
 * Bonus de risque si l'ascenseur est actuellement en panne ou en réparation
 */
function bonusEtatActuel(etat: EtatGlobal): number {
  switch (etat) {
    case EtatGlobal.EN_PANNE:
      return 20;
    case EtatGlobal.EN_COURS_DE_REPARATION:
      return 15;
    case EtatGlobal.FONCTIONNEL:
      return 0;
    default:
      return 0;
  }
}

/**
 * Calcule le score de risque de panne à 7 jours
 * 
 * Formule :
 * - Base : nombre de pannes dans les 30 derniers jours × 15 points
 * - Ajout : (jours depuis dernière réparation / 10) points
 * - Multiplication par coefficient du type de parc
 * - Ajout du bonus d'état actuel
 * - Plafonné entre 0 et 100
 * 
 * @param ascenseur L'ascenseur à évaluer
 * @param historique L'historique complet des événements
 * @param parc Le parc auquel appartient l'ascenseur
 * @returns Score entre 0 et 100
 */
export function computeRiskScore(
  ascenseur: Ascenseur,
  historique: EvenementHistorique[],
  parc: ParcAscenseurs
): number {
  // Nombre de pannes récentes (poids fort)
  const pannesRecentes = countPannesRecentes(historique, ascenseur.id, 30);
  const scorePannes = pannesRecentes * 15;

  // Temps depuis dernière réparation (poids moyen)
  const joursDepuis = joursDepuisDerniereReparation(historique, ascenseur.id);
  const scoreTemps = joursDepuis / 10;

  // Score de base
  let scoreBase = scorePannes + scoreTemps;

  // Application du coefficient de type de parc
  const coef = coefficientTypeParc(parc.type);
  scoreBase *= coef;

  // Ajout du bonus d'état actuel
  scoreBase += bonusEtatActuel(ascenseur.etatGlobal);

  // Plafonnement entre 0 et 100
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
  historique: EvenementHistorique[],
  parc: ParcAscenseurs,
  score: number
): string {
  const pannesRecentes = countPannesRecentes(historique, ascenseur.id, 30);
  const joursDepuis = joursDepuisDerniereReparation(historique, ascenseur.id);
  const level = getRiskLevel(score);

  // Construction de l'explication
  let explication = '';

  if (level === RiskLevel.ELEVE) {
    explication = 'Risque élevé de panne. ';
  } else if (level === RiskLevel.MODERE) {
    explication = 'Risque modéré de panne. ';
  } else {
    explication = 'Risque faible de panne. ';
  }

  // Détails sur les pannes récentes
  if (pannesRecentes === 0) {
    explication += 'Aucune panne récente enregistrée. ';
  } else if (pannesRecentes === 1) {
    explication += '1 panne enregistrée dans les 30 derniers jours. ';
  } else {
    explication += `${pannesRecentes} pannes enregistrées dans les 30 derniers jours. `;
  }

  // Détails sur la dernière réparation
  if (joursDepuis === 365) {
    explication += 'Aucun historique de réparation disponible. ';
  } else if (joursDepuis < 7) {
    explication += 'Réparation très récente (moins de 7 jours). ';
  } else if (joursDepuis < 30) {
    explication += `Dernière réparation il y a ${joursDepuis} jours. `;
  } else {
    explication += `Dernière réparation il y a plus de ${Math.floor(joursDepuis / 30)} mois. `;
  }

  // Impact du type de parc
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
 * 
 * @param ascenseur L'ascenseur à évaluer
 * @param historique L'historique complet des événements
 * @param parc Le parc auquel appartient l'ascenseur
 * @returns Objet RiskScore complet
 */
export function computeFullRiskScore(
  ascenseur: Ascenseur,
  historique: EvenementHistorique[],
  parc: ParcAscenseurs
): RiskScore {
  const score = computeRiskScore(ascenseur, historique, parc);
  const level = getRiskLevel(score);
  const explication = generateRiskExplanation(ascenseur, historique, parc, score);

  return {
    score,
    level,
    explication,
  };
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
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case RiskLevel.MODERE:
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case RiskLevel.ELEVE:
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
      };
  }
}
