/**
 * Jointures, filtrage et pagination pour la liste des interventions
 * (section 7.1).
 *
 * ~4050 interventions et ~4200 tickets : appeler getTicketsByInterventionId
 * (data/store.ts) une fois par intervention pour trouver le premier ticket
 * (source) et le nombre de tickets coûterait O(n_interventions × n_tickets)
 * sur l'ensemble de la liste. On regroupe donc les tickets par
 * interventionId en une seule passe — même approche que
 * lib/derived/parc-liste.ts pour maintenances/interventions par
 * ascenseurId — et on met le résultat en cache pour la durée d'une requête
 * via `cache()` de React.
 */

import { cache } from 'react';
import {
  EtatSLA,
  EtatSLACalcule,
  Intervention,
  MotifIntervention,
  PrioriteIntervention,
  SourceTicket,
  StatutAppareil,
  StatutIntervention,
  Ticket,
} from '@/domain/types';
import { getAllInterventions, getAllTechniciens, getAllTickets, getAscenseurById, getClientById, getTechnicienById } from '@/data/store';
import { calculerEtatSLA } from './sla';
import type { OptionFiltre } from './parc-liste';

/** Ligne enrichie de la liste des interventions (section 7.1) — vue de lecture, jamais stockée. */
export interface LigneInterventionListe {
  id: string;
  numero: string;
  ascenseurId: string;
  appareilCode: string;
  clientId?: string;
  clientNom: string;
  motif: MotifIntervention;
  /** Source du premier ticket rapproché (ordreDansIntervention = 1), absente si aucun ticket rapproché. */
  source?: SourceTicket;
  priorite: PrioriteIntervention;
  sla: EtatSLACalcule;
  technicienId?: string;
  technicienNom?: string;
  statut: StatutIntervention;
  dateCreation: string;
  datePriseEnCharge?: string;
  dureeInterventionMinutes?: number;
  etatAppareilInitial?: StatutAppareil;
  nombreTickets: number;
}

/** Filtres de la liste des interventions — un choix par filtre (l'UI reste volontairement simple). */
export interface FiltresInterventionsUI {
  statut?: StatutIntervention;
  priorite?: PrioriteIntervention;
  technicienId?: string;
  etatSLA?: EtatSLA;
  source?: SourceTicket;
}

/** Regroupe les tickets rapprochés par interventionId, triés par ordreDansIntervention, en une seule passe. */
const construireIndexTicketsParIntervention = cache((): Map<string, Ticket[]> => {
  const index = new Map<string, Ticket[]>();
  for (const ticket of getAllTickets()) {
    if (!ticket.interventionId) continue;
    const liste = index.get(ticket.interventionId);
    if (liste) liste.push(ticket);
    else index.set(ticket.interventionId, [ticket]);
  }
  for (const liste of index.values()) {
    liste.sort((a, b) => (a.ordreDansIntervention ?? 0) - (b.ordreDansIntervention ?? 0));
  }
  return index;
});

function construireLigne(intervention: Intervention, ticketsIndex: Map<string, Ticket[]>): LigneInterventionListe {
  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const client = ascenseur ? getClientById(ascenseur.clientId) : undefined;
  const technicien = intervention.technicienId ? getTechnicienById(intervention.technicienId) : undefined;
  const ticketsIntervention = ticketsIndex.get(intervention.id) ?? [];

  return {
    id: intervention.id,
    numero: intervention.numero,
    ascenseurId: intervention.ascenseurId,
    appareilCode: ascenseur?.code ?? intervention.ascenseurId,
    clientId: ascenseur?.clientId,
    clientNom: client?.raisonSociale ?? '—',
    motif: intervention.motif,
    source: ticketsIntervention[0]?.source,
    priorite: intervention.priorite,
    sla: calculerEtatSLA(intervention),
    technicienId: intervention.technicienId,
    technicienNom: technicien?.nomComplet,
    statut: intervention.statut,
    dateCreation: intervention.dateCreation,
    datePriseEnCharge: intervention.datePriseEnCharge,
    dureeInterventionMinutes: intervention.dureeInterventionMinutes,
    etatAppareilInitial: intervention.etatAppareilInitial,
    nombreTickets: ticketsIntervention.length,
  };
}

/** Toutes les lignes de la liste des interventions, plus récentes en premier. Mis en cache pour la durée de la requête. */
export const getLignesInterventions = cache((): LigneInterventionListe[] => {
  const ticketsIndex = construireIndexTicketsParIntervention();
  return getAllInterventions()
    .map((intervention) => construireLigne(intervention, ticketsIndex))
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
});

export function filtrerLignesInterventions(lignes: LigneInterventionListe[], filtres: FiltresInterventionsUI): LigneInterventionListe[] {
  return lignes.filter((ligne) => {
    if (filtres.statut && ligne.statut !== filtres.statut) return false;
    if (filtres.priorite && ligne.priorite !== filtres.priorite) return false;
    if (filtres.technicienId && ligne.technicienId !== filtres.technicienId) return false;
    if (filtres.etatSLA && ligne.sla.etat !== filtres.etatSLA) return false;
    if (filtres.source && ligne.source !== filtres.source) return false;
    return true;
  });
}

/** Techniciens actifs, pour le filtre "Technicien" — même convention que getOptionsFiltresAppareils. */
export const getOptionsTechniciensInterventions = cache((): OptionFiltre[] => {
  return [...getAllTechniciens()]
    .filter((t) => t.actif)
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))
    .map((t) => ({ id: t.id, label: t.nomComplet }));
});
