/**
 * Projection du planning technicien (section 11.1) : matérialise le type
 * TachePlanning documenté dans domain/types.ts comme "calculé, jamais
 * stocké" — une Maintenance, une Intervention (encore ouverte) ou une
 * AbsenceTechnicien, ramenées à une forme homogène pour l'affichage
 * jour/semaine/mois et le drag & drop générique (section 11.2).
 *
 * Construit, pour chaque technicien, à partir de
 * getMaintenancesByTechnicienId / getInterventionsByTechnicienId /
 * getAbsencesByTechnicienId (data/store.ts), filtré sur la plage de dates
 * demandée. Une intervention CLOTURE ne représente plus une charge de
 * travail à planifier et n'apparaît donc jamais dans le planning.
 */

import { cache } from 'react';
import {
  AbsenceTechnicien,
  EtatSLA,
  Intervention,
  Maintenance,
  PrioriteAffichageMaintenance,
  PrioriteIntervention,
  StatutIntervention,
  TachePlanning,
  Technicien,
  TypeCiblePlanning,
  TypeTachePlanning,
} from '@/domain/types';
import {
  getAbsencesByTechnicienId,
  getAllAbsencesTechnicien,
  getAllSecteursGeographiques,
  getAllTechniciens,
  getAllTournees,
  getAscenseurById,
  getInterventionsByTechnicienId,
  getMaintenancesByTechnicienId,
  getReaffectationsByCible,
  getSecteurGeographiqueById,
  getTechnicienById,
  getTourneesByTechnicienId,
} from '@/data/store';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';
import { calculerEtatSLA } from '@/lib/derived/sla';
import { LIBELLE_CATEGORIE_MAINTENANCE, LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { LIBELLE_STATUT_INTERVENTION } from '@/lib/derived/libelles-interventions';
import { LIBELLE_STATUT_MAINTENANCE, LIBELLE_TYPE_ABSENCE } from '@/lib/derived/libelles-planning';
import { decomposerMoisKey, formatDateKey, lundiDeLaSemaine } from '@/lib/derived/maintenances-calendrier';

const JOUR_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Construction d'une TachePlanning par entité source
// ============================================================================

function construireTacheMaintenance(m: Maintenance, technicienId: string, maintenant: Date): TachePlanning {
  const enrichie = enrichirMaintenance(m, maintenant);
  const ascenseur = getAscenseurById(m.ascenseurId);
  const categoriesLabel = m.categories.map((c) => LIBELLE_CATEGORIE_MAINTENANCE[c]).join(' + ');
  const dateDebut = m.heureDebut ?? m.datePrevue;
  const dureeMinutes = m.dureeReelleMinutes ?? m.seuilDureeMinimaleMinutes ?? 60;
  const dateFin = m.heureFin ?? new Date(new Date(dateDebut).getTime() + dureeMinutes * 60_000).toISOString();
  const reaffectations = getReaffectationsByCible(TypeCiblePlanning.MAINTENANCE, m.id);
  const derniere = reaffectations[reaffectations.length - 1];

  return {
    id: `tache-mnt-${m.id}`,
    type: TypeTachePlanning.MAINTENANCE,
    technicienId,
    tourneeId: m.tourneeId,
    ascenseurId: m.ascenseurId,
    referenceId: m.id,
    dateDebut,
    dateFin,
    urgent: enrichie.prioriteAffichage === PrioriteAffichageMaintenance.EN_RETARD,
    libelle: `${categoriesLabel}${ascenseur ? ` — ${ascenseur.code}` : ''}`,
    statutAffichage: enrichie.prioriteAffichage === PrioriteAffichageMaintenance.EN_RETARD ? 'En retard' : LIBELLE_STATUT_MAINTENANCE[m.statut],
    reaffecte: !!derniere,
    technicienOrigineId: derniere?.ancienTechnicienId,
    motifReaffectation: derniere?.motif,
  };
}

function construireTacheIntervention(i: Intervention, technicienId: string): TachePlanning {
  const ascenseur = getAscenseurById(i.ascenseurId);
  const sla = calculerEtatSLA(i);
  const dateDebut = i.dateAffectation ?? i.dateCreation;
  const reaffectations = getReaffectationsByCible(TypeCiblePlanning.INTERVENTION, i.id);
  const derniere = reaffectations[reaffectations.length - 1];

  return {
    id: `tache-int-${i.id}`,
    type: TypeTachePlanning.INTERVENTION,
    technicienId,
    tourneeId: undefined,
    ascenseurId: i.ascenseurId,
    referenceId: i.id,
    dateDebut,
    dateFin: i.dateLimiteSLA,
    urgent: i.priorite === PrioriteIntervention.CRITIQUE || sla.etat === EtatSLA.DEPASSE,
    libelle: `${LIBELLE_MOTIF_INTERVENTION[i.motif]}${ascenseur ? ` — ${ascenseur.code}` : ''}`,
    statutAffichage: LIBELLE_STATUT_INTERVENTION[i.statut],
    reaffecte: !!derniere,
    technicienOrigineId: derniere?.ancienTechnicienId,
    motifReaffectation: derniere?.motif,
  };
}

function construireTacheAbsence(a: AbsenceTechnicien): TachePlanning {
  return {
    id: `tache-abs-${a.id}`,
    type: TypeTachePlanning.ABSENCE,
    technicienId: a.technicienId,
    tourneeId: undefined,
    ascenseurId: undefined,
    referenceId: a.id,
    dateDebut: `${a.dateDebut}T00:00:00.000Z`,
    dateFin: `${a.dateFin}T23:59:59.999Z`,
    urgent: false,
    libelle: LIBELLE_TYPE_ABSENCE[a.type],
    statutAffichage: 'Absent',
    reaffecte: false,
  };
}

// ============================================================================
// Projection par technicien, sur une plage de dates
// ============================================================================

/**
 * Tâches d'un technicien dont la date tombe dans la plage [debut, fin[.
 * Une intervention CLOTURE est ignorée : elle ne représente plus une charge
 * à planifier. Triées chronologiquement.
 */
export function getTachesPlanningTechnicien(
  technicienId: string,
  debut: Date,
  fin: Date,
  maintenant: Date = new Date()
): TachePlanning[] {
  const debutMs = debut.getTime();
  const finMs = fin.getTime();
  const taches: TachePlanning[] = [];

  for (const m of getMaintenancesByTechnicienId(technicienId)) {
    const dateMs = new Date(m.datePrevue).getTime();
    if (dateMs >= debutMs && dateMs < finMs) taches.push(construireTacheMaintenance(m, technicienId, maintenant));
  }
  for (const i of getInterventionsByTechnicienId(technicienId)) {
    if (i.statut === StatutIntervention.CLOTURE) continue;
    const dateMs = new Date(i.dateAffectation ?? i.dateCreation).getTime();
    if (dateMs >= debutMs && dateMs < finMs) taches.push(construireTacheIntervention(i, technicienId));
  }
  for (const a of getAbsencesByTechnicienId(technicienId)) {
    const absDebutMs = new Date(`${a.dateDebut}T00:00:00.000Z`).getTime();
    const absFinMs = new Date(`${a.dateFin}T23:59:59.999Z`).getTime();
    if (absFinMs >= debutMs && absDebutMs < finMs) taches.push(construireTacheAbsence(a));
  }

  return taches.sort((x, y) => new Date(x.dateDebut).getTime() - new Date(y.dateDebut).getTime());
}

/** Ligne d'affichage du planning (section 11.1) : un technicien et ses tâches sur la période affichée. */
export interface LignePlanningTechnicien {
  technicien: Technicien;
  tourneeNom?: string;
  secteurNom?: string;
  taches: TachePlanning[];
}

export function construireLignesPlanning(
  techniciens: Technicien[],
  debut: Date,
  fin: Date,
  maintenant: Date = new Date()
): LignePlanningTechnicien[] {
  return techniciens.map((technicien) => {
    const tournee = getTourneesByTechnicienId(technicien.id)[0];
    const secteur = tournee?.secteurId ? getSecteurGeographiqueById(tournee.secteurId) : undefined;
    return {
      technicien,
      tourneeNom: tournee?.nom,
      secteurNom: secteur?.nom,
      taches: getTachesPlanningTechnicien(technicien.id, debut, fin, maintenant),
    };
  });
}

// ============================================================================
// Filtres et options (secteur / tournée / technicien)
// ============================================================================

export interface FiltresPlanningUI {
  technicienId?: string;
  tourneeId?: string;
  secteurId?: string;
}

export function filtrerTechniciensPlanning(techniciens: Technicien[], filtres: FiltresPlanningUI): Technicien[] {
  return techniciens.filter((t) => {
    if (filtres.technicienId && t.id !== filtres.technicienId) return false;
    const tourneesTechnicien = filtres.tourneeId || filtres.secteurId ? getTourneesByTechnicienId(t.id) : [];
    if (filtres.tourneeId && !tourneesTechnicien.some((tn) => tn.id === filtres.tourneeId)) return false;
    if (filtres.secteurId && !tourneesTechnicien.some((tn) => tn.secteurId === filtres.secteurId)) return false;
    return true;
  });
}

export interface OptionFiltrePlanning {
  id: string;
  label: string;
}

export interface OptionsFiltresPlanning {
  techniciens: OptionFiltrePlanning[];
  tournees: OptionFiltrePlanning[];
  secteurs: OptionFiltrePlanning[];
}

/** Listes d'options pour les filtres (quelques dizaines d'entrées, mises en cache pour la requête). */
export const getOptionsFiltresPlanning = cache((): OptionsFiltresPlanning => {
  const techniciens = getAllTechniciens().filter((t) => t.actif).sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));
  const tournees = [...getAllTournees()].filter((t) => t.actif).sort((a, b) => a.nom.localeCompare(b.nom));
  const secteurs = [...getAllSecteursGeographiques()].sort((a, b) => a.nom.localeCompare(b.nom));

  return {
    techniciens: techniciens.map((t) => ({ id: t.id, label: t.nomComplet })),
    tournees: tournees.map((t) => ({ id: t.id, label: t.nom })),
    secteurs: secteurs.map((s) => ({ id: s.id, label: s.nom })),
  };
});

