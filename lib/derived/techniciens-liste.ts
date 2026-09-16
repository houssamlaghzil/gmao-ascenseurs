/**
 * Jointures pour l'écran Techniciens (section 12) : liste enrichie
 * (app/techniciens/page.tsx) et état de synchronisation mobile, réutilisé
 * par la liste et par la fiche détail (app/techniciens/[id]/page.tsx).
 *
 * EtatSynchronisationTechnicien (domain/types.ts, section 8) documente la
 * vue attendue par la colonne "Dernière synchronisation mobile" mais n'est
 * matérialisée par aucune fonction de data/store.ts : elle est construite
 * ici à partir de getSessionActiveDuTechnicien +
 * getElementsFileSynchronisationByTechnicienId, jamais stockée.
 */

import { cache } from 'react';
import {
  EtatConnexionMobile,
  EtatSynchronisationTechnicien,
  StatutIntervention,
  StatutSessionTechnicien,
  StatutSynchronisation,
  Technicien,
} from '@/domain/types';
import {
  getAllTechniciens,
  getElementsFileSynchronisationByTechnicienId,
  getInterventionsByTechnicienId,
  getMaintenancesByTechnicienId,
  getPositionByTechnicienId,
  getSecteurGeographiqueById,
  getSessionActiveDuTechnicien,
  getTechnicienById,
  getTourneesByTechnicienId,
} from '@/data/store';
import { estMaintenanceEnRetard } from '@/lib/derived/maintenances-appareil';

const STATUTS_SYNC_EN_ATTENTE: StatutSynchronisation[] = [StatutSynchronisation.EN_ATTENTE, StatutSynchronisation.ENVOI_EN_COURS];

/**
 * État de synchronisation mobile d'un technicien — matérialise
 * EtatSynchronisationTechnicien. Absent si le technicien n'a jamais ouvert
 * de session mobile (aucun SessionTechnicien connu).
 */
export function getEtatSynchronisationTechnicien(technicienId: string): EtatSynchronisationTechnicien | undefined {
  const session = getSessionActiveDuTechnicien(technicienId);
  if (!session) return undefined;

  const elements = getElementsFileSynchronisationByTechnicienId(technicienId);
  return {
    technicienId,
    sessionTechnicienId: session.id,
    etatConnexion: session.etatConnexion,
    nombreElementsEnAttente: elements.filter((e) => STATUTS_SYNC_EN_ATTENTE.includes(e.statut)).length,
    nombreElementsEnEchec: elements.filter((e) => e.statut === StatutSynchronisation.ECHEC).length,
    derniereSynchronisationReussie: session.derniereSynchronisationReussie,
  };
}

/** Ligne enrichie de la liste des techniciens (section 12) — vue de lecture, jamais stockée. */
export interface LigneTechnicienListe {
  technicien: Technicien;
  tourneeNom?: string;
  secteurId?: string;
  secteurNom?: string;
  sessionActive: boolean;
  etatConnexion?: EtatConnexionMobile;
  /**
   * Ville approximative de la dernière position connue : PositionTechnicien
   * (section 13) ne porte que des coordonnées GPS, jamais une ville — on
   * affiche donc la ville de la tournée du technicien dès qu'un ping mobile
   * récent existe, à défaut d'un service de géocodage inverse dans cette
   * maquette.
   */
  villeApprox?: string;
  interventionsOuvertes: number;
  maintenancesEnRetard: number;
  derniereSynchronisation?: string; // ISO
}

function construireLigneTechnicien(technicien: Technicien): LigneTechnicienListe {
  const tournee = getTourneesByTechnicienId(technicien.id)[0];
  const secteur = tournee?.secteurId ? getSecteurGeographiqueById(tournee.secteurId) : undefined;
  const session = getSessionActiveDuTechnicien(technicien.id);
  const position = getPositionByTechnicienId(technicien.id);
  const interventions = getInterventionsByTechnicienId(technicien.id);
  const maintenances = getMaintenancesByTechnicienId(technicien.id);

  return {
    technicien,
    tourneeNom: tournee?.nom,
    secteurId: tournee?.secteurId,
    secteurNom: secteur?.nom,
    sessionActive: session?.statut === StatutSessionTechnicien.EN_COURS,
    etatConnexion: session?.etatConnexion,
    villeApprox: position ? tournee?.ville : undefined,
    interventionsOuvertes: interventions.filter((i) => i.statut !== StatutIntervention.CLOTURE).length,
    maintenancesEnRetard: maintenances.filter((m) => estMaintenanceEnRetard(m)).length,
    derniereSynchronisation: session?.derniereSynchronisationReussie,
  };
}

/** Toutes les lignes de la liste des techniciens, triées par nom. Mis en cache pour la durée de la requête. */
export const getLignesTechniciens = cache((): LigneTechnicienListe[] => {
  return [...getAllTechniciens()]
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))
    .map(construireLigneTechnicien);
});

/** Même enrichissement que getLignesTechniciens, pour un seul technicien (fiche détail, section 12). */
export function getLigneTechnicien(technicienId: string): LigneTechnicienListe | undefined {
  const technicien = getTechnicienById(technicienId);
  return technicien ? construireLigneTechnicien(technicien) : undefined;
}

export interface FiltresTechniciensUI {
  recherche?: string;
  secteurId?: string;
  actif?: boolean;
}

export function filtrerLignesTechniciens(lignes: LigneTechnicienListe[], filtres: FiltresTechniciensUI): LigneTechnicienListe[] {
  const recherche = filtres.recherche?.trim().toLowerCase();
  return lignes.filter((ligne) => {
    if (recherche && !ligne.technicien.nomComplet.toLowerCase().includes(recherche)) return false;
    if (filtres.secteurId && ligne.secteurId !== filtres.secteurId) return false;
    if (filtres.actif !== undefined && ligne.technicien.actif !== filtres.actif) return false;
    return true;
  });
}
