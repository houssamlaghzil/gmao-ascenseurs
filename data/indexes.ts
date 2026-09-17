/**
 * Magasin d'index — structures de recherche rapides construites depuis les
 * tableaux bruts que possède data/store.ts.
 *
 * Le problème qu'il résout : aujourd'hui, chaque `getXById`/`getXByY` de
 * store.ts fait un `.find()`/`.filter()` linéaire — même une lecture par
 * identifiant rescanne tout le tableau. Une seule page (`/`) appelle
 * `getAllInterventions()` de façon indépendante dans huit fonctions
 * différentes de `lib/derived/dashboard.ts`, chacune refaisant son propre
 * passage complet sur les 4 050 lignes. Mesuré en production (hébergement
 * mutualisé, forte contention CPU) : plusieurs secondes de temps de réponse
 * pour une page qui ne prend qu'~1 s sur une machine de développement
 * inactive.
 *
 * Plutôt que de cacher le RÉSULTAT de tel ou tel écran — ce qui imposerait
 * une entrée de cache par combinaison écran/filtre, une cardinalité qui
 * explose — on indexe les DONNÉES BRUTES une seule fois : les lectures par
 * identifiant et les regroupements par clé étrangère deviennent des accès
 * O(1) à une Map, partout, sans que le code appelant change. Couverture
 * volontairement large (toutes les entités possédant un `getXById` ou un
 * `getXByY` dans store.ts) : c'est le magasin lui-même qui sert l'ensemble
 * des écrans, donc l'indexer partiellement laisserait la moitié de
 * l'application aussi lente qu'avant.
 *
 * Ce module ne connaît AUCUN état et ignore QUAND reconstruire — cette
 * responsabilité (compteur de version, invalidation à la mutation) reste
 * entièrement dans data/store.ts, seul propriétaire des tableaux mutables.
 * Les fonctions ci-dessous sont pures : mêmes tableaux en entrée, mêmes
 * index en sortie, à chaque appel — donc triviales à tester isolément.
 *
 * Exclus délibérément : les fonctions d'agrégat (getStatistiquesParc,
 * getRiskScoreForAscenseur, getRapportsAgregatGlobal, getCompteurRapports-
 * ParAppareil, getHistoriqueMaintenanceParAscenseurId...) et le prédicat
 * ad hoc getTicketsNonRapproches sauf lorsqu'il se ramène à un regroupement
 * par statut déjà indexé — ce ne sont pas des lectures par identifiant ou
 * par clé étrangère mais des calculs, hors périmètre de cette fondation.
 */

import type {
  SecteurGeographique,
  Technicien,
  Tournee,
  Client,
  Contrat,
  ParcAscenseurs,
  Ascenseur,
  EntreeJournalModification,
  Utilisateur,
  RoleUtilisateur,
  TypeMaintenanceRef,
  Maintenance,
  Intervention,
  StatutIntervention,
  Ticket,
  StatutTicket,
  Reaffectation,
  TypeCiblePlanning,
  AbsenceTechnicien,
  PhotoRapport,
  Rapport,
  BureauEtudes,
  ControleCTQ,
  ReserveCTQ,
  EvenementReserve,
  IntegrationExterne,
  JournalEchangeIntegration,
  SessionTechnicien,
  ElementFileSynchronisation,
  AppareilTelechargeLocalement,
  EtatPTITechnicien,
  PositionTechnicien,
  ZoneGeographique,
  TourneeDuJour,
  TacheAsynchrone,
  Notification,
  EntreeAudit,
} from '@/domain/types';

/** Regroupe `items` par la clé renvoyée par `cle`. Les clés `undefined` (pas de rattachement) sont ignorées. */
function grouper<T, K>(items: T[], cle: (item: T) => K | undefined): Map<K, T[]> {
  const carte = new Map<K, T[]>();
  for (const item of items) {
    const k = cle(item);
    if (k === undefined) continue;
    const liste = carte.get(k);
    if (liste) liste.push(item);
    else carte.set(k, [item]);
  }
  return carte;
}

/**
 * Regroupe `items` par les PLUSIEURS clés renvoyées par `cles` — pour les
 * relations n-n (ex. un contrat couvre plusieurs parcs via `parcIds`), où un
 * même élément doit apparaître dans plusieurs groupes.
 */
