/**
 * Enrichissement d'une Maintenance pour l'affichage (retard, priorité de
 * planning, durée en cours) — matérialise le type MaintenanceAvecUrgence
 * (domain/types.ts), calculé à la lecture, jamais stocké.
 *
 * Réutilisé par la liste des appareils (section 4.1, colonnes
 * dernière/prochaine maintenance + filtre "en retard") et par l'onglet
 * Maintenances de la fiche appareil (section 4.2).
 */

import { Maintenance, StatutMaintenance, PrioriteAffichageMaintenance, MaintenanceAvecUrgence } from '@/domain/types';

const JOUR_MS = 24 * 60 * 60 * 1000;
const FENETRE_CETTE_SEMAINE_MS = 7 * JOUR_MS;

const STATUTS_OUVERTS: StatutMaintenance[] = [StatutMaintenance.PLANIFIEE, StatutMaintenance.EN_COURS_DE_REALISATION];

export function enrichirMaintenance(maintenance: Maintenance, maintenant: Date = new Date()): MaintenanceAvecUrgence {
  const datePrevueMs = new Date(maintenance.datePrevue).getTime();
  const estOuverte = STATUTS_OUVERTS.includes(maintenance.statut);
  const retardJours = estOuverte && datePrevueMs < maintenant.getTime()
    ? Math.floor((maintenant.getTime() - datePrevueMs) / JOUR_MS)
    : 0;

  let prioriteAffichage: PrioriteAffichageMaintenance | null = null;
  if (estOuverte) {
    if (retardJours > 0) prioriteAffichage = PrioriteAffichageMaintenance.EN_RETARD;
    else if (datePrevueMs - maintenant.getTime() <= FENETRE_CETTE_SEMAINE_MS) prioriteAffichage = PrioriteAffichageMaintenance.CETTE_SEMAINE;
    else prioriteAffichage = PrioriteAffichageMaintenance.A_VENIR;
  }

  let dureeEnCoursMinutes: number | undefined;
  if (maintenance.statut === StatutMaintenance.EN_COURS_DE_REALISATION && maintenance.heureDebut) {
    dureeEnCoursMinutes = Math.max(0, Math.round((maintenant.getTime() - new Date(maintenance.heureDebut).getTime()) / 60000));
  }

  return { ...maintenance, retardJours, prioriteAffichage, dureeEnCoursMinutes };
}

export function estMaintenanceEnRetard(maintenance: Maintenance, maintenant: Date = new Date()): boolean {
  return enrichirMaintenance(maintenance, maintenant).retardJours > 0;
}

/** Dernière maintenance réalisée (statut REALISEE), triée par date de réalisation. */
export function trouverDerniereMaintenanceRealisee(maintenances: Maintenance[]): Maintenance | undefined {
  return [...maintenances]
    .filter((m) => m.statut === StatutMaintenance.REALISEE && m.dateRealisee)
    .sort((a, b) => new Date(b.dateRealisee!).getTime() - new Date(a.dateRealisee!).getTime())[0];
}

/** Prochaine maintenance planifiée ou en cours, triée par date prévue. */
export function trouverProchaineMaintenancePlanifiee(maintenances: Maintenance[], maintenant: Date = new Date()): Maintenance | undefined {
  return [...maintenances]
    .filter((m) => STATUTS_OUVERTS.includes(m.statut))
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())[0];
}
