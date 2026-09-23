/**
 * Store en mémoire — couche d'accès aux données mockées Manei-Lift
 *
 * Toutes les mutations sont appliquées ici, sur des copies mutables des
 * tableaux générés par data/mockData.ts. Le socle reste volontairement un
 * accès de données brut (getAllX / getXById / getXParY...) : les agrégations
 * spécifiques à chaque écran seront ajoutées au fur et à mesure de la
 * construction des écrans. Seuls les agrégats explicitement demandés par la
 * stratégie de génération (agrégat global des rapports, compteurs par
 * appareil, risque de panne, statistiques de parc...) vivent ici, car ils
 * font partie du modèle de données lui-même.
 *
 * Les types calculés listés dans la section 9 de la stratégie
 * (LigneListeAppareil, EtatSLACalcule, MaintenanceAvecUrgence,
 * MissionCTQ, RapportPdfApercu...) ne sont PAS matérialisés : ils seront
 * calculés à la lecture par les futurs écrans, à partir des fonctions
 * d'accès ci-dessous.
 */

import {
  // Domaine
  SecteurGeographique,
  Technicien,
  Tournee,
  DefinitionSLA,
  Client,
  ResponsableClient,
  Contrat,
  ParcAscenseurs,
  Ascenseur,
  EntreeJournalModification,
  Utilisateur,
  TypeMaintenanceRef,
  CausePanneRef,
  Maintenance,
  Intervention,
  Ticket,
  Reaffectation,
  TypeCiblePlanning,
  AbsenceTechnicien,
  EquipementReferentiel,
  EtatEquipementReferentiel,
  ActionDiagnosticReferentiel,
  RegleObligationPhotos,
  StatutTicket,
  PhotoRapport,
  Rapport,
  RapportsAgregatGlobal,
  BureauEtudes,
  ControleCTQ,
  ReserveCTQ,
  EvenementReserve,
  SessionTechnicien,
  ElementFileSynchronisation,
  AppareilTelechargeLocalement,
  ConfigurationPTI,
  EtatPTITechnicien,
  PositionTechnicien,
  ZoneGeographique,
  TourneeDuJour,
  TacheAsynchrone,
  StatutTacheAsynchrone,
  Notification,
  EntreeAudit,
  IntegrationExterne,
  JournalEchangeIntegration,
  RoleDefinition,
  RegleMetier,
  ConfigurationNotification,
  RoleUtilisateur,
  StatistiquesParc,
  RiskScore,
  EtapeIntervention,
  TypeEtapeIntervention,
  OrigineAction,
  StatutIntervention,
  StatutValidationRapport,
  StatutAppareil,
} from '@/domain/types';
import { revalidatePath } from 'next/cache';
import { computeFullRiskScore } from '@/domain/risk-scoring';
import {
  secteursGeographiques as initialSecteursGeographiques,
  techniciens as initialTechniciens,
  tournees as initialTournees,
  definitionsSLA as initialDefinitionsSLA,
  clients as initialClients,
  contrats as initialContrats,
  parcs as initialParcs,
  ascenseurs as initialAscenseurs,
  entreesJournalModification as initialEntreesJournalModification,
  utilisateurs as initialUtilisateurs,
  typesMaintenanceRef as initialTypesMaintenanceRef,
  causesPanneRef as initialCausesPanneRef,
  historiqueMaintenanceParAscenseur as initialHistoriqueMaintenance,
  maintenances as initialMaintenances,
  interventions as initialInterventions,
  tickets as initialTickets,
  reaffectations as initialReaffectations,
  absencesTechnicien as initialAbsencesTechnicien,
  equipementsReferentiel as initialEquipementsReferentiel,
  etatsEquipementReferentiel as initialEtatsEquipementReferentiel,
  actionsDiagnosticReferentiel as initialActionsDiagnosticReferentiel,
  reglesObligationPhotos as initialReglesObligationPhotos,
  photosRapport as initialPhotosRapport,
  rapports as initialRapports,
  rapportsAgregatGlobal as initialRapportsAgregatGlobal,
  compteursRapportsParAppareil as initialCompteursRapportsParAppareil,
  genererRapportSynthetiqueMisEnCache,
  bureauxEtudes as initialBureauxEtudes,
  controlesCTQ as initialControlesCTQ,
  reservesCTQ as initialReservesCTQ,
  evenementsReserve as initialEvenementsReserve,
  sessionsTechnicien as initialSessionsTechnicien,
  elementsFileSynchronisation as initialElementsFileSynchronisation,
  appareilsTelechargesLocalement as initialAppareilsTelechargesLocalement,
  configurationsPTI as initialConfigurationsPTI,
  etatsPTITechnicien as initialEtatsPTITechnicien,
  positionsTechnicien as initialPositionsTechnicien,
  zonesGeographiques as initialZonesGeographiques,
  tourneesDuJour as initialTourneesDuJour,
  tachesAsynchrones as initialTachesAsynchrones,
  dureesEstimeesTachesAsynchrones,
  notifications as initialNotifications,
  entreesAudit as initialEntreesAudit,
  integrationsExternes as initialIntegrationsExternes,
  journalEchangesIntegration as initialJournalEchangesIntegration,
  rolesDefinitions as initialRolesDefinitions,
  reglesMetier as initialReglesMetier,
  configurationsNotification as initialConfigurationsNotification,
  type HistoriqueMaintenanceAgregat,
  type CompteurRapportsAppareil,
} from './mockData';
import { construireIndexes, type Indexes } from './indexes';

export type { HistoriqueMaintenanceAgregat, CompteurRapportsAppareil };

// ============================================================================
// ÉTAT EN MÉMOIRE (réinitialisé à chaque redémarrage du serveur)
// ============================================================================

