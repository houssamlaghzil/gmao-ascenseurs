/**
 * Jointures pour l'écran "Ma tournée" mobile (section 20). Rassemble, pour
 * un technicien donné, les appareils qui le concernent aujourd'hui :
 *   - ceux dont il est le titulaire (Ascenseur.technicienAffecteId) ;
 *   - ceux de la/des tournée(s) (secteur) dont il est le titulaire
 *     (Tournee.technicienTitulaireId), via getTourneesByTechnicienId puis
 *     getAscenseursByTourneeId ;
 *   - ceux qui portent une Intervention ouverte ou une Maintenance
 *     planifiée/en cours qui LUI est assignée, même si l'appareil n'est pas
 *     dans son périmètre habituel (cas d'une réaffectation ponctuelle, voir
 *     TECH_SCENARIO_REAFFECTATION_MOBILE dans data/mockData.ts).
 *
 * Calculé à la lecture, jamais stocké — même esprit que
 * lib/derived/parc-liste.ts pour l'écran web équivalent (section 4.1), mais
 * scopé à un seul technicien (quelques dizaines à quelques centaines
 * d'appareils au plus, jamais les ~4 350 du parc entier).
 */

import {
  Ascenseur,
  EtatSLA,
  Intervention,
  Maintenance,
  PrioriteAffichageMaintenance,
  StatutIntervention,
  StatutMaintenance,
} from '@/domain/types';
import {
  getAscenseurById,
  getAscenseursByTechnicienId,
  getAscenseursByTourneeId,
  getDateDemo,
  getInterventionsByTechnicienId,
  getMaintenancesByTechnicienId,
  getTourneesByTechnicienId,
} from '@/data/store';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';
import { calculerEtatSLA } from '@/lib/derived/sla';
import { LIBELLE_CATEGORIE_MAINTENANCE, LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';

const STATUTS_MAINTENANCE_OUVERTS: StatutMaintenance[] = [StatutMaintenance.PLANIFIEE, StatutMaintenance.EN_COURS_DE_REALISATION];

/** Un arrêt de la tournée mobile : un appareil enrichi de son intervention/maintenance assignée, le cas échéant. */
export interface ArretTourneeMobile {
  ascenseur: Ascenseur;
  interventionOuverte?: Intervention;
  interventionLibelle?: string;
  interventionEnRetard: boolean; // SLA dépassé (section 7.4)
  maintenancePrevue?: Maintenance;
  maintenanceLibelle?: string;
  maintenanceEnRetard: boolean;
  maintenanceCetteSemaine: boolean;
  /** false si l'appareil ne fait partie ni du titulariat ni de la tournée du technicien (venu uniquement via une intervention/maintenance assignée). */
  horsTourneeHabituelle: boolean;
}

/** Priorité d'affichage : plus haut = plus urgent, pour trier la liste par défaut. */
function scoreUrgence(arret: ArretTourneeMobile): number {
  if (arret.interventionEnRetard) return 5;
  if (arret.interventionOuverte) return 4;
  if (arret.maintenanceEnRetard) return 3;
  if (arret.maintenanceCetteSemaine) return 2;
  if (arret.maintenancePrevue) return 1;
  return 0;
}

/**
 * Appareils "habituels" d'un technicien : ceux dont il est titulaire, plus
 * ceux de la/des tournée(s) (secteur) dont il est le titulaire. Réutilisé
 * par la recherche mobile (section 21) pour distinguer un appareil
 * "récupéré ponctuellement" hors de ce périmètre.
 */
export function getAscenseursTourneeHabituelle(technicienId: string): Map<string, Ascenseur> {
  const ascenseursHabituels = new Map<string, Ascenseur>();
  for (const a of getAscenseursByTechnicienId(technicienId)) ascenseursHabituels.set(a.id, a);
  for (const tournee of getTourneesByTechnicienId(technicienId)) {
    for (const a of getAscenseursByTourneeId(tournee.id)) ascenseursHabituels.set(a.id, a);
  }
  return ascenseursHabituels;
}

/**
 * Tous les arrêts concernant un technicien, triés par urgence décroissante
 * puis par code appareil. `maintenant` est injectable pour les tests.
 */
export function getArretsTourneeTechnicien(technicienId: string, maintenant: Date = getDateDemo()): ArretTourneeMobile[] {
  const ascenseursHabituels = getAscenseursTourneeHabituelle(technicienId);

  const interventionsOuvertes = getInterventionsByTechnicienId(technicienId).filter((i) => i.statut !== StatutIntervention.CLOTURE);
  const maintenancesOuvertes = getMaintenancesByTechnicienId(technicienId).filter((m) => STATUTS_MAINTENANCE_OUVERTS.includes(m.statut));

  // Une seule intervention/maintenance retenue par appareil (la plus urgente en cas de doublon).
  const interventionParAppareil = new Map<string, Intervention>();
  for (const i of interventionsOuvertes) {
    const existante = interventionParAppareil.get(i.ascenseurId);
    if (!existante || new Date(i.dateLimiteSLA).getTime() < new Date(existante.dateLimiteSLA).getTime()) {
      interventionParAppareil.set(i.ascenseurId, i);
    }
  }
  const maintenanceParAppareil = new Map<string, Maintenance>();
  for (const m of maintenancesOuvertes) {
    const existante = maintenanceParAppareil.get(m.ascenseurId);
    if (!existante || new Date(m.datePrevue).getTime() < new Date(existante.datePrevue).getTime()) {
      maintenanceParAppareil.set(m.ascenseurId, m);
    }
  }

  const ascenseursConcernes = new Map<string, Ascenseur>(ascenseursHabituels);
  for (const ascenseurId of [...interventionParAppareil.keys(), ...maintenanceParAppareil.keys()]) {
    if (!ascenseursConcernes.has(ascenseurId)) {
      const ascenseur = getAscenseurById(ascenseurId);
      if (ascenseur) ascenseursConcernes.set(ascenseurId, ascenseur);
    }
  }

  const arrets: ArretTourneeMobile[] = [];
  for (const ascenseur of ascenseursConcernes.values()) {
    const interventionOuverte = interventionParAppareil.get(ascenseur.id);
    const maintenancePrevue = maintenanceParAppareil.get(ascenseur.id);
    const maintenanceEnrichie = maintenancePrevue ? enrichirMaintenance(maintenancePrevue, maintenant) : undefined;
    const slaIntervention = interventionOuverte ? calculerEtatSLA(interventionOuverte, maintenant) : undefined;

    arrets.push({
      ascenseur,
      interventionOuverte,
      interventionLibelle: interventionOuverte ? LIBELLE_MOTIF_INTERVENTION[interventionOuverte.motif] : undefined,
      interventionEnRetard: slaIntervention?.etat === EtatSLA.DEPASSE,
      maintenancePrevue,
      maintenanceLibelle: maintenancePrevue ? maintenancePrevue.categories.map((c) => LIBELLE_CATEGORIE_MAINTENANCE[c]).join(' + ') : undefined,
      maintenanceEnRetard: maintenanceEnrichie?.prioriteAffichage === PrioriteAffichageMaintenance.EN_RETARD,
      maintenanceCetteSemaine: maintenanceEnrichie?.prioriteAffichage === PrioriteAffichageMaintenance.CETTE_SEMAINE,
      horsTourneeHabituelle: !ascenseursHabituels.has(ascenseur.id),
    });
  }

  return arrets.sort((a, b) => {
    const diff = scoreUrgence(b) - scoreUrgence(a);
    return diff !== 0 ? diff : a.ascenseur.code.localeCompare(b.ascenseur.code);
  });
}

export type FiltreTourneeMobile = 'aujourdhui' | 'retard' | 'semaine' | 'interventions' | 'maintenances';

export const FILTRES_TOURNEE_MOBILE: { value: FiltreTourneeMobile; label: string }[] = [
  { value: 'aujourdhui', label: "Aujourd'hui" },
  { value: 'retard', label: 'En retard' },
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'interventions', label: 'Interventions' },
  { value: 'maintenances', label: 'Maintenances' },
];

/** Applique un filtre de l'écran "Ma tournée" (section 20) à la liste des arrêts. */
export function filtrerArretsTournee(arrets: ArretTourneeMobile[], filtre: FiltreTourneeMobile): ArretTourneeMobile[] {
  switch (filtre) {
    case 'retard':
      return arrets.filter((a) => a.interventionEnRetard || a.maintenanceEnRetard);
    case 'semaine':
      return arrets.filter((a) => a.interventionOuverte || a.maintenanceEnRetard || a.maintenanceCetteSemaine);
    case 'interventions':
      return arrets.filter((a) => a.interventionOuverte);
    case 'maintenances':
      return arrets.filter((a) => a.maintenancePrevue);
    case 'aujourdhui':
    default:
      return arrets;
  }
}