function grouperMulti<T, K>(items: T[], cles: (item: T) => K[]): Map<K, T[]> {
  const carte = new Map<K, T[]>();
  for (const item of items) {
    for (const k of cles(item)) {
      const liste = carte.get(k);
      if (liste) liste.push(item);
      else carte.set(k, [item]);
    }
  }
  return carte;
}

/** Index par identifiant : une entrée par élément de `items`. */
function indexerParId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export interface IndexAscenseurs {
  byId: Map<string, Ascenseur>;
  byCode: Map<string, Ascenseur>;
  byParcId: Map<string, Ascenseur[]>;
  byClientId: Map<string, Ascenseur[]>;
  byContratId: Map<string, Ascenseur[]>;
  byTechnicienId: Map<string, Ascenseur[]>;
  byTourneeId: Map<string, Ascenseur[]>;
}

export interface IndexTournees {
  byId: Map<string, Tournee>;
  byTechnicienId: Map<string, Tournee[]>;
  bySecteurId: Map<string, Tournee[]>;
}

export interface IndexContrats {
  byId: Map<string, Contrat>;
  byClientId: Map<string, Contrat[]>;
  /** n-n : un contrat référence plusieurs parcs via `parcIds`. */
  byParcId: Map<string, Contrat[]>;
}

export interface IndexParcs {
  byId: Map<string, ParcAscenseurs>;
  byClientId: Map<string, ParcAscenseurs[]>;
  bySecteurId: Map<string, ParcAscenseurs[]>;
}

export interface IndexInterventions {
  byId: Map<string, Intervention>;
  byNumero: Map<string, Intervention>;
  byAscenseurId: Map<string, Intervention[]>;
  byTechnicienId: Map<string, Intervention[]>;
  byContratId: Map<string, Intervention[]>;
  byStatut: Map<StatutIntervention, Intervention[]>;
}

export interface IndexTickets {
  byId: Map<string, Ticket>;
  byInterventionId: Map<string, Ticket[]>;
  byAscenseurId: Map<string, Ticket[]>;
  byStatut: Map<StatutTicket, Ticket[]>;
}

export interface IndexRapports {
  byId: Map<string, Rapport>;
  byInterventionId: Map<string, Rapport[]>;
  byMaintenanceId: Map<string, Rapport[]>;
  byAscenseurId: Map<string, Rapport[]>;
  byTechnicienId: Map<string, Rapport[]>;
}

export interface IndexPhotosRapport {
  byId: Map<string, PhotoRapport>;
  byRapportId: Map<string, PhotoRapport[]>;
  byReserveId: Map<string, PhotoRapport[]>;
}

export interface IndexMaintenances {
  byId: Map<string, Maintenance>;
  byAscenseurId: Map<string, Maintenance[]>;
  byTechnicienId: Map<string, Maintenance[]>;
  byTourneeId: Map<string, Maintenance[]>;
  byContratId: Map<string, Maintenance[]>;
}

export interface IndexControlesCTQ {
  byId: Map<string, ControleCTQ>;
  byAppareilId: Map<string, ControleCTQ[]>;
  byClientId: Map<string, ControleCTQ[]>;
}

export interface IndexReservesCTQ {
  byId: Map<string, ReserveCTQ>;
  byControleId: Map<string, ReserveCTQ[]>;
  byAppareilId: Map<string, ReserveCTQ[]>;
  byTechnicienId: Map<string, ReserveCTQ[]>;
}

export interface IndexUtilisateurs {
  byId: Map<string, Utilisateur>;
  byEmail: Map<string, Utilisateur>;
  byTechnicienId: Map<string, Utilisateur>;
  byRole: Map<RoleUtilisateur, Utilisateur[]>;
  byClientId: Map<string, Utilisateur[]>;
}

export interface IndexSessionsTechnicien {
  byId: Map<string, SessionTechnicien>;
  byTechnicienId: Map<string, SessionTechnicien[]>;
}

export interface IndexElementsFileSynchronisation {
  byId: Map<string, ElementFileSynchronisation>;
  byTechnicienId: Map<string, ElementFileSynchronisation[]>;
}

export interface IndexTachesAsynchrones {
  byId: Map<string, TacheAsynchrone>;
  byUtilisateurId: Map<string, TacheAsynchrone[]>;
}

