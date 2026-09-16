/**
 * Jointures, filtrage et pagination pour la liste des contrôles CTQ
 * (section 10.1). ~650 contrôles : jointures faites une seule fois puis
 * mises en cache pour la durée de la requête, même convention que
 * lib/derived/interventions-liste.ts.
 */

import { cache } from 'react';
import { ControleCTQ, StatutControleCTQ } from '@/domain/types';
import { getAllClients, getAllControlesCTQ, getAllTechniciens, getAscenseurById, getBureauEtudesById, getClientById, getTechnicienById } from '@/data/store';
import type { OptionFiltre } from './parc-liste';

/** Ligne enrichie de la liste des contrôles CTQ — vue de lecture, jamais stockée. */
export interface LigneControleCTQListe {
  id: string;
  numero: string;
  appareilId: string;
  appareilCode: string;
  clientId: string;
  clientNom: string;
  bureauEtudesId: string;
  bureauEtudesNom: string;
  dateVisite: string;
  statut: StatutControleCTQ;
  nombreReserves: number;
  nombreReservesSoldees: number;
  technicienId?: string;
  technicienNom?: string;
}

/** Filtres de la liste des contrôles CTQ — un choix par filtre (l'UI reste volontairement simple). */
export interface FiltresControlesCTQUI {
  statut?: StatutControleCTQ;
  clientId?: string;
  technicienId?: string;
}

function construireLigne(controle: ControleCTQ): LigneControleCTQListe {
  const ascenseur = getAscenseurById(controle.appareilId);
  const client = getClientById(controle.clientId);
  const bureauEtudes = getBureauEtudesById(controle.bureauEtudesId);
  const technicien = controle.technicienId ? getTechnicienById(controle.technicienId) : undefined;

  return {
    id: controle.id,
    numero: controle.numero,
    appareilId: controle.appareilId,
    appareilCode: ascenseur?.code ?? controle.appareilId,
    clientId: controle.clientId,
    clientNom: client?.raisonSociale ?? '—',
    bureauEtudesId: controle.bureauEtudesId,
    bureauEtudesNom: bureauEtudes?.nom ?? '—',
    dateVisite: controle.dateVisite,
    statut: controle.statut,
    nombreReserves: controle.nombreReserves,
    nombreReservesSoldees: controle.nombreReservesSoldees,
    technicienId: controle.technicienId,
    technicienNom: technicien?.nomComplet,
  };
}

/** Toutes les lignes de la liste des contrôles CTQ, plus récentes en premier. Mis en cache pour la durée de la requête. */
export const getLignesControlesCTQ = cache((): LigneControleCTQListe[] => {
  return getAllControlesCTQ()
    .map(construireLigne)
    .sort((a, b) => new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime());
});

export function filtrerLignesControlesCTQ(lignes: LigneControleCTQListe[], filtres: FiltresControlesCTQUI): LigneControleCTQListe[] {
  return lignes.filter((ligne) => {
    if (filtres.statut && ligne.statut !== filtres.statut) return false;
    if (filtres.clientId && ligne.clientId !== filtres.clientId) return false;
    if (filtres.technicienId && ligne.technicienId !== filtres.technicienId) return false;
    return true;
  });
}

export interface OptionsFiltresClientsTechniciensCTQ {
  clients: OptionFiltre[];
  techniciens: OptionFiltre[];
}

/** Options "Client" / "Technicien" communes aux filtres des écrans CTQ (contrôles et réserves). */
export const getOptionsClientsTechniciensCTQ = cache((): OptionsFiltresClientsTechniciensCTQ => {
  const clients = [...getAllClients()].sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale));
  const techniciens = [...getAllTechniciens()].filter((t) => t.actif).sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));

  return {
    clients: clients.map((c) => ({ id: c.id, label: c.raisonSociale })),
    techniciens: techniciens.map((t) => ({ id: t.id, label: t.nomComplet })),
  };
});
