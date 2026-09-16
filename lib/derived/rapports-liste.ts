/**
 * Jointures, filtrage et pagination pour la liste des rapports (section
 * 9.1). L'échantillon curé ne compte qu'environ 340 objets (voir
 * data/mockData.ts, section "AGRÉGATS RAPPORTS") : contrairement à
 * lib/derived/interventions-liste.ts ou parc-liste.ts, il n'est pas utile de
 * construire un index par ascenseurId — une jointure directe par rapport
 * suffit très largement à ce volume.
 */

import { cache } from 'react';
import {
  Rapport,
  RattachementRapport,
  StatutValidationRapport,
  TypeRapport,
} from '@/domain/types';
import {
  getAllRapports,
  getAscenseurById,
  getClientById,
  getInterventionById,
  getMaintenanceById,
} from '@/data/store';
import type { OptionFiltre } from './parc-liste';

/** Ligne enrichie de la liste des rapports (section 9.1) — vue de lecture, jamais stockée. */
export interface LigneRapportListe {
  id: string;
  numero: string;
  typeRapport: TypeRapport;
  rattachement: RattachementRapport;
  ascenseurId: string;
  appareilCode: string;
  ville: string;
  clientId?: string;
  clientNom: string;
  technicienId: string;
  technicienNom: string;
  interventionId?: string;
  interventionNumero?: string;
  maintenanceId?: string;
  maintenanceNumero?: string;
  dateHeureDebut: string;
  dateHeureFin?: string;
  dureeMinutes?: number;
  statutValidation: StatutValidationRapport;
  accesObtenu: boolean;
}

/** Filtres de la liste des rapports — un choix par filtre (l'UI reste volontairement simple). */
export interface FiltresRapportsUI {
  type?: TypeRapport;
  ascenseurId?: string;
  technicienId?: string;
  clientId?: string;
  date?: string; // ISO date (jour), comparée au jour de dateHeureDebut
  interventionId?: string;
  statutValidation?: StatutValidationRapport;
  rattachement?: RattachementRapport;
}

function construireLigne(rapport: Rapport): LigneRapportListe {
  const ascenseur = getAscenseurById(rapport.ascenseurId);
  const client = ascenseur ? getClientById(ascenseur.clientId) : undefined;
  const intervention = rapport.interventionId ? getInterventionById(rapport.interventionId) : undefined;
  const maintenance = rapport.maintenanceId ? getMaintenanceById(rapport.maintenanceId) : undefined;

  return {
    id: rapport.id,
    numero: rapport.numero,
    typeRapport: rapport.typeRapport,
    rattachement: rapport.rattachement,
    ascenseurId: rapport.ascenseurId,
    appareilCode: ascenseur?.code ?? rapport.ascenseurId,
    ville: ascenseur?.ville ?? '—',
    clientId: ascenseur?.clientId,
    clientNom: client?.raisonSociale ?? '—',
    technicienId: rapport.technicienId,
    technicienNom: rapport.technicienNom,
    interventionId: rapport.interventionId,
    interventionNumero: intervention?.numero,
    maintenanceId: rapport.maintenanceId,
    maintenanceNumero: maintenance?.numero,
    dateHeureDebut: rapport.dateHeureDebut,
    dateHeureFin: rapport.dateHeureFin,
    dureeMinutes: rapport.dureeMinutes,
    statutValidation: rapport.statutValidation,
    accesObtenu: rapport.accesObtenu,
  };
}

/** Toutes les lignes de la liste des rapports, plus récentes en premier. Mis en cache pour la durée de la requête. */
export const getLignesRapports = cache((): LigneRapportListe[] => {
  return getAllRapports()
    .map(construireLigne)
    .sort((a, b) => new Date(b.dateHeureDebut).getTime() - new Date(a.dateHeureDebut).getTime());
});

function memeJour(isoA: string, isoB: string): boolean {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

export function filtrerLignesRapports(lignes: LigneRapportListe[], filtres: FiltresRapportsUI): LigneRapportListe[] {
  return lignes.filter((ligne) => {
    if (filtres.type && ligne.typeRapport !== filtres.type) return false;
    if (filtres.ascenseurId && ligne.ascenseurId !== filtres.ascenseurId) return false;
    if (filtres.technicienId && ligne.technicienId !== filtres.technicienId) return false;
    if (filtres.clientId && ligne.clientId !== filtres.clientId) return false;
    if (filtres.interventionId && ligne.interventionId !== filtres.interventionId) return false;
    if (filtres.statutValidation && ligne.statutValidation !== filtres.statutValidation) return false;
    if (filtres.rattachement && ligne.rattachement !== filtres.rattachement) return false;
    if (filtres.date && !memeJour(ligne.dateHeureDebut, filtres.date)) return false;
    return true;
  });
}

export interface OptionsFiltresRapports {
  appareils: OptionFiltre[];
  techniciens: OptionFiltre[];
  clients: OptionFiltre[];
  interventions: OptionFiltre[];
}

/**
 * Options de filtre dérivées de l'échantillon curé lui-même (et non de
 * l'ensemble du parc/portefeuille technicien, bien plus large) : seuls les
 * appareils/techniciens/clients/interventions effectivement présents dans un
 * rapport ont un sens comme filtre sur cette liste.
 */
export const getOptionsFiltresRapports = cache((): OptionsFiltresRapports => {
  const lignes = getLignesRapports();
  const appareils = new Map<string, string>();
  const techniciens = new Map<string, string>();
  const clients = new Map<string, string>();
  const interventions = new Map<string, string>();

  for (const ligne of lignes) {
    appareils.set(ligne.ascenseurId, ligne.appareilCode);
    techniciens.set(ligne.technicienId, ligne.technicienNom);
    if (ligne.clientId) clients.set(ligne.clientId, ligne.clientNom);
    if (ligne.interventionId && ligne.interventionNumero) interventions.set(ligne.interventionId, ligne.interventionNumero);
  }

  const versOptions = (index: Map<string, string>): OptionFiltre[] =>
    Array.from(index.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

  return {
    appareils: versOptions(appareils),
    techniciens: versOptions(techniciens),
    clients: versOptions(clients),
    interventions: versOptions(interventions),
  };
});