let secteursGeographiques: SecteurGeographique[] = [...initialSecteursGeographiques];
let techniciens: Technicien[] = [...initialTechniciens];
let tournees: Tournee[] = [...initialTournees];
let definitionsSLA: DefinitionSLA[] = [...initialDefinitionsSLA];
let clients: Client[] = [...initialClients];
let contrats: Contrat[] = [...initialContrats];
let parcs: ParcAscenseurs[] = [...initialParcs];
let ascenseurs: Ascenseur[] = [...initialAscenseurs];
let entreesJournalModification: EntreeJournalModification[] = [...initialEntreesJournalModification];
let utilisateurs: Utilisateur[] = [...initialUtilisateurs];
let typesMaintenanceRef: TypeMaintenanceRef[] = [...initialTypesMaintenanceRef];
let causesPanneRef: CausePanneRef[] = [...initialCausesPanneRef];
const historiqueMaintenanceParAscenseur: HistoriqueMaintenanceAgregat[] = [...initialHistoriqueMaintenance];
let maintenances: Maintenance[] = [...initialMaintenances];
let interventions: Intervention[] = [...initialInterventions];
let tickets: Ticket[] = [...initialTickets];
let reaffectations: Reaffectation[] = [...initialReaffectations];
let absencesTechnicien: AbsenceTechnicien[] = [...initialAbsencesTechnicien];
const equipementsReferentiel: EquipementReferentiel[] = [...initialEquipementsReferentiel];
const etatsEquipementReferentiel: EtatEquipementReferentiel[] = [...initialEtatsEquipementReferentiel];
const actionsDiagnosticReferentiel: ActionDiagnosticReferentiel[] = [...initialActionsDiagnosticReferentiel];
const reglesObligationPhotos: RegleObligationPhotos[] = [...initialReglesObligationPhotos];
let photosRapport: PhotoRapport[] = [...initialPhotosRapport];
let rapports: Rapport[] = [...initialRapports];
const rapportsAgregatGlobal: RapportsAgregatGlobal = { ...initialRapportsAgregatGlobal };
const compteursRapportsParAppareil: CompteurRapportsAppareil[] = [...initialCompteursRapportsParAppareil];
let bureauxEtudes: BureauEtudes[] = [...initialBureauxEtudes];
let controlesCTQ: ControleCTQ[] = [...initialControlesCTQ];
let reservesCTQ: ReserveCTQ[] = [...initialReservesCTQ];
let evenementsReserve: EvenementReserve[] = [...initialEvenementsReserve];
let sessionsTechnicien: SessionTechnicien[] = [...initialSessionsTechnicien];
let elementsFileSynchronisation: ElementFileSynchronisation[] = [...initialElementsFileSynchronisation];
let appareilsTelechargesLocalement: AppareilTelechargeLocalement[] = [...initialAppareilsTelechargesLocalement];
const configurationsPTI: Record<string, ConfigurationPTI> = { ...initialConfigurationsPTI };
let etatsPTITechnicien: EtatPTITechnicien[] = [...initialEtatsPTITechnicien];
let positionsTechnicien: PositionTechnicien[] = [...initialPositionsTechnicien];
let zonesGeographiques: ZoneGeographique[] = [...initialZonesGeographiques];
let tourneesDuJour: TourneeDuJour[] = [...initialTourneesDuJour];
let tachesAsynchrones: TacheAsynchrone[] = [...initialTachesAsynchrones];
let notifications: Notification[] = [...initialNotifications];
let entreesAudit: EntreeAudit[] = [...initialEntreesAudit];
let integrationsExternes: IntegrationExterne[] = [...initialIntegrationsExternes];
let journalEchangesIntegration: JournalEchangeIntegration[] = [...initialJournalEchangesIntegration];
const rolesDefinitions: RoleDefinition[] = [...initialRolesDefinitions];
const reglesMetier: RegleMetier[] = [...initialReglesMetier];
const configurationsNotification: ConfigurationNotification[] = [...initialConfigurationsNotification];

// ============================================================================
// CACHE D'INDEX — reconstruit paresseusement, invalidé à chaque mutation
// ============================================================================
//
// Les tableaux ci-dessus restent la source de vérité mutable. `obtenirIndexes()`
// construit (une seule fois, en O(n), et uniquement à la demande) l'ensemble
// des Map de recherche définies par data/indexes.ts, et les met en cache tant
// qu'aucun mutateur n'a incrémenté `versionIndexes`. Voir data/indexes.ts pour
// le contrat complet (structure des Map, cas particuliers n-n et clé composite).

let indexesConstruits: Indexes | null = null;
let versionIndexes = 0;
let versionIndexesConstruits = -1;

/** Version courante des données — s'incrémente à chaque mutation. Sert de clé au cache de calcul entre requêtes (lib/derived/cache-calcul.ts). */
export function getVersionDonnees(): number {
  return versionIndexes;
}

function invaliderIndexes(): void {
  versionIndexes++;
  try {
    revalidatePath('/', 'layout');
  } catch {
    // Hors contexte de requête Next.js (tests, scripts, build) : la
    // revalidation du cache de rendu ne s'applique pas, seul le compteur de
    // version compte alors — voir le cache de calcul (lib/derived/cache-calcul.ts).
  }
}

function obtenirIndexes(): Indexes {
  if (indexesConstruits === null || versionIndexesConstruits !== versionIndexes) {
    indexesConstruits = construireIndexes({
      secteursGeographiques,
      techniciens,
      tournees,
      clients,
      contrats,
      parcs,
      ascenseurs,
      entreesJournalModification,
      interventions,
      tickets,
      reaffectations,
      rapports,
      photosRapport,
      maintenances,
      typesMaintenanceRef,
      absencesTechnicien,
      bureauxEtudes,
      controlesCTQ,
      reservesCTQ,
      evenementsReserve,
      utilisateurs,
      integrationsExternes,
      journalEchangesIntegration,
      sessionsTechnicien,
      elementsFileSynchronisation,
      appareilsTelechargesLocalement,
      etatsPTITechnicien,
      positionsTechnicien,
      zonesGeographiques,
      tourneesDuJour,
      tachesAsynchrones,
      notifications,
      entreesAudit,
    });
    versionIndexesConstruits = versionIndexes;
  }
  return indexesConstruits;
}

