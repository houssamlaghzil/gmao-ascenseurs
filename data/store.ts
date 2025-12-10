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
  TypeEvenement,
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

// ========== FONCTIONS D'AGRÉGATION ANALYTICS ==========

/**
 * Interface pour les données analytics complètes
 */
export interface AnalyticsData {
  // KPIs globaux
  totalAscenseurs: number;
  totalParcs: number;
  totalTechniciens: number;
  tauxDisponibilite: number; // % fonctionnels
  mttr: number; // Mean Time To Repair (heures)
  pannesParSemaine: number;
  pannesMois: number;
  reparationsEnCours: number;
  
  // Par parc
  parcsStats: Array<{
    parcId: string;
    nom: string;
    ville: string;
    type: string;
    total: number;
    fonctionnels: number;
    enPanne: number;
    enReparation: number;
    riskScoreMoyen: number;
    tendance7j: number[]; // événements par jour sur 7 jours
  }>;
  
  // Par technicien
  techniciensPerf: Array<{
    id: string;
    nom: string;
    specialite: string;
    disponible: boolean;
    interventions30j: number;
    interventionsEnCours: number;
    tempsReparationMoyen: number; // heures
  }>;
  
  // Heatmap activité (90 jours)
  activiteParJour: Array<{
    date: string;
    count: number;
    pannes: number;
    reparations: number;
  }>;
  
  // Répartition par type de parc
  repartitionTypeParc: {
    commercial: { total: number; fonctionnels: number };
    residentiel: { total: number; fonctionnels: number };
    tertiaire: { total: number; fonctionnels: number };
  };
  
