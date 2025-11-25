/**
 * Store en mémoire pour simuler une base de données
 * Toutes les mutations sont appliquées ici
 */

import {
  ParcAscenseurs,
  Ascenseur,
  Technicien,
  ParcTechnicienAssignment,
  EvenementHistorique,
  EtatGlobal,
  StatistiquesParc,
  RiskScore,
} from '@/domain/types';
import { computeFullRiskScore } from '@/domain/risk-scoring';
import {
  parcs as initialParcs,
  ascenseurs as initialAscenseurs,
  techniciens as initialTechniciens,
  parcTechnicienAssignments as initialAssignments,
  evenementsHistoriques as initialEvenements,
} from './mockData';

// État global en mémoire (réinitialisé à chaque redémarrage du serveur)
let parcs: ParcAscenseurs[] = [...initialParcs];
let ascenseurs: Ascenseur[] = [...initialAscenseurs];
let techniciens: Technicien[] = [...initialTechniciens];
let parcTechnicienAssignments: ParcTechnicienAssignment[] = [...initialAssignments];
let evenementsHistoriques: EvenementHistorique[] = [...initialEvenements];

/**
 * Récupère tous les parcs
 */
export function getAllParcs(): ParcAscenseurs[] {
  return [...parcs];
}

/**
 * Récupère un parc par son ID
 */
export function getParcById(id: string): ParcAscenseurs | undefined {
  return parcs.find((p) => p.id === id);
}

/**
 * Récupère tous les ascenseurs
 */
export function getAllAscenseurs(): Ascenseur[] {
  return [...ascenseurs];
}

/**
 * Récupère un ascenseur par son ID
 */
export function getAscenseurById(id: string): Ascenseur | undefined {
  return ascenseurs.find((a) => a.id === id);
}

/**
 * Récupère les ascenseurs d'un parc spécifique
 */
export function getAscenseursByParcId(parcId: string): Ascenseur[] {
  return ascenseurs.filter((a) => a.parcId === parcId);
}

/**
 * Met à jour un ascenseur
 */
export function updateAscenseur(ascenseur: Ascenseur): void {
  const index = ascenseurs.findIndex((a) => a.id === ascenseur.id);
  if (index !== -1) {
    ascenseurs[index] = ascenseur;
  }
}

/**
 * Récupère tous les techniciens
 */
export function getAllTechniciens(): Technicien[] {
  return [...techniciens];
}

/**
 * Récupère un technicien par son ID
 */
export function getTechnicienById(id: string): Technicien | undefined {
  return techniciens.find((t) => t.id === id);
}

/**
 * Récupère les techniciens associés à un parc
 */
export function getTechniciensByParcId(parcId: string): Technicien[] {
  const technicienIds = parcTechnicienAssignments
    .filter((a) => a.parcId === parcId)
    .map((a) => a.technicienId);
  return techniciens.filter((t) => technicienIds.includes(t.id));
}

/**
 * Récupère tous les événements historiques
 */