// ============================================================================
// HORLOGE DE DÉMONSTRATION
// ============================================================================
//
// Heure "actuelle" de la démonstration — seam unique utilisé par tous les
// calculs dérivés qui dépendent de l'heure courante (retards, SLA, urgences,
// score de risque). Vaut l'heure réelle aujourd'hui ; conservé comme fonction
// (et non un accès direct à `Date`) pour qu'une future figure du temps de
// démonstration n'ait qu'un seul endroit à modifier plutôt que les ~15 points
// de lecture qui en dépendent (voir
// docs/superpowers/plans/2026-09-23-manelift-fondations-demo.md).

export function getDateDemo(): Date {
  return new Date();
}

// ============================================================================
// 1. APPAREILS & PARC
// ============================================================================

export function getAllSecteursGeographiques(): SecteurGeographique[] {
  return [...secteursGeographiques];
}
export function getSecteurGeographiqueById(id: string): SecteurGeographique | undefined {
  return obtenirIndexes().secteursGeographiques.byId.get(id);
}

export function getAllTechniciens(): Technicien[] {
  return [...techniciens];
}
export function getTechnicienById(id: string): Technicien | undefined {
  return obtenirIndexes().techniciens.byId.get(id);
}
export function updateTechnicien(technicien: Technicien): void {
  const index = techniciens.findIndex((t) => t.id === technicien.id);
  if (index !== -1) techniciens[index] = technicien;
  invaliderIndexes();
}

export function getAllTournees(): Tournee[] {
  return [...tournees];
}
export function getTourneeById(id: string): Tournee | undefined {
  return obtenirIndexes().tournees.byId.get(id);
}
export function getTourneesByTechnicienId(technicienId: string): Tournee[] {
  return [...(obtenirIndexes().tournees.byTechnicienId.get(technicienId) ?? [])];
}
export function getTourneesBySecteurId(secteurId: string): Tournee[] {
  return [...(obtenirIndexes().tournees.bySecteurId.get(secteurId) ?? [])];
}

export function getAllDefinitionsSLA(): DefinitionSLA[] {
  return [...definitionsSLA];
}
export function getDefinitionsSLAParContrat(contratId?: string): DefinitionSLA[] {
  return definitionsSLA.filter((d) => d.contratId === contratId);
}

export function getAllAscenseurs(): Ascenseur[] {
  return [...ascenseurs];
}
export function getAscenseurById(id: string): Ascenseur | undefined {
  return obtenirIndexes().ascenseurs.byId.get(id);
}
export function getAscenseurByCode(code: string): Ascenseur | undefined {
  return obtenirIndexes().ascenseurs.byCode.get(code);
}
export function getAscenseursByParcId(parcId: string): Ascenseur[] {
  return [...(obtenirIndexes().ascenseurs.byParcId.get(parcId) ?? [])];
}
export function getAscenseursByClientId(clientId: string): Ascenseur[] {
  return [...(obtenirIndexes().ascenseurs.byClientId.get(clientId) ?? [])];
}
export function getAscenseursByContratId(contratId: string): Ascenseur[] {
  return [...(obtenirIndexes().ascenseurs.byContratId.get(contratId) ?? [])];
}
export function getAscenseursByTechnicienId(technicienId: string): Ascenseur[] {
  return [...(obtenirIndexes().ascenseurs.byTechnicienId.get(technicienId) ?? [])];
}
export function getAscenseursByTourneeId(tourneeId: string): Ascenseur[] {
  return [...(obtenirIndexes().ascenseurs.byTourneeId.get(tourneeId) ?? [])];
}
export function addAscenseur(ascenseur: Ascenseur): void {
  ascenseurs.push(ascenseur);
  invaliderIndexes();
}
export function updateAscenseur(ascenseur: Ascenseur): void {
  const index = ascenseurs.findIndex((a) => a.id === ascenseur.id);
  if (index !== -1) ascenseurs[index] = ascenseur;
  invaliderIndexes();
}
export function deleteAscenseur(id: string): void {
  ascenseurs = ascenseurs.filter((a) => a.id !== id);
  invaliderIndexes();
}

export function getAllEntreesJournalModification(): EntreeJournalModification[] {
  return [...entreesJournalModification].sort((a, b) => new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime());
}
export function getEntreesJournalModificationByAscenseurId(ascenseurId: string): EntreeJournalModification[] {
  return [...(obtenirIndexes().entreesJournalModification.byAscenseurId.get(ascenseurId) ?? [])].sort(
    (a, b) => new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime()
  );
}
export function addEntreeJournalModification(entree: EntreeJournalModification): void {
  entreesJournalModification.push(entree);
  invaliderIndexes();
}

// ============================================================================
// 2. CLIENT & CONTRATS
// ============================================================================

export function getAllClients(): Client[] {
  return [...clients];
}
export function getClientById(id: string): Client | undefined {
  return obtenirIndexes().clients.byId.get(id);
}
export function addClient(client: Client): void {
  clients.push(client);
  invaliderIndexes();
}
export function updateClient(client: Client): void {
  const index = clients.findIndex((c) => c.id === client.id);
  if (index !== -1) clients[index] = client;
  invaliderIndexes();
}
export function getResponsablesByClientId(clientId: string): ResponsableClient[] {
  return getClientById(clientId)?.responsables ?? [];
}
export function getResponsableById(clientId: string, responsableId: string): ResponsableClient | undefined {
  return getResponsablesByClientId(clientId).find((r) => r.id === responsableId);
}

export function getAllContrats(): Contrat[] {
  return [...contrats];
}
export function getContratById(id: string): Contrat | undefined {
  return obtenirIndexes().contrats.byId.get(id);
}
export function getContratsByClientId(clientId: string): Contrat[] {
  return [...(obtenirIndexes().contrats.byClientId.get(clientId) ?? [])];
}
export function getContratsByParcId(parcId: string): Contrat[] {
  return [...(obtenirIndexes().contrats.byParcId.get(parcId) ?? [])];
}
export function addContrat(contrat: Contrat): void {
  contrats.push(contrat);
  invaliderIndexes();
}
export function updateContrat(contrat: Contrat): void {
  const index = contrats.findIndex((c) => c.id === contrat.id);
  if (index !== -1) contrats[index] = contrat;
  invaliderIndexes();
}