export interface IndexNotifications {
  byId: Map<string, Notification>;
  byUtilisateurId: Map<string, Notification[]>;
  byRole: Map<RoleUtilisateur, Notification[]>;
}

export interface Indexes {
  secteursGeographiques: { byId: Map<string, SecteurGeographique> };
  techniciens: { byId: Map<string, Technicien> };
  tournees: IndexTournees;
  clients: { byId: Map<string, Client> };
  contrats: IndexContrats;
  parcs: IndexParcs;
  ascenseurs: IndexAscenseurs;
  entreesJournalModification: { byAscenseurId: Map<string, EntreeJournalModification[]> };
  interventions: IndexInterventions;
  tickets: IndexTickets;
  /** Clé composite `${cibleType}:${cibleId}` — une réaffectation vise un couple (type, id), pas un id seul. */
  reaffectations: { byCible: Map<string, Reaffectation[]> };
  rapports: IndexRapports;
  photosRapport: IndexPhotosRapport;
  maintenances: IndexMaintenances;
  typesMaintenanceRef: { byId: Map<string, TypeMaintenanceRef> };
  absencesTechnicien: { byTechnicienId: Map<string, AbsenceTechnicien[]> };
  bureauxEtudes: { byId: Map<string, BureauEtudes> };
  controlesCTQ: IndexControlesCTQ;
  reservesCTQ: IndexReservesCTQ;
  evenementsReserve: { byReserveId: Map<string, EvenementReserve[]> };
  utilisateurs: IndexUtilisateurs;
  integrationsExternes: { byId: Map<string, IntegrationExterne> };
  journalEchangesIntegration: { byIntegrationId: Map<string, JournalEchangeIntegration[]> };
  sessionsTechnicien: IndexSessionsTechnicien;
  elementsFileSynchronisation: IndexElementsFileSynchronisation;
  appareilsTelechargesLocalement: { byTechnicienId: Map<string, AppareilTelechargeLocalement[]> };
  etatsPTITechnicien: { byTechnicienId: Map<string, EtatPTITechnicien> };
  positionsTechnicien: { byTechnicienId: Map<string, PositionTechnicien> };
  zonesGeographiques: { byId: Map<string, ZoneGeographique> };
  tourneesDuJour: { byTechnicienId: Map<string, TourneeDuJour> };
  tachesAsynchrones: IndexTachesAsynchrones;
  notifications: IndexNotifications;
  entreesAudit: { byEntiteId: Map<string, EntreeAudit[]> };
}

/** Tableaux sources — exactement ceux détenus aujourd'hui par data/store.ts. */
export interface DonneesSources {
  secteursGeographiques: SecteurGeographique[];
  techniciens: Technicien[];
  tournees: Tournee[];
  clients: Client[];
  contrats: Contrat[];
  parcs: ParcAscenseurs[];
  ascenseurs: Ascenseur[];
  entreesJournalModification: EntreeJournalModification[];
  interventions: Intervention[];
  tickets: Ticket[];
  reaffectations: Reaffectation[];
  rapports: Rapport[];
  photosRapport: PhotoRapport[];
  maintenances: Maintenance[];
  typesMaintenanceRef: TypeMaintenanceRef[];
  absencesTechnicien: AbsenceTechnicien[];
  bureauxEtudes: BureauEtudes[];
  controlesCTQ: ControleCTQ[];
  reservesCTQ: ReserveCTQ[];
  evenementsReserve: EvenementReserve[];
  utilisateurs: Utilisateur[];
  integrationsExternes: IntegrationExterne[];
  journalEchangesIntegration: JournalEchangeIntegration[];
  sessionsTechnicien: SessionTechnicien[];
  elementsFileSynchronisation: ElementFileSynchronisation[];
  appareilsTelechargesLocalement: AppareilTelechargeLocalement[];
  etatsPTITechnicien: EtatPTITechnicien[];
  positionsTechnicien: PositionTechnicien[];
  zonesGeographiques: ZoneGeographique[];
  tourneesDuJour: TourneeDuJour[];
  tachesAsynchrones: TacheAsynchrone[];
  notifications: Notification[];
  entreesAudit: EntreeAudit[];
}

