/**
 * Filtrage, regroupement par priorité et pagination pour l'écran
 * Maintenances (section 6.2) : ~31 600 occurrences existent pour l'année en
 * cours, donc on ne matérialise jamais la liste complète côté affichage —
 * uniquement des pages bornées par groupe de priorité.
 *
 * La règle de regroupement (en retard / cette semaine / à venir) réutilise
 * exactement `enrichirMaintenance` (lib/derived/maintenances-appareil.ts,
 * déjà utilisé par la liste des appareils et l'onglet Maintenances de la
 * fiche appareil) afin qu'un même passage soit classé de façon identique
 * partout dans l'application.
 */

import { cache } from 'react';
import { CategorieMaintenance, Maintenance, MaintenanceAvecUrgence, PrioriteAffichageMaintenance } from '@/domain/types';
import { getAllContrats, getAllTechniciens, getAllTournees, getDateDemo } from '@/data/store';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';

/** Filtres de l'écran Maintenances — un choix par filtre (UI volontairement simple). */
export interface FiltresMaintenancesUI {
  technicienId?: string;
  tourneeId?: string;
  contratId?: string;
  categorie?: CategorieMaintenance;
}

export function filtrerMaintenances(maintenances: Maintenance[], filtres: FiltresMaintenancesUI): Maintenance[] {
  return maintenances.filter((m) => {
    if (filtres.technicienId && m.technicienId !== filtres.technicienId) return false;
    if (filtres.tourneeId && m.tourneeId !== filtres.tourneeId) return false;
    if (filtres.contratId && m.contratId !== filtres.contratId) return false;
    if (filtres.categorie && !m.categories.includes(filtres.categorie)) return false;
    return true;
  });
}

/** Les trois groupes de la vue prioritaire (section 6.2), triés du plus urgent au plus lointain. */
export interface GroupesPrioriteMaintenance {
  enRetard: MaintenanceAvecUrgence[];
  cetteSemaine: MaintenanceAvecUrgence[];
  aVenir: MaintenanceAvecUrgence[];
}

function parDatePrevueAsc(a: Maintenance, b: Maintenance): number {
  return new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime();
}

/**
 * Regroupe les maintenances par priorité d'affichage. Une maintenance
 * REALISEE/ANNULEE n'apparaît dans aucun groupe (prioriteAffichage = null,
 * cf. MaintenanceAvecUrgence) : la vue prioritaire ne concerne que les
 * passages encore ouverts.
 */
export function construireGroupesPriorite(maintenances: Maintenance[], maintenant: Date = getDateDemo()): GroupesPrioriteMaintenance {
  const enrichies = maintenances.map((m) => enrichirMaintenance(m, maintenant));
  const enRetard = enrichies.filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.EN_RETARD).sort(parDatePrevueAsc);
  const cetteSemaine = enrichies.filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.CETTE_SEMAINE).sort(parDatePrevueAsc);
  const aVenir = enrichies.filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.A_VENIR).sort(parDatePrevueAsc);
  return { enRetard, cetteSemaine, aVenir };
}

export interface PageResultat<T> {
  items: T[];
  pageActuelle: number;
  totalPages: number;
  total: number;
}

export function paginer<T>(items: T[], page: number, taillePage: number): PageResultat<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / taillePage));
  const pageActuelle = Math.min(Math.max(1, page), totalPages);
  const debut = (pageActuelle - 1) * taillePage;
  return { items: items.slice(debut, debut + taillePage), pageActuelle, totalPages, total };
}

export interface OptionFiltreMaintenance {
  id: string;
  label: string;
}

export interface OptionsFiltresMaintenances {
  techniciens: OptionFiltreMaintenance[];
  tournees: OptionFiltreMaintenance[];
  contrats: OptionFiltreMaintenance[];
}

/** Listes d'options pour les filtres (quelques dizaines d'entrées chacune, mises en cache pour la requête). */
export const getOptionsFiltresMaintenances = cache((): OptionsFiltresMaintenances => {
  const techniciens = getAllTechniciens().filter((t) => t.actif).sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));
  const tournees = getAllTournees().filter((t) => t.actif).sort((a, b) => a.nom.localeCompare(b.nom));
  const contrats = [...getAllContrats()].sort((a, b) => a.numero.localeCompare(b.numero));

  return {
    techniciens: techniciens.map((t) => ({ id: t.id, label: t.nomComplet })),
    tournees: tournees.map((t) => ({ id: t.id, label: t.nom })),
    contrats: contrats.map((c) => ({ id: c.id, label: c.numero })),
  };
});