export function getAllParcs(): ParcAscenseurs[] {
  return [...parcs];
}
export function getParcById(id: string): ParcAscenseurs | undefined {
  return obtenirIndexes().parcs.byId.get(id);
}
export function getParcsByClientId(clientId: string): ParcAscenseurs[] {
  return [...(obtenirIndexes().parcs.byClientId.get(clientId) ?? [])];
}
export function getParcsBySecteurId(secteurId: string): ParcAscenseurs[] {
  return [...(obtenirIndexes().parcs.bySecteurId.get(secteurId) ?? [])];
}
export function addParc(parc: ParcAscenseurs): void {
  parcs.push(parc);
  invaliderIndexes();
}
export function updateParc(parc: ParcAscenseurs): void {
  const index = parcs.findIndex((p) => p.id === parc.id);
  if (index !== -1) parcs[index] = parc;
  invaliderIndexes();
}
export function deleteParc(id: string): void {
  parcs = parcs.filter((p) => p.id !== id);
  ascenseurs = ascenseurs.filter((a) => a.parcId !== id);
  invaliderIndexes();
}

// ============================================================================
// 3. INTERVENTIONS & TICKETS
// ============================================================================

export function getAllInterventions(): Intervention[] {
  return [...interventions];
}
export function getInterventionById(id: string): Intervention | undefined {
  return obtenirIndexes().interventions.byId.get(id);
}
export function getInterventionByNumero(numero: string): Intervention | undefined {
  return obtenirIndexes().interventions.byNumero.get(numero);
}
export function getInterventionsByAscenseurId(ascenseurId: string): Intervention[] {
  return [...(obtenirIndexes().interventions.byAscenseurId.get(ascenseurId) ?? [])];
}
export function getInterventionsByTechnicienId(technicienId: string): Intervention[] {
  return [...(obtenirIndexes().interventions.byTechnicienId.get(technicienId) ?? [])];
}
export function getInterventionsByContratId(contratId: string): Intervention[] {
  return [...(obtenirIndexes().interventions.byContratId.get(contratId) ?? [])];
}
export function getInterventionsByStatut(statut: StatutIntervention): Intervention[] {
  return [...(obtenirIndexes().interventions.byStatut.get(statut) ?? [])];
}
export function addIntervention(intervention: Intervention): void {
  interventions.push(intervention);
  invaliderIndexes();
}
export function updateIntervention(intervention: Intervention): void {
  const index = interventions.findIndex((i) => i.id === intervention.id);
  if (index !== -1) interventions[index] = intervention;
  invaliderIndexes();
}

export function getAllTickets(): Ticket[] {
  return [...tickets];
}
export function getTicketById(id: string): Ticket | undefined {
  return obtenirIndexes().tickets.byId.get(id);
}
export function getTicketsByInterventionId(interventionId: string): Ticket[] {
  return [...(obtenirIndexes().tickets.byInterventionId.get(interventionId) ?? [])].sort(
    (a, b) => (a.ordreDansIntervention ?? 0) - (b.ordreDansIntervention ?? 0)
  );
}
export function getTicketsByAscenseurId(ascenseurId: string): Ticket[] {
  return [...(obtenirIndexes().tickets.byAscenseurId.get(ascenseurId) ?? [])];
}
export function getTicketsNonRapproches(): Ticket[] {
  return [...(obtenirIndexes().tickets.byStatut.get(StatutTicket.NON_RAPPROCHE) ?? [])];
}
export function addTicket(ticket: Ticket): void {
  tickets.push(ticket);
  invaliderIndexes();
}
export function updateTicket(ticket: Ticket): void {
  const index = tickets.findIndex((t) => t.id === ticket.id);
  if (index !== -1) tickets[index] = ticket;
  invaliderIndexes();
}