// ============================================================================
// Plages de dates jour / semaine / mois (section 11.1)
// ============================================================================

export interface PlagePlanning {
  debut: Date;
  fin: Date; // exclue
}

/** Plage [minuit, minuit + 1 jour[ du jour désigné par `dateKey` (YYYY-MM-DD). */
export function plageJour(dateKey: string): PlagePlanning {
  const debut = new Date(`${dateKey}T00:00:00.000Z`);
  return { debut, fin: new Date(debut.getTime() + JOUR_MS) };
}

/** Plage [lundi, lundi + 7 jours[ de la semaine contenant `dateKey` (YYYY-MM-DD). */
export function plageSemaine(dateKey: string): PlagePlanning {
  const debut = lundiDeLaSemaine(new Date(`${dateKey}T00:00:00.000Z`));
  return { debut, fin: new Date(debut.getTime() + 7 * JOUR_MS) };
}

/** Plage [1er du mois, 1er du mois suivant[ désignée par `moisKey` (YYYY-MM). */
export function plageMois(moisKey: string): PlagePlanning {
  const { annee, moisIndex0 } = decomposerMoisKey(moisKey);
  return { debut: new Date(Date.UTC(annee, moisIndex0, 1)), fin: new Date(Date.UTC(annee, moisIndex0 + 1, 1)) };
}