export function getAllEvenements(): EvenementHistorique[] {
  return [...evenementsHistoriques].sort(
    (a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()
  );
}

/**
 * Récupère l'historique d'un ascenseur spécifique
 */
export function getEvenementsByAscenseurId(ascenseurId: string): EvenementHistorique[] {
  return evenementsHistoriques
    .filter((e) => e.ascenseurId === ascenseurId)
    .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
}

/**
 * Ajoute un événement à l'historique
 */
export function addEvenement(evenement: EvenementHistorique): void {
  evenementsHistoriques.push(evenement);
}

/**
 * Ajoute plusieurs événements à l'historique
 */
export function addEvenements(nouveauxEvenements: EvenementHistorique[]): void {
  evenementsHistoriques.push(...nouveauxEvenements);
}

/**
 * Calcule les statistiques d'un parc
 */
export function getStatistiquesParc(parcId: string): StatistiquesParc {
  const ascenseursParc = getAscenseursByParcId(parcId);
  
  return {
    parcId,
    totalAscenseurs: ascenseursParc.length,
    nombreFonctionnels: ascenseursParc.filter(
      (a) => a.etatGlobal === EtatGlobal.FONCTIONNEL
    ).length,
    nombreEnPanne: ascenseursParc.filter(
      (a) => a.etatGlobal === EtatGlobal.EN_PANNE
    ).length,
    nombreEnReparation: ascenseursParc.filter(
      (a) => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION
    ).length,
  };
}

/**
 * Calcule les statistiques de tous les parcs
 */
export function getAllStatistiques(): StatistiquesParc[] {
  return parcs.map((parc) => getStatistiquesParc(parc.id));
}

/**
 * Compte le nombre d'ascenseurs en réparation assignés à un technicien
 */
export function countAscenseursEnReparationByTechnicien(technicienId: string): number {
  return ascenseurs.filter(
    (a) =>
      a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION &&
      a.technicienAttribueId === technicienId
  ).length;
}

/**
 * Calcule le score de risque pour un ascenseur
 */
export function getRiskScoreForAscenseur(ascenseurId: string): RiskScore | null {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return null;
  
  const parc = getParcById(ascenseur.parcId);
  if (!parc) return null;
  
  return computeFullRiskScore(ascenseur, evenementsHistoriques, parc);
}

/**
 * Récupère tous les ascenseurs avec leur score de risque
 */
export function getAllAscenseursWithRisk(): Array<Ascenseur & { riskScore: RiskScore }> {
  return ascenseurs.map((asc) => {
    const parc = getParcById(asc.parcId);
    const riskScore = parc 
      ? computeFullRiskScore(asc, evenementsHistoriques, parc)
      : { score: 0, level: 'faible' as any, explication: 'Parc introuvable' };
    
    return {
      ...asc,
      riskScore,
    };
  });
}

/**
 * Récupère les ascenseurs à risque élevé (triés par score décroissant)
 */
export function getHighRiskAscenseurs(limit: number = 10): Array<Ascenseur & { riskScore: RiskScore }> {
  return getAllAscenseursWithRisk()
    .filter((a) => a.riskScore.score >= 40) // Modéré ou élevé
    .sort((a, b) => b.riskScore.score - a.riskScore.score)
    .slice(0, limit);
}

/**
 * Récupère les N derniers événements (pour les notifications)
 */
export function getRecentEvenements(limit: number = 10): EvenementHistorique[] {
  return [...evenementsHistoriques]
    .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())
    .slice(0, limit);
}

/**
 * Ajoute un nouveau parc
 */
export function addParc(parc: ParcAscenseurs): void {
  parcs.push(parc);
}

/**
 * Met à jour un parc
 */
export function updateParc(parc: ParcAscenseurs): void {
  const index = parcs.findIndex((p) => p.id === parc.id);
  if (index !== -1) {
    parcs[index] = parc;
  }
}

/**
 * Supprime un parc
 */
export function deleteParc(id: string): void {
  parcs = parcs.filter((p) => p.id !== id);
  // Supprimer aussi les ascenseurs du parc
  ascenseurs = ascenseurs.filter((a) => a.parcId !== id);
  // Supprimer les assignations de techniciens
  parcTechnicienAssignments = parcTechnicienAssignments.filter((a) => a.parcId !== id);
}

/**
 * Ajoute un nouvel ascenseur
 */
export function addAscenseur(ascenseur: Ascenseur): void {
  ascenseurs.push(ascenseur);
}

/**
 * Supprime un ascenseur
 */
export function deleteAscenseur(id: string): void {
  ascenseurs = ascenseurs.filter((a) => a.id !== id);
  // Supprimer aussi l'historique
  evenementsHistoriques = evenementsHistoriques.filter((e) => e.ascenseurId !== id);
}

/**
 * Change le parc d'un ascenseur (pour le drag & drop)
 */
export function moveAscenseurToParc(ascenseurId: string, newParcId: string): void {
  const ascenseur = ascenseurs.find((a) => a.id === ascenseurId);
  if (ascenseur) {
    ascenseur.parcId = newParcId;
  }
}