export function getAllReaffectations(): Reaffectation[] {
  return [...reaffectations];
}
export function getReaffectationsByCible(cibleType: TypeCiblePlanning, cibleId: string): Reaffectation[] {
  const cle = `${cibleType}:${cibleId}`;
  return [...(obtenirIndexes().reaffectations.byCible.get(cle) ?? [])].sort(
    (a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()
  );
}
export function addReaffectation(reaffectation: Reaffectation): void {
  reaffectations.push(reaffectation);
  invaliderIndexes();
}

/**
 * Chronologie d'une intervention (section 8), générée à la demande à partir
 * des horodatages déjà portés par l'Intervention elle-même (dateCreation,
 * dateAffectation, datePriseEnCharge, dateArriveeSite, dateTerminee,
 * dateValidation, dateCloture), enrichie des tickets/réaffectations/rapports
 * liés, et mise en cache. S'arrête au statut courant : ne rejoue jamais une
 * étape que l'intervention n'a pas encore atteinte.
 */
const cacheEtapesIntervention = new Map<string, EtapeIntervention[]>();

export function getEtapesInterventionParId(interventionId: string): EtapeIntervention[] {
  const cache = cacheEtapesIntervention.get(interventionId);
  if (cache) return cache;

  const intervention = getInterventionById(interventionId);
  if (!intervention) return [];

  const ticketsIntervention = getTicketsByInterventionId(interventionId);
  const reaffectationsIntervention = getReaffectationsByCible(TypeCiblePlanning.INTERVENTION, interventionId);
  const rapportsIntervention = rapports
    .filter((r) => r.interventionId === interventionId)
    .sort((a, b) => (a.numeroPassageIntervention ?? 0) - (b.numeroPassageIntervention ?? 0));

  const etapes: EtapeIntervention[] = [];
  let seq = 0;
  const nextId = () => `etape-${interventionId}-${++seq}`;

  const premierTicket = ticketsIntervention[0];
  if (premierTicket) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.SIGNALEMENT_RECU, dateHeure: premierTicket.dateReception, ticketId: premierTicket.id, origine: OrigineAction.SYSTEME });
  }
  etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.INTERVENTION_CREEE, dateHeure: intervention.dateCreation, origine: OrigineAction.SYSTEME });
  for (const ticket of ticketsIntervention.slice(1)) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.TICKET_RATTACHE, dateHeure: ticket.dateRapprochement ?? ticket.dateReception, ticketId: ticket.id, origine: OrigineAction.SYSTEME });
  }

  if (intervention.dateAffectation) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.TECHNICIEN_AFFECTE, dateHeure: intervention.dateAffectation, technicienId: intervention.technicienId, origine: OrigineAction.WEB });
  }
  for (const reaffectation of reaffectationsIntervention) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.REATTRIBUEE, dateHeure: reaffectation.dateHeure, technicienId: reaffectation.nouveauTechnicienId, reaffectationId: reaffectation.id, origine: reaffectation.origine });
  }
  if (intervention.datePriseEnCharge) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.PRISE_EN_CHARGE, dateHeure: intervention.datePriseEnCharge, technicienId: intervention.technicienId, origine: OrigineAction.MOBILE });
  }
  if (intervention.dateArriveeSite) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.ARRIVEE_SUR_SITE, dateHeure: intervention.dateArriveeSite, technicienId: intervention.technicienId, origine: OrigineAction.MOBILE });
    if (intervention.accesRefuse) {
      etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.ACCES_REFUSE, dateHeure: intervention.dateArriveeSite, commentaire: intervention.motifAccesRefuse, origine: OrigineAction.MOBILE });
    } else if (intervention.etatAppareilInitial) {
      etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.ETAT_APPAREIL_CHANGE, dateHeure: intervention.dateArriveeSite, etatAppareil: intervention.etatAppareilInitial, origine: OrigineAction.MOBILE });
    }
  }

  // Rejoue chaque passage de rapport (RAPPORT_AJOUTE, et RAPPORT_REJETE si un passage précédent a été refusé).
  rapportsIntervention.forEach((rapport, idx) => {
    if (idx > 0) {
      const precedent = rapportsIntervention[idx - 1];
      if (precedent.statutValidation === StatutValidationRapport.REFUSE_A_CORRIGER) {
        etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.RAPPORT_REJETE, dateHeure: rapport.dateHeureDebut, commentaire: precedent.commentaireRefus, rapportId: precedent.id, origine: OrigineAction.WEB });
      }
    }
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.RAPPORT_AJOUTE, dateHeure: rapport.dateHeureFin ?? rapport.dateHeureDebut, rapportId: rapport.id, technicienId: rapport.technicienId, origine: OrigineAction.MOBILE });
  });

  if (intervention.dateTerminee) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.TERMINEE, dateHeure: intervention.dateTerminee, origine: OrigineAction.MOBILE });
  }
  if (intervention.statut === StatutIntervention.A_VALIDER || intervention.statut === StatutIntervention.CLOTURE) {
    const dateSoumission = intervention.dateValidation ?? intervention.dateTerminee ?? intervention.dateCreation;
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.COMMENTAIRE, dateHeure: dateSoumission, commentaire: 'Transmise pour validation', origine: OrigineAction.SYSTEME });
  }
  if (intervention.dateValidation) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.VALIDEE, dateHeure: intervention.dateValidation, origine: OrigineAction.WEB });
  }
  if (intervention.dateCloture) {
    etapes.push({ id: nextId(), interventionId, type: TypeEtapeIntervention.CLOTUREE, dateHeure: intervention.dateCloture, origine: OrigineAction.WEB });
  }

  etapes.sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
  cacheEtapesIntervention.set(interventionId, etapes);
  return etapes;
}

// ============================================================================
// 4. RAPPORTS
// ============================================================================

export function getAllRapports(): Rapport[] {
  return [...rapports];
}
export function getRapportById(id: string): Rapport | undefined {
  return obtenirIndexes().rapports.byId.get(id);
}
export function getRapportsByInterventionId(interventionId: string): Rapport[] {
  return [...(obtenirIndexes().rapports.byInterventionId.get(interventionId) ?? [])].sort(
    (a, b) => (a.numeroPassageIntervention ?? 0) - (b.numeroPassageIntervention ?? 0)
  );
}
export function getRapportsByMaintenanceId(maintenanceId: string): Rapport[] {
  return [...(obtenirIndexes().rapports.byMaintenanceId.get(maintenanceId) ?? [])];
}
export function getRapportsByAscenseurId(ascenseurId: string): Rapport[] {
  return [...(obtenirIndexes().rapports.byAscenseurId.get(ascenseurId) ?? [])];
}
export function getRapportsByTechnicienId(technicienId: string): Rapport[] {
  return [...(obtenirIndexes().rapports.byTechnicienId.get(technicienId) ?? [])];
}
export function addRapport(rapport: Rapport): void {
  rapports.push(rapport);
  invaliderIndexes();
}
export function updateRapport(rapport: Rapport): void {
  const index = rapports.findIndex((r) => r.id === rapport.id);
  if (index !== -1) rapports[index] = rapport;
  invaliderIndexes();
}

/** Rapport synthétique paresseux pour la pagination au-delà de l'échantillon curé (mis en cache). */
export function getRapportSynthetique(ascenseurId: string, index: number): Rapport {
  return genererRapportSynthetiqueMisEnCache(ascenseurId, index);
}

export function getAllPhotosRapport(): PhotoRapport[] {
  return [...photosRapport];
}
export function getPhotoRapportById(id: string): PhotoRapport | undefined {
  return obtenirIndexes().photosRapport.byId.get(id);
}
export function getPhotosByRapportId(rapportId: string): PhotoRapport[] {
  return [...(obtenirIndexes().photosRapport.byRapportId.get(rapportId) ?? [])];
}
export function getPhotosByReserveId(reserveCtqId: string): PhotoRapport[] {
  return [...(obtenirIndexes().photosRapport.byReserveId.get(reserveCtqId) ?? [])];
}
export function addPhotoRapport(photo: PhotoRapport): void {
  photosRapport.push(photo);
  invaliderIndexes();
}

/** Agrégat global des rapports (constante de configuration, indépendante de rapports.length). */
export function getRapportsAgregatGlobal(): RapportsAgregatGlobal {
  return { ...rapportsAgregatGlobal };
}

/** Compteurs légers par appareil (pas d'historique complet stocké). */
export function getAllCompteursRapportsParAppareil(): CompteurRapportsAppareil[] {
  return [...compteursRapportsParAppareil];
}
export function getCompteurRapportsParAppareil(ascenseurId: string): CompteurRapportsAppareil | undefined {
  return compteursRapportsParAppareil.find((c) => c.ascenseurId === ascenseurId);
}

