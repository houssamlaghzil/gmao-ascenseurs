/**
 * Agrégats dérivés pour l'écran d'accueil mobile technicien (section 19).
 *
 * Fichier neuf sous lib/derived/ : ne modifie ni n'étend domain/types.ts,
 * domain/business-logic.ts, domain/risk-scoring.ts ni data/store.ts — il ne
 * fait que composer leurs fonctions/exports existants pour construire la
 * vue "ma journée" d'un technicien.
 *
 * Découpage volontairement simple, pensé pour tenir sur un écran de
 * téléphone :
 *   - urgent : interventions "personne bloquée" ou priorité critique,
 *     encore ouvertes ;
 *   - aujourd'hui : le reste des interventions ouvertes + les maintenances
 *     et réserves CTQ prévues aujourd'hui ;
 *   - enRetard : maintenances ouvertes dont la date prévue est dépassée ;
 *   - cetteSemaine : maintenances ouvertes prévues dans les 7 jours, hors
 *     aujourd'hui (déjà couvert par le bloc précédent).
 *
 * Les interventions n'ont pas de date planifiée dans le modèle (section
 * 7/8) : une intervention encore ouverte est par nature une charge de
 * "maintenant", donc traitée comme relevant du jour.
 */

import {
  Ascenseur,
  Intervention,
  MaintenanceAvecUrgence,
  MotifIntervention,
  PrioriteAffichageMaintenance,
  PrioriteIntervention,
  ReserveCTQ,
  StatutIntervention,
  StatutReserve,
  StatutSynchronisation,
} from '@/domain/types';
import {
  getAscenseurById,
  getDateDemo,
  getElementsFileSynchronisationByTechnicienId,
  getInterventionsByTechnicienId,
  getMaintenancesByTechnicienId,
  getReservesCTQByTechnicienId,
} from '@/data/store';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';
import { formatDateKey } from '@/lib/derived/maintenances-calendrier';

export interface ItemAccueilIntervention {
  nature: 'intervention';
  intervention: Intervention;
  ascenseur?: Ascenseur;
}

export interface ItemAccueilMaintenance {
  nature: 'maintenance';
  maintenance: MaintenanceAvecUrgence;
  ascenseur?: Ascenseur;
}

export interface ItemAccueilReserve {
  nature: 'reserve';
  reserve: ReserveCTQ;
  ascenseur?: Ascenseur;
}

export type ItemAccueilTechnicien = ItemAccueilIntervention | ItemAccueilMaintenance | ItemAccueilReserve;

export interface BlocsAccueilTechnicien {
  urgent: ItemAccueilIntervention[];
  aujourdhui: ItemAccueilTechnicien[];
  enRetard: ItemAccueilMaintenance[];
  cetteSemaine: ItemAccueilMaintenance[];
}

function estInterventionUrgente(i: Intervention): boolean {
  return i.motif === MotifIntervention.PERSONNE_BLOQUEE || i.priorite === PrioriteIntervention.CRITIQUE;
}

/** Construit les 4 blocs de l'écran d'accueil pour un technicien donné. */
export function construireBlocsAccueilTechnicien(technicienId: string, maintenant: Date = getDateDemo()): BlocsAccueilTechnicien {
  const todayKey = formatDateKey(maintenant);

  const interventionsOuvertes = getInterventionsByTechnicienId(technicienId).filter((i) => i.statut !== StatutIntervention.CLOTURE);

  const urgent: ItemAccueilIntervention[] = interventionsOuvertes
    .filter(estInterventionUrgente)
    .sort((a, b) => new Date(a.dateLimiteSLA).getTime() - new Date(b.dateLimiteSLA).getTime())
    .map((intervention) => ({ nature: 'intervention', intervention, ascenseur: getAscenseurById(intervention.ascenseurId) }));

  const idsUrgents = new Set(urgent.map((u) => u.intervention.id));

  const interventionsAujourdhui: ItemAccueilIntervention[] = interventionsOuvertes
    .filter((i) => !idsUrgents.has(i.id))
    .sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime())
    .map((intervention) => ({ nature: 'intervention', intervention, ascenseur: getAscenseurById(intervention.ascenseurId) }));

  const maintenancesOuvertes = getMaintenancesByTechnicienId(technicienId)
    .map((m) => enrichirMaintenance(m, maintenant))
    .filter((m) => m.prioriteAffichage !== null);

  const maintenancesAujourdhui: ItemAccueilMaintenance[] = maintenancesOuvertes
    .filter((m) => m.datePrevue.slice(0, 10) === todayKey)
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())
    .map((maintenance) => ({ nature: 'maintenance', maintenance, ascenseur: getAscenseurById(maintenance.ascenseurId) }));

  const reservesOuvertes = getReservesCTQByTechnicienId(technicienId).filter((r) => r.statut !== StatutReserve.VALIDEE);

  const reservesAujourdhui: ItemAccueilReserve[] = reservesOuvertes
    .filter((r) => !!r.datePlanification && r.datePlanification.slice(0, 10) === todayKey)
    .sort((a, b) => new Date(a.datePlanification!).getTime() - new Date(b.datePlanification!).getTime())
    .map((reserve) => ({ nature: 'reserve', reserve, ascenseur: getAscenseurById(reserve.appareilId) }));

  const aujourdhui: ItemAccueilTechnicien[] = [...interventionsAujourdhui, ...maintenancesAujourdhui, ...reservesAujourdhui];

  const enRetard: ItemAccueilMaintenance[] = maintenancesOuvertes
    .filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.EN_RETARD)
    .sort((a, b) => b.retardJours - a.retardJours)
    .map((maintenance) => ({ nature: 'maintenance', maintenance, ascenseur: getAscenseurById(maintenance.ascenseurId) }));

  const cetteSemaine: ItemAccueilMaintenance[] = maintenancesOuvertes
    .filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.CETTE_SEMAINE && m.datePrevue.slice(0, 10) !== todayKey)
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())
    .map((maintenance) => ({ nature: 'maintenance', maintenance, ascenseur: getAscenseurById(maintenance.ascenseurId) }));

  return { urgent, aujourdhui, enRetard, cetteSemaine };
}

const STATUTS_SYNC_EN_ATTENTE: StatutSynchronisation[] = [
  StatutSynchronisation.EN_ATTENTE,
  StatutSynchronisation.ENVOI_EN_COURS,
  StatutSynchronisation.ECHEC,
];

/** Nombre d'éléments de la file de synchronisation encore en attente (ou en échec) pour ce technicien. */
export function compterElementsSyncEnAttente(technicienId: string): number {
  return getElementsFileSynchronisationByTechnicienId(technicienId).filter((e) => STATUTS_SYNC_EN_ATTENTE.includes(e.statut)).length;
}