/** Décale une clé YYYY-MM-DD de `deltaJours` jours. */
export function decalerJourKey(dateKey: string, deltaJours: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  return formatDateKey(new Date(d.getTime() + deltaJours * JOUR_MS));
}

// ============================================================================
// Absences (section 11.3)
// ============================================================================

/** Ligne d'affichage de la liste des absences (section 11.3), avec remplaçant et tâches concernées. */
export interface LigneAbsencePlanning {
  absence: AbsenceTechnicien;
  technicienNom: string;
  remplacantNom?: string;
  /**
   * Tâches (maintenances/interventions) du technicien absent qui tombent
   * dans sa période d'absence — reaffecte indique si elles ont déjà été
   * réattribuées (au remplaçant ou à un autre technicien) ou si elles sont
   * toujours à transférer.
   */
  tachesConcernees: TachePlanning[];
}

export function construireLignesAbsences(maintenant: Date = new Date()): LigneAbsencePlanning[] {
  return getAllAbsencesTechnicien()
    .map((absence): LigneAbsencePlanning => {
      const technicien = getTechnicienById(absence.technicienId);
      const remplacant = absence.remplacantId ? getTechnicienById(absence.remplacantId) : undefined;
      const debut = new Date(`${absence.dateDebut}T00:00:00.000Z`);
      const fin = new Date(new Date(`${absence.dateFin}T23:59:59.999Z`).getTime() + 1);
      const tachesConcernees = getTachesPlanningTechnicien(absence.technicienId, debut, fin, maintenant).filter(
        (t) => t.type !== TypeTachePlanning.ABSENCE
      );
      return {
        absence,
        technicienNom: technicien?.nomComplet ?? absence.technicienId,
        remplacantNom: remplacant?.nomComplet,
        tachesConcernees,
      };
    })
    .sort((a, b) => new Date(b.absence.dateDebut).getTime() - new Date(a.absence.dateDebut).getTime());
}