export function getEquipementsReferentiel(): EquipementReferentiel[] {
  return [...equipementsReferentiel];
}
export function getEtatsEquipementReferentiel(): EtatEquipementReferentiel[] {
  return [...etatsEquipementReferentiel];
}
export function getActionsDiagnosticReferentiel(): ActionDiagnosticReferentiel[] {
  return [...actionsDiagnosticReferentiel];
}
export function getReglesObligationPhotos(): RegleObligationPhotos[] {
  return [...reglesObligationPhotos];
}

// ============================================================================
// 5. MAINTENANCES & PLANNING
// ============================================================================

export function getAllMaintenances(): Maintenance[] {
  return [...maintenances];
}
export function getMaintenanceById(id: string): Maintenance | undefined {
  return obtenirIndexes().maintenances.byId.get(id);
}
export function getMaintenancesByAscenseurId(ascenseurId: string): Maintenance[] {
  return [...(obtenirIndexes().maintenances.byAscenseurId.get(ascenseurId) ?? [])];
}
export function getMaintenancesByTechnicienId(technicienId: string): Maintenance[] {
  return [...(obtenirIndexes().maintenances.byTechnicienId.get(technicienId) ?? [])];
}
export function getMaintenancesByTourneeId(tourneeId: string): Maintenance[] {
  return [...(obtenirIndexes().maintenances.byTourneeId.get(tourneeId) ?? [])];
}
export function getMaintenancesByContratId(contratId: string): Maintenance[] {
  return [...(obtenirIndexes().maintenances.byContratId.get(contratId) ?? [])];
}
export function addMaintenance(maintenance: Maintenance): void {
  maintenances.push(maintenance);
  invaliderIndexes();
}
export function updateMaintenance(maintenance: Maintenance): void {
  const index = maintenances.findIndex((m) => m.id === maintenance.id);
  if (index !== -1) maintenances[index] = maintenance;
  invaliderIndexes();
}

/** Compteurs agrégés (années précédentes) — jamais d'objets Maintenance historisés individuellement. */
export function getHistoriqueMaintenanceParAscenseurId(ascenseurId: string): HistoriqueMaintenanceAgregat | undefined {
  return historiqueMaintenanceParAscenseur.find((h) => h.ascenseurId === ascenseurId);
}
export function getAllHistoriqueMaintenance(): HistoriqueMaintenanceAgregat[] {
  return [...historiqueMaintenanceParAscenseur];
}

export function getAllTypesMaintenanceRef(): TypeMaintenanceRef[] {
  return [...typesMaintenanceRef];
}
export function getTypeMaintenanceRefById(id: string): TypeMaintenanceRef | undefined {
  return obtenirIndexes().typesMaintenanceRef.byId.get(id);
}
export function getAllCausesPanneRef(): CausePanneRef[] {
  return [...causesPanneRef];
}

export function getAllAbsencesTechnicien(): AbsenceTechnicien[] {
  return [...absencesTechnicien];
}
export function getAbsencesByTechnicienId(technicienId: string): AbsenceTechnicien[] {
  return [...(obtenirIndexes().absencesTechnicien.byTechnicienId.get(technicienId) ?? [])];
}
export function addAbsenceTechnicien(absence: AbsenceTechnicien): void {
  absencesTechnicien.push(absence);
  invaliderIndexes();
}

// ============================================================================
// 6. CTQ & RÉSERVES
// ============================================================================

export function getAllBureauxEtudes(): BureauEtudes[] {
  return [...bureauxEtudes];
}
export function getBureauEtudesById(id: string): BureauEtudes | undefined {
  return obtenirIndexes().bureauxEtudes.byId.get(id);
}

export function getAllControlesCTQ(): ControleCTQ[] {
  return [...controlesCTQ];
}
export function getControleCTQById(id: string): ControleCTQ | undefined {
  return obtenirIndexes().controlesCTQ.byId.get(id);
}
export function getControlesCTQByAppareilId(appareilId: string): ControleCTQ[] {
  return [...(obtenirIndexes().controlesCTQ.byAppareilId.get(appareilId) ?? [])];
}
export function getControlesCTQByClientId(clientId: string): ControleCTQ[] {
  return [...(obtenirIndexes().controlesCTQ.byClientId.get(clientId) ?? [])];
}
export function addControleCTQ(controle: ControleCTQ): void {
  controlesCTQ.push(controle);
  invaliderIndexes();
}
export function updateControleCTQ(controle: ControleCTQ): void {
  const index = controlesCTQ.findIndex((c) => c.id === controle.id);
  if (index !== -1) controlesCTQ[index] = controle;
  invaliderIndexes();
}

export function getAllReservesCTQ(): ReserveCTQ[] {
  return [...reservesCTQ];
}
export function getReserveCTQById(id: string): ReserveCTQ | undefined {
  return obtenirIndexes().reservesCTQ.byId.get(id);
}
export function getReservesCTQByControleId(controleId: string): ReserveCTQ[] {
  return [...(obtenirIndexes().reservesCTQ.byControleId.get(controleId) ?? [])];
}
export function getReservesCTQByAppareilId(appareilId: string): ReserveCTQ[] {
  return [...(obtenirIndexes().reservesCTQ.byAppareilId.get(appareilId) ?? [])];
}
export function getReservesCTQByTechnicienId(technicienId: string): ReserveCTQ[] {
  return [...(obtenirIndexes().reservesCTQ.byTechnicienId.get(technicienId) ?? [])];
}
export function addReserveCTQ(reserve: ReserveCTQ): void {
  reservesCTQ.push(reserve);
  invaliderIndexes();
}
export function updateReserveCTQ(reserve: ReserveCTQ): void {
  const index = reservesCTQ.findIndex((r) => r.id === reserve.id);
  if (index !== -1) reservesCTQ[index] = reserve;
  invaliderIndexes();
}