/** Construit une Map 1-1 clé→élément à partir d'un champ scalaire (jamais tableau) et jamais dupliqué. */
function indexerParChamp<T, V>(items: T[], champ: (item: T) => V | undefined): Map<V, T> {
  const carte = new Map<V, T>();
  for (const item of items) {
    const v = champ(item);
    if (v === undefined) continue;
    carte.set(v, item);
  }
  return carte;
}

/** Clé composite pour `Reaffectation` : le couple (cibleType, cibleId) identifie la cible, pas cibleId seul. */
function cleCible(cibleType: TypeCiblePlanning, cibleId: string): string {
  return `${cibleType}:${cibleId}`;
}

/**
 * Construit l'ensemble des index depuis les tableaux sources.
 *
 * O(n) au total (une seule passe par tableau, quel que soit le nombre
 * d'index qui en dérivent) — à comparer aux dizaines de passages
 * indépendants qu'effectuent aujourd'hui les fonctions `getXByY` de
 * store.ts et les agrégats de lib/derived/dashboard.ts.
 */
export function construireIndexes(donnees: DonneesSources): Indexes {
  return {
    secteursGeographiques: { byId: indexerParId(donnees.secteursGeographiques) },
    techniciens: { byId: indexerParId(donnees.techniciens) },
    tournees: {
      byId: indexerParId(donnees.tournees),
      byTechnicienId: grouper(donnees.tournees, (t) => t.technicienTitulaireId),
      bySecteurId: grouper(donnees.tournees, (t) => t.secteurId),
    },
    clients: { byId: indexerParId(donnees.clients) },
    contrats: {
      byId: indexerParId(donnees.contrats),
      byClientId: grouper(donnees.contrats, (c) => c.clientId),
      byParcId: grouperMulti(donnees.contrats, (c) => c.parcIds),
    },
    parcs: {
      byId: indexerParId(donnees.parcs),
      byClientId: grouper(donnees.parcs, (p) => p.clientId),
      bySecteurId: grouper(donnees.parcs, (p) => p.secteurId),
    },
    ascenseurs: {
      byId: indexerParId(donnees.ascenseurs),
      byCode: indexerParChamp(donnees.ascenseurs, (a) => a.code),
      byParcId: grouper(donnees.ascenseurs, (a) => a.parcId),
      byClientId: grouper(donnees.ascenseurs, (a) => a.clientId),
      // `contratId` est une chaîne dénormalisée jamais `undefined`, mais peut
      // être vide (site sans contrat actif) : on l'exclut du regroupement,
      // sinon toutes ces fiches se retrouveraient rattachées à la clé ''.
      byContratId: grouper(donnees.ascenseurs, (a) => a.contratId || undefined),
      byTechnicienId: grouper(donnees.ascenseurs, (a) => a.technicienAffecteId),
      byTourneeId: grouper(donnees.ascenseurs, (a) => a.tourneeId),
    },
    entreesJournalModification: {
      byAscenseurId: grouper(donnees.entreesJournalModification, (e) => e.ascenseurId),
    },
    interventions: {
      byId: indexerParId(donnees.interventions),
      byNumero: indexerParChamp(donnees.interventions, (i) => i.numero),
      byAscenseurId: grouper(donnees.interventions, (i) => i.ascenseurId),
      byTechnicienId: grouper(donnees.interventions, (i) => i.technicienId),
      byContratId: grouper(donnees.interventions, (i) => i.contratId),
      byStatut: grouper(donnees.interventions, (i) => i.statut),
    },
    tickets: {
      byId: indexerParId(donnees.tickets),
      byInterventionId: grouper(donnees.tickets, (t) => t.interventionId),
      byAscenseurId: grouper(donnees.tickets, (t) => t.ascenseurId),
      byStatut: grouper(donnees.tickets, (t) => t.statut),
    },
    reaffectations: {
      byCible: grouper(donnees.reaffectations, (r) => cleCible(r.cibleType, r.cibleId)),
    },
    rapports: {
      byId: indexerParId(donnees.rapports),
      byInterventionId: grouper(donnees.rapports, (r) => r.interventionId),
      byMaintenanceId: grouper(donnees.rapports, (r) => r.maintenanceId),
      byAscenseurId: grouper(donnees.rapports, (r) => r.ascenseurId),
      byTechnicienId: grouper(donnees.rapports, (r) => r.technicienId),
    },
    photosRapport: {
      byId: indexerParId(donnees.photosRapport),
      byRapportId: grouper(donnees.photosRapport, (p) => p.rapportId),
      byReserveId: grouper(donnees.photosRapport, (p) => p.reserveCtqId),
    },
    maintenances: {
      byId: indexerParId(donnees.maintenances),
      byAscenseurId: grouper(donnees.maintenances, (m) => m.ascenseurId),
      byTechnicienId: grouper(donnees.maintenances, (m) => m.technicienId),
      byTourneeId: grouper(donnees.maintenances, (m) => m.tourneeId),
      byContratId: grouper(donnees.maintenances, (m) => m.contratId),
    },
    typesMaintenanceRef: { byId: indexerParId(donnees.typesMaintenanceRef) },
    absencesTechnicien: {
      byTechnicienId: grouper(donnees.absencesTechnicien, (a) => a.technicienId),
    },
    bureauxEtudes: { byId: indexerParId(donnees.bureauxEtudes) },
    controlesCTQ: {
      byId: indexerParId(donnees.controlesCTQ),
      byAppareilId: grouper(donnees.controlesCTQ, (c) => c.appareilId),
      byClientId: grouper(donnees.controlesCTQ, (c) => c.clientId),
    },
    reservesCTQ: {
      byId: indexerParId(donnees.reservesCTQ),
      byControleId: grouper(donnees.reservesCTQ, (r) => r.controleId),
      // ⚠️ Le champ s'appelle `appareilId` sur ReserveCTQ, pas `ascenseurId`.
      byAppareilId: grouper(donnees.reservesCTQ, (r) => r.appareilId),
      byTechnicienId: grouper(donnees.reservesCTQ, (r) => r.technicienAssigneId),
    },
    evenementsReserve: {
      byReserveId: grouper(donnees.evenementsReserve, (e) => e.reserveId),
    },
    utilisateurs: {
      byId: indexerParId(donnees.utilisateurs),
      byEmail: indexerParChamp(donnees.utilisateurs, (u) => u.email),
      byTechnicienId: indexerParChamp(donnees.utilisateurs, (u) => u.technicienId),
      byRole: grouper(donnees.utilisateurs, (u) => u.role),
      byClientId: grouper(donnees.utilisateurs, (u) => u.clientId),
    },
    integrationsExternes: { byId: indexerParId(donnees.integrationsExternes) },
    journalEchangesIntegration: {
      byIntegrationId: grouper(donnees.journalEchangesIntegration, (j) => j.integrationId),
    },
    sessionsTechnicien: {
      byId: indexerParId(donnees.sessionsTechnicien),
      byTechnicienId: grouper(donnees.sessionsTechnicien, (s) => s.technicienId),
    },
    elementsFileSynchronisation: {
      byId: indexerParId(donnees.elementsFileSynchronisation),
      byTechnicienId: grouper(donnees.elementsFileSynchronisation, (e) => e.technicienId),
    },
    appareilsTelechargesLocalement: {
      byTechnicienId: grouper(donnees.appareilsTelechargesLocalement, (a) => a.technicienId),
    },
    etatsPTITechnicien: {
      byTechnicienId: indexerParChamp(donnees.etatsPTITechnicien, (e) => e.technicienId),
    },
    positionsTechnicien: {
      byTechnicienId: indexerParChamp(donnees.positionsTechnicien, (p) => p.technicienId),
    },
    zonesGeographiques: { byId: indexerParId(donnees.zonesGeographiques) },
    tourneesDuJour: {
      byTechnicienId: indexerParChamp(donnees.tourneesDuJour, (t) => t.technicienId),
    },
    tachesAsynchrones: {
      byId: indexerParId(donnees.tachesAsynchrones),
      byUtilisateurId: grouper(donnees.tachesAsynchrones, (t) => t.demandeParUtilisateurId),
    },
    notifications: {
      byId: indexerParId(donnees.notifications),
      byUtilisateurId: grouper(donnees.notifications, (n) => n.destinataireUtilisateurId),
      byRole: grouper(donnees.notifications, (n) => n.destinataireRole),
    },
    entreesAudit: {
      byEntiteId: grouper(donnees.entreesAudit, (e) => e.entiteId),
    },
  };
}