  // Top pannes (types les plus fréquents)
  topPannes: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * Calcule le MTTR (Mean Time To Repair) en heures
 * Basé sur les cycles complets panne -> réparation terminée
 */
function calculateMTTR(): number {
  const JOUR_MS = 24 * 60 * 60 * 1000;
  const seuil30j = new Date(Date.now() - 30 * JOUR_MS);
  
  // Trouver les cycles complets (PANNE_DECLAREE -> FIN_REPARATION)
  const pannesDeclarees = evenementsHistoriques.filter(
    (e) => e.typeEvenement === TypeEvenement.PANNE_DECLAREE && new Date(e.dateHeure) >= seuil30j
  );
  
  let totalHeures = 0;
  let cyclesComplets = 0;
  
  for (const panne of pannesDeclarees) {
    const finReparation = evenementsHistoriques.find(
      (e) =>
        e.ascenseurId === panne.ascenseurId &&
        e.typeEvenement === TypeEvenement.FIN_REPARATION &&
        new Date(e.dateHeure) > new Date(panne.dateHeure)
    );
    
    if (finReparation) {
      const duree = new Date(finReparation.dateHeure).getTime() - new Date(panne.dateHeure).getTime();
      totalHeures += duree / (1000 * 60 * 60);
      cyclesComplets++;
    }
  }
  
  return cyclesComplets > 0 ? Math.round(totalHeures / cyclesComplets) : 0;
}

/**
 * Compte les pannes sur une période donnée
 */
function countPannesPeriode(jours: number): number {
  const JOUR_MS = 24 * 60 * 60 * 1000;
  const seuil = new Date(Date.now() - jours * JOUR_MS);
  
  return evenementsHistoriques.filter(
    (e) => e.typeEvenement === TypeEvenement.PANNE_DECLAREE && new Date(e.dateHeure) >= seuil
  ).length;
}

/**
 * Calcule la tendance sur 7 jours pour un parc (événements par jour)
 */
function getTendance7j(parcId: string): number[] {
  const JOUR_MS = 24 * 60 * 60 * 1000;
  const ascenseurIds = ascenseurs.filter((a) => a.parcId === parcId).map((a) => a.id);
  const tendance: number[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const jourDebut = new Date(Date.now() - (i + 1) * JOUR_MS);
    const jourFin = new Date(Date.now() - i * JOUR_MS);
    
    const count = evenementsHistoriques.filter((e) => {
      const date = new Date(e.dateHeure);
      return ascenseurIds.includes(e.ascenseurId) && date >= jourDebut && date < jourFin;
    }).length;
    
    tendance.push(count);
  }
  
  return tendance;
}

/**
 * Calcule les interventions d'un technicien sur 30 jours
 */
function getInterventionsTechnicien(technicienId: string): { count: number; tempsMoyen: number } {
  const JOUR_MS = 24 * 60 * 60 * 1000;
  const seuil30j = new Date(Date.now() - 30 * JOUR_MS);
  
  const interventions = evenementsHistoriques.filter(
    (e) =>
      e.technicienId === technicienId &&
      e.typeEvenement === TypeEvenement.FIN_REPARATION &&
      new Date(e.dateHeure) >= seuil30j
  );
  
  let totalHeures = 0;
  
  for (const fin of interventions) {
    const debut = evenementsHistoriques.find(
      (e) =>
        e.ascenseurId === fin.ascenseurId &&
        e.technicienId === technicienId &&
        e.typeEvenement === TypeEvenement.DEBUT_REPARATION &&
        new Date(e.dateHeure) < new Date(fin.dateHeure)
    );
    
    if (debut) {
      const duree = new Date(fin.dateHeure).getTime() - new Date(debut.dateHeure).getTime();
      totalHeures += duree / (1000 * 60 * 60);
    }
  }
  
  return {
    count: interventions.length,
    tempsMoyen: interventions.length > 0 ? Math.round(totalHeures / interventions.length) : 0,
  };
}

/**
 * Génère la heatmap d'activité sur 90 jours
 */
function getActiviteHeatmap(): AnalyticsData['activiteParJour'] {
  const JOUR_MS = 24 * 60 * 60 * 1000;
  const result: AnalyticsData['activiteParJour'] = [];
  
  for (let i = 89; i >= 0; i--) {
    const jourDebut = new Date(Date.now() - (i + 1) * JOUR_MS);
    const jourFin = new Date(Date.now() - i * JOUR_MS);
    const dateStr = jourDebut.toISOString().split('T')[0];
    
    const eventsJour = evenementsHistoriques.filter((e) => {
      const date = new Date(e.dateHeure);
      return date >= jourDebut && date < jourFin;
    });
    
    result.push({
      date: dateStr,
      count: eventsJour.length,
      pannes: eventsJour.filter((e) => e.typeEvenement === TypeEvenement.PANNE_DECLAREE).length,
      reparations: eventsJour.filter((e) => e.typeEvenement === TypeEvenement.FIN_REPARATION).length,
    });
  }
  
  return result;
}

/**
 * Récupère toutes les données analytics agrégées
 */
export function getAnalyticsData(): AnalyticsData {
  const allAscenseurs = getAllAscenseurs();
  const allParcs = getAllParcs();
  const allTechniciens = getAllTechniciens();
  
  // KPIs globaux
  const fonctionnels = allAscenseurs.filter((a) => a.etatGlobal === EtatGlobal.FONCTIONNEL).length;
  const enPanne = allAscenseurs.filter((a) => a.etatGlobal === EtatGlobal.EN_PANNE).length;
  const enReparation = allAscenseurs.filter((a) => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION).length;
  
  // Stats par parc
  const parcsStats = allParcs.map((parc) => {
    const ascenseursParc = allAscenseurs.filter((a) => a.parcId === parc.id);
    const ascenseursWithRisk = ascenseursParc.map((asc) => {
      const riskScore = getRiskScoreForAscenseur(asc.id);
      return riskScore?.score || 0;
    });
    
    return {
      parcId: parc.id,
      nom: parc.nom,
      ville: parc.ville,
      type: parc.type,
      total: ascenseursParc.length,
      fonctionnels: ascenseursParc.filter((a) => a.etatGlobal === EtatGlobal.FONCTIONNEL).length,
      enPanne: ascenseursParc.filter((a) => a.etatGlobal === EtatGlobal.EN_PANNE).length,
      enReparation: ascenseursParc.filter((a) => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION).length,
      riskScoreMoyen: ascenseursWithRisk.length > 0
        ? Math.round(ascenseursWithRisk.reduce((a, b) => a + b, 0) / ascenseursWithRisk.length)
        : 0,
      tendance7j: getTendance7j(parc.id),
    };
  });
  
  // Stats par technicien
  const techniciensPerf = allTechniciens.map((tech) => {
    const interventions = getInterventionsTechnicien(tech.id);
    const enCours = allAscenseurs.filter(
      (a) => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION && a.technicienAttribueId === tech.id
    ).length;
    
    return {
      id: tech.id,
      nom: tech.nomComplet,
      specialite: tech.specialite,
      disponible: tech.disponible,
      interventions30j: interventions.count,
      interventionsEnCours: enCours,
      tempsReparationMoyen: interventions.tempsMoyen,
    };
  });
  
  // Répartition par type de parc
  const repartitionTypeParc = {
    commercial: { total: 0, fonctionnels: 0 },
    residentiel: { total: 0, fonctionnels: 0 },
    tertiaire: { total: 0, fonctionnels: 0 },
  };
  
  for (const parc of allParcs) {
    const ascenseursParc = allAscenseurs.filter((a) => a.parcId === parc.id);
    const key = parc.type as keyof typeof repartitionTypeParc;
    if (repartitionTypeParc[key]) {
      repartitionTypeParc[key].total += ascenseursParc.length;
      repartitionTypeParc[key].fonctionnels += ascenseursParc.filter(
        (a) => a.etatGlobal === EtatGlobal.FONCTIONNEL
      ).length;
    }
  }
  
  return {
    totalAscenseurs: allAscenseurs.length,
    totalParcs: allParcs.length,
    totalTechniciens: allTechniciens.length,
    tauxDisponibilite: Math.round((fonctionnels / allAscenseurs.length) * 100),
    mttr: calculateMTTR(),
    pannesParSemaine: countPannesPeriode(7),
    pannesMois: countPannesPeriode(30),
    reparationsEnCours: enReparation,
    parcsStats,
    techniciensPerf: techniciensPerf.sort((a, b) => b.interventions30j - a.interventions30j),
    activiteParJour: getActiviteHeatmap(),
    repartitionTypeParc,
    topPannes: [
      { type: 'Portes automatiques', count: 18 },
      { type: 'Câbles de traction', count: 14 },
      { type: 'Variateur de vitesse', count: 12 },
      { type: 'Capteurs', count: 10 },
      { type: 'Système électrique', count: 8 },
    ],
  };
}
