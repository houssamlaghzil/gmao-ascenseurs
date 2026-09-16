/**
 * Jointures, filtrage et pagination pour la liste des réserves CTQ (section
 * 10.3), consultable indépendamment des contrôles. ~1474 réserves :
 * jointures faites une seule fois puis mises en cache pour la durée de la
 * requête, même convention que lib/derived/ctq-liste.ts.
 */

import { cache } from 'react';
import { GraviteReserve, ReserveCTQ, StatutReserve } from '@/domain/types';
import { estReserveEnRetard } from '@/domain/business-logic';
import { getAllReservesCTQ, getAscenseurById, getClientById, getControleCTQById, getTechnicienById } from '@/data/store';
import { libelleBlocReserve } from './libelles-ctq';

/** Ligne enrichie de la liste des réserves CTQ — vue de lecture, jamais stockée. */
export interface LigneReserveCTQListe {
  id: string;
  numero: string;
  controleId: string;
  controleNumero: string;
  appareilId: string;
  appareilCode: string;
  clientId: string;
  clientNom: string;
  libelleBloc: string;
  description: string;
  actionDemandee: string;
  gravite: GraviteReserve;
  statut: StatutReserve;
  dateConstat: string;
  dateEcheance?: string;
  enRetard: boolean;
  technicienId?: string;
  technicienNom?: string;
}

/** Filtres de la liste des réserves CTQ — un choix par filtre (l'UI reste volontairement simple). */
export interface FiltresReservesCTQUI {
  statut?: StatutReserve;
  gravite?: GraviteReserve;
  clientId?: string;
  technicienId?: string;
  enRetard?: boolean;
}

function construireLigne(reserve: ReserveCTQ, maintenant: Date): LigneReserveCTQListe {
  const ascenseur = getAscenseurById(reserve.appareilId);
  const client = getClientById(reserve.clientId);
  const controle = getControleCTQById(reserve.controleId);
  const technicien = reserve.technicienAssigneId ? getTechnicienById(reserve.technicienAssigneId) : undefined;

  return {
    id: reserve.id,
    numero: reserve.numero,
    controleId: reserve.controleId,
    controleNumero: controle?.numero ?? reserve.controleId,
    appareilId: reserve.appareilId,
    appareilCode: ascenseur?.code ?? reserve.appareilId,
    clientId: reserve.clientId,
    clientNom: client?.raisonSociale ?? '—',
    libelleBloc: libelleBlocReserve(reserve.libelleBloc),
    description: reserve.description,
    actionDemandee: reserve.actionDemandee,
    gravite: reserve.gravite,
    statut: reserve.statut,
    dateConstat: reserve.dateConstat,
    dateEcheance: reserve.dateEcheance,
    enRetard: estReserveEnRetard(reserve, maintenant),
    technicienId: reserve.technicienAssigneId,
    technicienNom: technicien?.nomComplet,
  };
}

/** Toutes les lignes de la liste des réserves CTQ, plus récentes en premier. Mis en cache pour la durée de la requête. */
export const getLignesReservesCTQ = cache((): LigneReserveCTQListe[] => {
  const maintenant = new Date();
  return getAllReservesCTQ()
    .map((reserve) => construireLigne(reserve, maintenant))
    .sort((a, b) => new Date(b.dateConstat).getTime() - new Date(a.dateConstat).getTime());
});

export function filtrerLignesReservesCTQ(lignes: LigneReserveCTQListe[], filtres: FiltresReservesCTQUI): LigneReserveCTQListe[] {
  return lignes.filter((ligne) => {
    if (filtres.statut && ligne.statut !== filtres.statut) return false;
    if (filtres.gravite && ligne.gravite !== filtres.gravite) return false;
    if (filtres.clientId && ligne.clientId !== filtres.clientId) return false;
    if (filtres.technicienId && ligne.technicienId !== filtres.technicienId) return false;
    if (filtres.enRetard && !ligne.enRetard) return false;
    return true;
  });
}