export function getAllEvenementsReserve(): EvenementReserve[] {
  return [...evenementsReserve];
}
export function getEvenementsByReserveId(reserveId: string): EvenementReserve[] {
  return [...(obtenirIndexes().evenementsReserve.byReserveId.get(reserveId) ?? [])].sort(
    (a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()
  );
}
export function addEvenementReserve(evenement: EvenementReserve): void {
  evenementsReserve.push(evenement);
  invaliderIndexes();
}

// ============================================================================
// 7. INTÉGRATIONS & ADMINISTRATION
// ============================================================================

export function getAllUtilisateurs(): Utilisateur[] {
  return [...utilisateurs];
}
export function getUtilisateurById(id: string): Utilisateur | undefined {
  return obtenirIndexes().utilisateurs.byId.get(id);
}
export function getUtilisateurByEmail(email: string): Utilisateur | undefined {
  return obtenirIndexes().utilisateurs.byEmail.get(email);
}
export function getUtilisateursByRole(role: RoleUtilisateur): Utilisateur[] {
  return [...(obtenirIndexes().utilisateurs.byRole.get(role) ?? [])];
}
export function getUtilisateurByTechnicienId(technicienId: string): Utilisateur | undefined {
  return obtenirIndexes().utilisateurs.byTechnicienId.get(technicienId);
}
export function getUtilisateursByClientId(clientId: string): Utilisateur[] {
  return [...(obtenirIndexes().utilisateurs.byClientId.get(clientId) ?? [])];
}
export function addUtilisateur(utilisateur: Utilisateur): void {
  utilisateurs.push(utilisateur);
  invaliderIndexes();
}
export function updateUtilisateur(utilisateur: Utilisateur): void {
  const index = utilisateurs.findIndex((u) => u.id === utilisateur.id);
  if (index !== -1) utilisateurs[index] = utilisateur;
  invaliderIndexes();
}

export function getAllRolesDefinitions(): RoleDefinition[] {
  return [...rolesDefinitions];
}
export function getRoleDefinition(role: RoleUtilisateur): RoleDefinition | undefined {
  return rolesDefinitions.find((r) => r.role === role);
}

export function getAllReglesMetier(): RegleMetier[] {
  return [...reglesMetier];
}
export function getAllConfigurationsNotification(): ConfigurationNotification[] {
  return [...configurationsNotification];
}

export function getAllIntegrationsExternes(): IntegrationExterne[] {
  return [...integrationsExternes];
}
export function getIntegrationExterneById(id: string): IntegrationExterne | undefined {
  return obtenirIndexes().integrationsExternes.byId.get(id);
}
export function updateIntegrationExterne(integration: IntegrationExterne): void {
  const index = integrationsExternes.findIndex((i) => i.id === integration.id);
  if (index !== -1) integrationsExternes[index] = integration;
  invaliderIndexes();
}

export function getAllJournalEchangesIntegration(): JournalEchangeIntegration[] {
  return [...journalEchangesIntegration];
}
export function getJournalEchangesByIntegrationId(integrationId: string): JournalEchangeIntegration[] {
  return [...(obtenirIndexes().journalEchangesIntegration.byIntegrationId.get(integrationId) ?? [])].sort(
    (a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()
  );
}

// ============================================================================
// 8. MOBILE & SYNCHRONISATION
// ============================================================================

export function getAllSessionsTechnicien(): SessionTechnicien[] {
  return [...sessionsTechnicien];
}
export function getSessionTechnicienById(id: string): SessionTechnicien | undefined {
  return obtenirIndexes().sessionsTechnicien.byId.get(id);
}
export function getSessionActiveDuTechnicien(technicienId: string): SessionTechnicien | undefined {
  return obtenirIndexes().sessionsTechnicien.byTechnicienId.get(technicienId)?.[0];
}
export function addSessionTechnicien(session: SessionTechnicien): void {
  sessionsTechnicien.push(session);
  invaliderIndexes();
}
export function updateSessionTechnicien(session: SessionTechnicien): void {
  const index = sessionsTechnicien.findIndex((s) => s.id === session.id);
  if (index !== -1) sessionsTechnicien[index] = session;
  invaliderIndexes();
}

export function getAllElementsFileSynchronisation(): ElementFileSynchronisation[] {
  return [...elementsFileSynchronisation];
}
export function getElementsFileSynchronisationByTechnicienId(technicienId: string): ElementFileSynchronisation[] {
  return [...(obtenirIndexes().elementsFileSynchronisation.byTechnicienId.get(technicienId) ?? [])].sort(
    (a, b) => new Date(b.horodatageEvenement).getTime() - new Date(a.horodatageEvenement).getTime()
  );
}
export function getElementFileSynchronisationById(id: string): ElementFileSynchronisation | undefined {
  return obtenirIndexes().elementsFileSynchronisation.byId.get(id);
}
export function addElementFileSynchronisation(element: ElementFileSynchronisation): void {
  elementsFileSynchronisation.push(element);
  invaliderIndexes();
}
export function updateElementFileSynchronisation(element: ElementFileSynchronisation): void {
  const index = elementsFileSynchronisation.findIndex((e) => e.id === element.id);
  if (index !== -1) elementsFileSynchronisation[index] = element;
  invaliderIndexes();
}

export function getAppareilsTelechargesByTechnicienId(technicienId: string): AppareilTelechargeLocalement[] {
  return [...(obtenirIndexes().appareilsTelechargesLocalement.byTechnicienId.get(technicienId) ?? [])];
}
export function addAppareilTelechargeLocalement(entree: AppareilTelechargeLocalement): void {
  appareilsTelechargesLocalement.push(entree);
  invaliderIndexes();
}

export function getConfigurationPTI(technicienId: string): ConfigurationPTI | undefined {
  return configurationsPTI[technicienId];
}
export function getEtatPTIByTechnicienId(technicienId: string): EtatPTITechnicien | undefined {
  return obtenirIndexes().etatsPTITechnicien.byTechnicienId.get(technicienId);
}
export function updateEtatPTITechnicien(etat: EtatPTITechnicien): void {
  const index = etatsPTITechnicien.findIndex((e) => e.technicienId === etat.technicienId);
  if (index !== -1) etatsPTITechnicien[index] = etat;
  else etatsPTITechnicien.push(etat);
  invaliderIndexes();
}

// ============================================================================
// 9. TÂCHES ASYNCHRONES, CARTOGRAPHIE, NOTIFICATIONS & AUDIT
// ============================================================================

export function getAllPositionsTechnicien(): PositionTechnicien[] {
  return [...positionsTechnicien];
}
export function getPositionByTechnicienId(technicienId: string): PositionTechnicien | undefined {
  return obtenirIndexes().positionsTechnicien.byTechnicienId.get(technicienId);
}

export function getAllZonesGeographiques(): ZoneGeographique[] {
  return [...zonesGeographiques];
}
export function getZoneGeographiqueById(id: string): ZoneGeographique | undefined {
  return obtenirIndexes().zonesGeographiques.byId.get(id);
}

export function getAllTourneesDuJour(): TourneeDuJour[] {
  return [...tourneesDuJour];
}
export function getTourneeDuJourByTechnicienId(technicienId: string): TourneeDuJour | undefined {
  return obtenirIndexes().tourneesDuJour.byTechnicienId.get(technicienId);
}

/**
 * Tâche asynchrone avec sa progression calculée à la lecture (jamais figée
 * en base pour les tâches EN_COURS) : `progression = min(99, (maintenant -
 * dateDebutTraitement) / dureeEstimee * 100)`. Avance naturellement à chaque
 * rafraîchissement sans setInterval serveur ni websocket.
 */
export function getAllTachesAsynchrones(): TacheAsynchrone[] {
  return tachesAsynchrones.map((t) => calculerProgressionTache(t));
}
export function getTacheAsynchroneById(id: string): TacheAsynchrone | undefined {
  const tache = obtenirIndexes().tachesAsynchrones.byId.get(id);
  return tache ? calculerProgressionTache(tache) : undefined;
}
export function getTachesAsynchronesByUtilisateurId(utilisateurId: string): TacheAsynchrone[] {
  return (obtenirIndexes().tachesAsynchrones.byUtilisateurId.get(utilisateurId) ?? []).map((t) => calculerProgressionTache(t));
}
export function addTacheAsynchrone(tache: TacheAsynchrone): void {
  tachesAsynchrones.push(tache);
  invaliderIndexes();
}
export function updateTacheAsynchrone(tache: TacheAsynchrone): void {
  const index = tachesAsynchrones.findIndex((t) => t.id === tache.id);
  if (index !== -1) tachesAsynchrones[index] = tache;
  invaliderIndexes();
}

function calculerProgressionTache(tache: TacheAsynchrone): TacheAsynchrone {
  if (tache.statut !== StatutTacheAsynchrone.EN_COURS || !tache.dateDebutTraitement) return tache;
  const dureeEstimeeMinutes = dureesEstimeesTachesAsynchrones[tache.id] ?? 10;
  const ecouleMinutes = (Date.now() - new Date(tache.dateDebutTraitement).getTime()) / 60000;
  const progression = Math.max(0, Math.min(99, Math.round((ecouleMinutes / dureeEstimeeMinutes) * 100)));
  return { ...tache, progression };
}

export function getAllNotifications(): Notification[] {
  return [...notifications].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
}
export function getNotificationById(id: string): Notification | undefined {
  return obtenirIndexes().notifications.byId.get(id);
}
export function getNotificationsByUtilisateurId(utilisateurId: string): Notification[] {
  return [...(obtenirIndexes().notifications.byUtilisateurId.get(utilisateurId) ?? [])].sort(
    (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  );
}
export function getNotificationsByRole(role: RoleUtilisateur): Notification[] {
  return [...(obtenirIndexes().notifications.byRole.get(role) ?? [])].sort(
    (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  );
}
export function addNotification(notification: Notification): void {
  notifications.push(notification);
  invaliderIndexes();
}
export function marquerNotificationLue(id: string): void {
  const notif = notifications.find((n) => n.id === id);
  if (notif && !notif.lu) {
    notif.lu = true;
    notif.dateLecture = new Date().toISOString();
  }
}

export function getAllEntreesAudit(): EntreeAudit[] {
  return [...entreesAudit].sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
}
export function getEntreesAuditByEntiteId(entiteId: string): EntreeAudit[] {
  return [...(obtenirIndexes().entreesAudit.byEntiteId.get(entiteId) ?? [])].sort(
    (a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()
  );
}
export function addEntreeAudit(entree: EntreeAudit): void {
  entreesAudit.push(entree);
  invaliderIndexes();
}

// ============================================================================
// 10. AGRÉGATS EXPLICITEMENT DEMANDÉS PAR LE MODÈLE (risque, statistiques de parc)
// ============================================================================

/** Score de risque de panne à 7 jours pour un appareil (domain/risk-scoring.ts). */
export function getRiskScoreForAscenseur(ascenseurId: string): RiskScore | null {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return null;
  const parc = getParcById(ascenseur.parcId);
  if (!parc) return null;
  return computeFullRiskScore(ascenseur, getInterventionsByAscenseurId(ascenseurId), parc, getDateDemo());
}

/** Statistiques d'un parc, ventilées par StatutAppareil. */
export function getStatistiquesParc(parcId: string): StatistiquesParc {
  const ascenseursParc = getAscenseursByParcId(parcId);
  return {
    parcId,
    totalAscenseurs: ascenseursParc.length,
    nombreEnService: ascenseursParc.filter((a) => a.statutAppareil === StatutAppareil.EN_SERVICE).length,
    nombreEnPanne: ascenseursParc.filter((a) => a.statutAppareil === StatutAppareil.EN_PANNE).length,
    nombreALArret: ascenseursParc.filter((a) => a.statutAppareil === StatutAppareil.A_L_ARRET).length,
    nombreModeDegrade: ascenseursParc.filter((a) => a.statutAppareil === StatutAppareil.MODE_DEGRADE).length,
    nombreArretTravaux: ascenseursParc.filter((a) => a.statutAppareil === StatutAppareil.ARRET_TRAVAUX).length,
  };
}

/** Statistiques de tous les parcs. */
export function getAllStatistiquesParc(): StatistiquesParc[] {
  return parcs.map((parc) => getStatistiquesParc(parc.id));
}
