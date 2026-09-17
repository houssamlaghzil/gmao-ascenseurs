/**
 * Agrégats dérivés pour le Tableau de bord (cahier des charges, section 3).
 *
 * Fichier neuf sous lib/derived/ : ne modifie ni n'étend domain/types.ts,
 * domain/business-logic.ts, domain/risk-scoring.ts ni data/store.ts — il ne
 * fait que composer leurs fonctions/exports existants. Les calculs restent
 * volontairement simples (pas de moteur BI) : l'objectif est une démo
 * crédible et lisible, recalculée à chaque rendu (pages `force-dynamic`).
 *
 * Simples ne veut pas dire répétés : le tableau de bord est la page la plus
 * consultée, et ses treize fonctions exportées lisaient chacune les mêmes
 * tableaux bruts pour leur propre compte. Les compteurs globaux passent donc
 * par les agrégats partagés ci-dessous (un seul parcours par tableau, mémoïsé
 * pour la durée de la requête) et les lectures par clé étrangère par les accès
 * indexés du store (`getXByY`) plutôt que par un `filter()` maison. Chaque
 * fonction exportée rend exactement les mêmes valeurs qu'avant.
 */

import { cache as cacheReact } from 'react';
import {
  Ascenseur,
  CategorieMaintenance,
  ChampModifiable,
  EtatSLA,
  GraviteReserve,
  Intervention,
  Maintenance,
  MotifIntervention,
  PrioriteAffichageMaintenance,
  RiskScore,
  StatutAppareil,
  StatutConnexionIntegration,
  StatutIntervention,
  StatutMaintenance,
  SystemeExterne,
  TypeEtapeIntervention,
  TypeEvenementReserve,
} from '@/domain/types';
import {
  getAllAscenseurs,
  getAllInterventions,
  getAllIntegrationsExternes,
  getAllJournalEchangesIntegration,
  getAllMaintenances,
  getAllEvenementsReserve,
  getAllTechniciens,
  getAscenseurById,
  getEntreesJournalModificationByAscenseurId,
  getInterventionsByAscenseurId,
  getInterventionsByTechnicienId,
  getMaintenancesByTechnicienId,
  getReserveCTQById,
  getRiskScoreForAscenseur,
  getTechnicienById,
  getTicketsNonRapproches,
} from '@/data/store';
import { calculerEtatSLA, estInterventionHorsSLA } from './sla';

// ============================================================================
// Passages partagés sur les tableaux bruts
// ============================================================================

/**
 * Mémoïsation pour la durée d'une requête — même repli que
 * lib/derived/explorer.ts : `cache()` n'est fourni que par le React que
 * Next.js résout côté serveur, il est absent du React que voient le lanceur
 * de tests et le bundle client. Hors Next, l'appel passe directement (rien
 * n'est jamais servi périmé) ; en production la déduplication est
 * indispensable car le store est mutable (Server Actions) et un cache global
 * mentirait d'une requête à l'autre.
 */
const cache: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof cacheReact === 'function' ? cacheReact : (fn) => fn;

/**
 * Instantanés partagés des tableaux bruts.
 *
 * `getAllX()` recopie le tableau du store à CHAQUE appel : un seul rendu du
 * tableau de bord déclenchait huit copies des 4 050 interventions et cinq des
 * 31 777 maintenances. On en prend un instantané par requête — jamais trié ni
 * modifié en place, seulement parcouru, les fonctions ci-dessous travaillant
 * toujours sur des tableaux dérivés (`filter`/`map`).
 */
const instantaneAscenseurs = cache((): Ascenseur[] => getAllAscenseurs());
const instantaneInterventions = cache((): Intervention[] => getAllInterventions());
const instantaneMaintenances = cache((): Maintenance[] => getAllMaintenances());

/** Compteurs de parc par statut d'appareil — KPI et taux de disponibilité. */
interface AgregatsParc {
  total: number;
  enService: number;
  enPanne: number;
  aLArret: number;
  modeDegrade: number;
}

/**
 * Un seul parcours du parc pour tous les compteurs par statut : les cinq
 * `filter()` indépendants (quatre dans les KPI, un dans le taux de
 * disponibilité) relisaient chacun les 4 348 appareils.
 */
const agregatsParc = cache((): AgregatsParc => {
  const agregats: AgregatsParc = { total: 0, enService: 0, enPanne: 0, aLArret: 0, modeDegrade: 0 };
  for (const a of instantaneAscenseurs()) {
    agregats.total++;
    if (a.statutAppareil === StatutAppareil.EN_SERVICE) agregats.enService++;
    else if (a.statutAppareil === StatutAppareil.EN_PANNE) agregats.enPanne++;
    else if (a.statutAppareil === StatutAppareil.A_L_ARRET) agregats.aLArret++;
    else if (a.statutAppareil === StatutAppareil.MODE_DEGRADE) agregats.modeDegrade++;
  }
  return agregats;
});

/** Métriques d'interventions indépendantes de l'instant courant. */
interface AgregatsInterventions {
  total: number;
  ouvertes: number; // statut != CLOTURE
  cloturees: number;
  parMotif: Map<MotifIntervention, number>;
  /** Interventions créées, par jour civil LOCAL (jamais UTC) — voir cleJourLocale. */
  pannesParJour: Map<string, number>;
}

/**
 * Un seul parcours des interventions pour les KPI d'ouverture, la répartition
 * ouvertes/clôturées, la répartition par motif et les pannes par jour du
 * Heatmap : quatre fonctions exportées qui relisaient chacune les 4 050
 * lignes pour des compteurs parfaitement compatibles entre eux.
 *
 * Les jours à venir restent dans `pannesParJour` (l'agrégat ne dépend ainsi
 * d'aucune notion de « aujourd'hui », donc reste juste toute la durée d'une
 * requête) : `getActiviteParJour` ne lit ces compteurs que sur le passé et
 * aujourd'hui, une panne ne se prévoyant pas.
 */
const agregatsInterventions = cache((): AgregatsInterventions => {
  const parMotif = new Map<MotifIntervention, number>();
  const pannesParJour = new Map<string, number>();
  let total = 0;
  let cloturees = 0;

  for (const i of instantaneInterventions()) {
    total++;
    if (i.statut === StatutIntervention.CLOTURE) cloturees++;
    parMotif.set(i.motif, (parMotif.get(i.motif) ?? 0) + 1);
    const jour = cleJourLocale(new Date(i.dateCreation));
    pannesParJour.set(jour, (pannesParJour.get(jour) ?? 0) + 1);
  }

  return { total, ouvertes: total - cloturees, cloturees, parMotif, pannesParJour };
});

/** Métriques de maintenances indépendantes de l'instant courant. */
interface AgregatsMaintenances {
  parStatut: Map<StatutMaintenance, number>;
  /** Maintenances réalisées, par jour civil local de réalisation. */
  reparationsParJour: Map<string, number>;
  /** Maintenances encore à faire (ni réalisées ni annulées), par jour civil local prévu. */
  planifieesParJour: Map<string, number>;
  categoriesPlanifieesParJour: Map<string, Set<CategorieMaintenance>>;
}

/**
 * Un seul parcours des maintenances pour la répartition par statut et pour le
 * calendrier mixte du Heatmap — deux fonctions exportées qui relisaient
 * chacune les 31 777 lignes.
 *
 * Comme pour les interventions, l'agrégat ignore où se situe « aujourd'hui » :
 * `planifieesParJour` contient aussi les maintenances en retard (prévues dans
 * le passé), que `getActiviteParJour` ne lit que sur les jours à venir — le
 * passé n'affiche que du réalisé.
 */
const agregatsMaintenances = cache((): AgregatsMaintenances => {
  const parStatut = new Map<StatutMaintenance, number>();
  const reparationsParJour = new Map<string, number>();
  const planifieesParJour = new Map<string, number>();
  const categoriesPlanifieesParJour = new Map<string, Set<CategorieMaintenance>>();

  for (const m of instantaneMaintenances()) {
    parStatut.set(m.statut, (parStatut.get(m.statut) ?? 0) + 1);

    if (m.statut === StatutMaintenance.REALISEE) {
      if (!m.dateRealisee) continue;
      const jour = cleJourLocale(new Date(m.dateRealisee));
      reparationsParJour.set(jour, (reparationsParJour.get(jour) ?? 0) + 1);
      continue;
    }
    if (m.statut === StatutMaintenance.ANNULEE) continue;

    const jour = cleJourLocale(new Date(m.datePrevue));
    planifieesParJour.set(jour, (planifieesParJour.get(jour) ?? 0) + 1);
    const categories = categoriesPlanifieesParJour.get(jour) ?? new Set<CategorieMaintenance>();
    for (const categorie of m.categories) categories.add(categorie);
    categoriesPlanifieesParJour.set(jour, categories);
  }

  return { parStatut, reparationsParJour, planifieesParJour, categoriesPlanifieesParJour };
});

/**
 * Interventions au SLA dépassé à un instant donné.
 *
 * Seule métrique globale qui dépend de l'heure : la clé de mémoïsation est
 * donc l'instant lui-même (en millisecondes), pour ne jamais servir à un
 * appelant le décompte d'un autre instant. Deux appelants qui tombent sur la
 * même milliseconde (KPI « hors SLA » et taux de respect global) partagent le
 * parcours ; sinon chacun refait le sien, exactement comme avant.
 */
const compteurInterventionsHorsSLA = cache((instantMs: number): number => {
  const maintenant = new Date(instantMs);
  let horsSLA = 0;
  for (const i of instantaneInterventions()) {
    if (estInterventionHorsSLA(i, maintenant)) horsSLA++;
  }
  return horsSLA;
});

// ============================================================================
// 3.1 — KPI
// ============================================================================

export interface KpisTableauDeBord {
  totalAscenseurs: number;
  enService: number;
  enPanne: number;
  aLArret: number;
  modeDegrade: number;
  interventionsOuvertes: number;
  interventionsHorsSLA: number;
  maintenancesEnRetard: number;
  maintenancesCetteSemaine: number;
  ticketsNonAffectes: number;
}

/**
 * Priorité d'affichage d'une maintenance non terminée (section 6.2), même
 * règle que le type documenté MaintenanceAvecUrgence.prioriteAffichage :
 * null pour REALISEE/ANNULEE, sinon EN_RETARD / CETTE_SEMAINE / A_VENIR
 * selon la comparaison de datePrevue à `maintenant`.
 */
export function getPrioriteAffichageMaintenance(
  maintenance: Maintenance,
  maintenant: Date = new Date()
): PrioriteAffichageMaintenance | null {
  if (maintenance.statut === StatutMaintenance.REALISEE || maintenance.statut === StatutMaintenance.ANNULEE) {
    return null;
  }
  const datePrevueMs = new Date(maintenance.datePrevue).getTime();
  const maintenantMs = maintenant.getTime();
  if (datePrevueMs < maintenantMs) return PrioriteAffichageMaintenance.EN_RETARD;
  const finDeSemaineMs = maintenantMs + 7 * 24 * 60 * 60 * 1000;
  if (datePrevueMs <= finDeSemaineMs) return PrioriteAffichageMaintenance.CETTE_SEMAINE;
  return PrioriteAffichageMaintenance.A_VENIR;
}

export function getKpisTableauDeBord(maintenant: Date = new Date()): KpisTableauDeBord {
  const parc = agregatsParc();
  const interventions = agregatsInterventions();

  // Seul passage propre à ce KPI : la priorité d'affichage dépend de
  // `maintenant`, elle ne peut donc pas rejoindre l'agrégat partagé des
  // maintenances (qui, lui, reste valable toute la durée de la requête).
  let enRetard = 0;
  let cetteSemaine = 0;
  for (const m of instantaneMaintenances()) {
    const priorite = getPrioriteAffichageMaintenance(m, maintenant);
    if (priorite === PrioriteAffichageMaintenance.EN_RETARD) enRetard++;
    else if (priorite === PrioriteAffichageMaintenance.CETTE_SEMAINE) cetteSemaine++;
  }

  return {
    totalAscenseurs: parc.total,
    enService: parc.enService,
    enPanne: parc.enPanne,
    aLArret: parc.aLArret,
    modeDegrade: parc.modeDegrade,
    interventionsOuvertes: interventions.ouvertes,
    interventionsHorsSLA: compteurInterventionsHorsSLA(maintenant.getTime()),
    maintenancesEnRetard: enRetard,
    maintenancesCetteSemaine: cetteSemaine,
    ticketsNonAffectes: getTicketsNonRapproches().length,
  };
}

// ============================================================================
// 3.2 — Graphiques et tendances
// ============================================================================

/** Position d'un jour vis-à-vis d'aujourd'hui — pilote la teinte du Heatmap. */
export type TemporaliteJour = 'passe' | 'aujourdhui' | 'futur';

export interface JourActivite {
  date: string; // ISO yyyy-mm-dd, jour civil local
  count: number; // passé/aujourd'hui : pannes + réparations — futur : maintenances prévues
  pannes: number; // interventions créées ce jour-là (0 dans le futur : une panne ne se prévoit pas)
  reparations: number; // maintenances réalisées ce jour-là (0 dans le futur)
  planifiees: number; // maintenances prévues et pas encore faites (0 dans le passé et aujourd'hui)
  categoriesPlanifiees: CategorieMaintenance[]; // catégories distinctes des maintenances prévues
  temporalite: TemporaliteJour;
  horsPlage: boolean; // case de complément de grille : neutre, ne compte rien, non survolable
}

/**
 * Clé de jour **civil local**, jamais UTC : un événement du 17 à 23 h à Paris
 * doit tomber sur la case du 17. L'ancienne `toDayKey` passait par
 * `.toISOString()`, qui bascule en UTC — avec un fuseau en avance sur UTC
 * (Paris), toute date proche de minuit reculait d'un jour ; la grille du
 * Heatmap et les tendances 7 jours en souffraient toutes les deux.
 */
function cleJourLocale(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
}

/**
 * Décale de `deltaMois` mois en bornant le quantième : le 31 mai moins 3 mois
 * donne le 28/29 février et non le 2 mars (débordement natif de `setMonth`).
 */
function decalerMois(date: Date, deltaMois: number): Date {
  const cible = new Date(date.getFullYear(), date.getMonth() + deltaMois, 1);
  const dernierJourDuMois = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  cible.setDate(Math.min(date.getDate(), dernierJourDuMois));
  return cible;
}

/** Amplitude de la vue mixte, en mois civils de part et d'autre d'aujourd'hui. */
const MOIS_AFFICHES = 3;

/**
 * Calendrier mixte réalisé + prévisionnel jour par jour — alimente le Heatmap.
 *
 * Trois mois écoulés, aujourd'hui, trois mois à venir : la plage est fixée par
 * la maquette validée, d'où l'ancien paramètre `nbJours` devenu sans effet
 * (conservé uniquement pour ne pas casser les appelants existants).
 *
 * Le tableau retourné est déjà **aligné sur des semaines civiles** : il démarre
 * un lundi, finit un dimanche, et sa longueur est un multiple de 7. Le composant
 * n'a donc qu'à le découper par paquets de 7 pour obtenir des colonnes dont la
 * première ligne est bien un lundi — l'ancienne grille découpait à partir d'un
 * jour quelconque (lignes fausses) et s'arrêtait sur une colonne tronquée.
 * Les jours ajoutés pour compléter la première et la dernière semaine portent
 * `horsPlage: true` : ils occupent la grille mais ne comptent rien.
 *
 * Le futur ne contient que des maintenances encore à faire : ni REALISEE (déjà
 * comptée dans le passé), ni ANNULEE (reportée définitivement, l'afficher comme
 * prévue serait un mensonge), et évidemment aucune panne — une panne ne se
 * prévoit pas.
 */
export function getActiviteParJour(_nbJoursIgnore?: number): JourActivite[] {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const cleAujourdhui = cleJourLocale(aujourdhui);

  // Compteurs par jour issus des agrégats partagés (un seul parcours des
  // interventions et des maintenances pour toute la page). Le tri
  // passé/futur ne se fait plus à la construction des cartes mais à la
  // lecture, ci-dessous : les pannes ne sont lues que jusqu'à aujourd'hui
  // (rien ne se crée dans le futur) et le prévisionnel ne commence que demain.
  const { pannesParJour } = agregatsInterventions();
  const { reparationsParJour, planifieesParJour, categoriesPlanifieesParJour } = agregatsMaintenances();

  const debutPlage = decalerMois(aujourdhui, -MOIS_AFFICHES);
  const finPlage = decalerMois(aujourdhui, MOIS_AFFICHES);

  // Alignement calendaire : reculer jusqu'au lundi qui précède le début de la
  // plage, avancer jusqu'au dimanche qui suit sa fin. `getDay()` vaut 0 le
  // dimanche, d'où le +6 % 7 pour ramener la semaine sur un début lundi.
  const debutGrille = new Date(debutPlage);
  debutGrille.setDate(debutGrille.getDate() - ((debutGrille.getDay() + 6) % 7));
  const finGrille = new Date(finPlage);
  finGrille.setDate(finGrille.getDate() + ((7 - finGrille.getDay()) % 7));

  const jours: JourActivite[] = [];
  const curseur = new Date(debutGrille);
  while (curseur.getTime() <= finGrille.getTime()) {
    const date = cleJourLocale(curseur);
    const horsPlage = curseur.getTime() < debutPlage.getTime() || curseur.getTime() > finPlage.getTime();
    const temporalite: TemporaliteJour =
      date === cleAujourdhui ? 'aujourdhui' : date < cleAujourdhui ? 'passe' : 'futur';

    if (horsPlage) {
      jours.push({
        date,
        count: 0,
        pannes: 0,
        reparations: 0,
        planifiees: 0,
        categoriesPlanifiees: [],
        temporalite,
        horsPlage: true,
      });
    } else if (temporalite === 'futur') {
      const planifiees = planifieesParJour.get(date) ?? 0;
      jours.push({
        date,
        count: planifiees,
        pannes: 0,
        reparations: 0,
        planifiees,
        categoriesPlanifiees: [...(categoriesPlanifieesParJour.get(date) ?? [])],
        temporalite,
        horsPlage: false,
      });
    } else {
      const pannes = pannesParJour.get(date) ?? 0;
      const reparations = reparationsParJour.get(date) ?? 0;
      jours.push({
        date,
        count: pannes + reparations,
        pannes,
        reparations,
        planifiees: 0,
        categoriesPlanifiees: [],
        temporalite,
        horsPlage: false,
      });
    }

    curseur.setDate(curseur.getDate() + 1);
  }

  return jours;
}

/** Taux de disponibilité strict du parc (part des appareils EN_SERVICE), 0-100. */
export function getTauxDisponibiliteParc(): number {
  const { total, enService } = agregatsParc();
  if (total === 0) return 100;
  return Math.round((enService / total) * 100);
}

export interface SegmentRepartition {
  value: number;
  color: string;
  label: string;
}

/** Répartition interventions ouvertes / clôturées (toutes périodes confondues). */
export function getRepartitionInterventions(): SegmentRepartition[] {
  const { ouvertes, cloturees } = agregatsInterventions();
  return [
    { value: ouvertes, color: '#6366f1', label: 'Ouvertes' },
    { value: cloturees, color: '#10b981', label: 'Clôturées' },
  ];
}

/** Répartition des maintenances par statut — mêmes couleurs que StatutMaintenanceBadge. */
export function getRepartitionMaintenances(): SegmentRepartition[] {
  const compteurs = agregatsMaintenances().parStatut;
  return [
    { value: compteurs.get(StatutMaintenance.PLANIFIEE) ?? 0, color: '#0ea5e9', label: 'Planifiées' },
    { value: compteurs.get(StatutMaintenance.EN_COURS_DE_REALISATION) ?? 0, color: '#f59e0b', label: 'En cours' },
    { value: compteurs.get(StatutMaintenance.REALISEE) ?? 0, color: '#10b981', label: 'Réalisées' },
    { value: compteurs.get(StatutMaintenance.ANNULEE) ?? 0, color: '#9ca3af', label: 'Annulées' },
  ];
}

/** Couleurs catégorielles fixes par motif — ordre de l'enum, jamais réattribuées selon le rang. */
const COULEUR_MOTIF: Record<MotifIntervention, string> = {
  [MotifIntervention.PERSONNE_BLOQUEE]: '#ec4899',
  [MotifIntervention.PANNE_ARRET]: '#6366f1',
  [MotifIntervention.BRUIT_ANORMAL]: '#14b8a6',
  [MotifIntervention.PORTE_DEFAILLANTE]: '#0ea5e9',
  [MotifIntervention.ARRET_ETAGE]: '#a855f7',
  [MotifIntervention.ALARME_DECLENCHEE]: '#f97316',
  [MotifIntervention.DEGRADATION_VANDALISME]: '#ef4444',
  [MotifIntervention.AUTRE]: '#6b7280',
};

const LIBELLE_MOTIF: Record<MotifIntervention, string> = {
  [MotifIntervention.PERSONNE_BLOQUEE]: 'Personne bloquée',
  [MotifIntervention.PANNE_ARRET]: 'Panne / arrêt',
  [MotifIntervention.BRUIT_ANORMAL]: 'Bruit anormal',
  [MotifIntervention.PORTE_DEFAILLANTE]: 'Porte défaillante',
  [MotifIntervention.ARRET_ETAGE]: 'Arrêt étage',
  [MotifIntervention.ALARME_DECLENCHEE]: 'Alarme déclenchée',
  [MotifIntervention.DEGRADATION_VANDALISME]: 'Dégradation / vandalisme',
  [MotifIntervention.AUTRE]: 'Autre',
};

/** Répartition des causes de panne par MotifIntervention — palette catégorielle fixe. */
export function getRepartitionCausesPanne(): SegmentRepartition[] {
  const compteurs = agregatsInterventions().parMotif;
  return (Object.values(MotifIntervention) as MotifIntervention[])
    .map((motif) => ({ value: compteurs.get(motif) ?? 0, color: COULEUR_MOTIF[motif], label: LIBELLE_MOTIF[motif] }))
    .filter((segment) => segment.value > 0);
}

/**
 * Taux global de respect du SLA (0-100), toutes interventions confondues.
 *
 * Même définition que `calculerTauxRespectSLA` (lib/derived/sla.ts) dont il
 * reprend le calcul à l'identique : l'état SLA d'une intervention est unique,
 * donc « respectées » = total − dépassées, et « dépassées » est exactement le
 * prédicat `estInterventionHorsSLA`. On passe par le décompte partagé plutôt
 * que par un `filter()` supplémentaire sur les 4 050 interventions.
 */
export function getTauxRespectSLAGlobal(): number {
  const { total } = agregatsInterventions();
  if (total === 0) return 100;
  const horsSLA = compteurInterventionsHorsSLA(Date.now());
  return Math.round(((total - horsSLA) / total) * 100);
}

export interface ChargeTechnicien {
  id: string;
  nom: string;
  specialite: string;
  interventionsActives: number;
  maintenancesAVenir: number;
  total: number;
}

const STATUTS_INTERVENTION_ACTIFS: StatutIntervention[] = [
  StatutIntervention.AFFECTE,
  StatutIntervention.PRIS_EN_CHARGE,
  StatutIntervention.EN_COURS,
  StatutIntervention.EN_ATTENTE_DE_PIECE,
  StatutIntervention.A_REPRENDRE,
];

/**
 * Charge courante par technicien (interventions actives + maintenances à
 * venir), triée décroissante.
 *
 * Lecture par technicien via les accès indexés du store
 * (`getInterventionsByTechnicienId` / `getMaintenancesByTechnicienId`) plutôt
 * qu'un regroupement maison : inutile de relire l'intégralité des 4 050
 * interventions et des 31 777 maintenances — dont l'écrasante majorité est
 * déjà réalisée ou clôturée — pour ne garder que les techniciens actifs.
 */
export function getChargeTechniciens(limit = 8): ChargeTechnicien[] {
  return getAllTechniciens()
    .filter((t) => t.actif)
    .map((t) => {
      let interventionsActives = 0;
      for (const i of getInterventionsByTechnicienId(t.id)) {
        if (STATUTS_INTERVENTION_ACTIFS.includes(i.statut)) interventionsActives++;
      }
      let maintenancesAVenir = 0;
      for (const m of getMaintenancesByTechnicienId(t.id)) {
        if (m.statut === StatutMaintenance.PLANIFIEE || m.statut === StatutMaintenance.EN_COURS_DE_REALISATION) {
          maintenancesAVenir++;
        }
      }
      return { id: t.id, nom: t.nomComplet, specialite: t.specialite, interventionsActives, maintenancesAVenir, total: interventionsActives + maintenancesAVenir };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ============================================================================
// Maintenance prédictive — score de risque (préservé depuis l'ancien dashboard)
// ============================================================================

export interface AscenseurAvecRisque {
  ascenseur: Ascenseur;
  risk: RiskScore;
}

/** Score de risque de tous les appareils — calculé une fois, réutilisé par le top risque et les urgences. */
export function getAscenseursAvecRisque(): AscenseurAvecRisque[] {
  const resultat: AscenseurAvecRisque[] = [];
  for (const ascenseur of instantaneAscenseurs()) {
    const risk = getRiskScoreForAscenseur(ascenseur.id);
    if (risk) resultat.push({ ascenseur, risk });
  }
  return resultat;
}

export interface AscenseurRisqueAffiche extends AscenseurAvecRisque {
  tendance7j: number[]; // nombre d'interventions créées par jour, 7 derniers jours
}

/**
 * Interventions créées par jour sur les 7 derniers jours, pour un appareil.
 *
 * Lecture indexée `getInterventionsByAscenseurId` plutôt qu'un balayage des
 * 4 050 interventions répété pour chacun des appareils du top risque. La clé
 * de jour reste `cleJourLocale` : jour civil LOCAL, jamais UTC.
 */
function tendance7jPourAscenseur(ascenseurId: string): number[] {
  const parJour = new Map<string, number>();
  for (const i of getInterventionsByAscenseurId(ascenseurId)) {
    const key = cleJourLocale(new Date(i.dateCreation));
    parJour.set(key, (parJour.get(key) ?? 0) + 1);
  }
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const jours: number[] = [];
  for (let n = 6; n >= 0; n--) {
    const jour = new Date(aujourdhui);
    jour.setDate(jour.getDate() - n);
    jours.push(parJour.get(cleJourLocale(jour)) ?? 0);
  }
  return jours;
}

/** Top N ascenseurs par score de risque décroissant. */
export function getTopAscenseursRisque(ascenseursAvecRisque: AscenseurAvecRisque[], limit = 5): AscenseurRisqueAffiche[] {
  return [...ascenseursAvecRisque]
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, limit)
    .map((item) => ({ ...item, tendance7j: tendance7jPourAscenseur(item.ascenseur.id) }));
}

// ============================================================================
// 3.3 — Urgences
// ============================================================================

export enum TypeUrgence {
  PERSONNE_BLOQUEE = 'personne_bloquee',
  NON_PRIS_EN_CHARGE = 'non_pris_en_charge',
  SLA_BIENTOT_DEPASSE = 'sla_bientot_depasse',
  APPAREIL_A_L_ARRET = 'appareil_a_l_arret',
  ANOMALIE_API = 'anomalie_api',
}

export interface UrgenceItem {
  id: string;
  titre: string;
  detail: string;
  dateHeure: string; // pour l'affichage "il y a..."
  href?: string;
}

export interface GroupeUrgence {
  type: TypeUrgence;
  titre: string;
  total: number;
  items: UrgenceItem[]; // extrait court, déjà priorisé
}

const LIMITE_ITEMS_PAR_GROUPE = 4;
/** Une intervention A_AFFECTER depuis plus de ce délai est considérée non prise en charge. */
const SEUIL_NON_PRIS_EN_CHARGE_MINUTES = 120;

/** Bloc "Urgences" (section 3.3) — court et priorisé, groupé par nature d'urgence. */
export function getUrgences(ascenseursAvecRisque: AscenseurAvecRisque[], maintenant: Date = new Date()): GroupeUrgence[] {
  const maintenantMs = maintenant.getTime();

  // Les statuts TERMINE/A_VALIDER signifient que le technicien a déjà réglé la situation sur
  // site : la personne n'est plus bloquée, il ne reste qu'une validation administrative à
  // faire. On les garde dans le total (statut non clôturé, comme demandé) mais on priorise
  // dans l'aperçu les cas encore réellement actifs sur le terrain.
  const STATUTS_RESOLUS_SUR_SITE: StatutIntervention[] = [StatutIntervention.TERMINE, StatutIntervention.A_VALIDER];

  // Un seul passage sur les interventions pour les trois groupes, au lieu de
  // trois `filter()` successifs. Le `else if` remplace exactement l'ancien
  // ensemble `dejaSignalees` : une intervention retenue par un groupe n'était
  // déjà plus proposée aux suivants, et les groupes sont examinés dans le même
  // ordre de priorité qu'avant. L'ordre relatif des éléments est celui du
  // tableau source, donc les tris qui suivent (stables) donnent le même
  // résultat qu'auparavant.
  const personneBloquee: Intervention[] = [];
  const nonPrisEnCharge: Intervention[] = [];
  const slaBientotDepasse: Intervention[] = [];
  for (const i of instantaneInterventions()) {
    if (i.motif === MotifIntervention.PERSONNE_BLOQUEE && i.statut !== StatutIntervention.CLOTURE) {
      personneBloquee.push(i);
    } else if (
      i.statut === StatutIntervention.A_AFFECTER &&
      (maintenantMs - new Date(i.dateCreation).getTime()) / 60000 >= SEUIL_NON_PRIS_EN_CHARGE_MINUTES
    ) {
      nonPrisEnCharge.push(i);
    } else if (i.statut !== StatutIntervention.CLOTURE && calculerEtatSLA(i, maintenant).etat === EtatSLA.BIENTOT_DEPASSE) {
      slaBientotDepasse.push(i);
    }
  }

  personneBloquee.sort((a, b) => {
    const aResolu = STATUTS_RESOLUS_SUR_SITE.includes(a.statut);
    const bResolu = STATUTS_RESOLUS_SUR_SITE.includes(b.statut);
    if (aResolu !== bResolu) return aResolu ? 1 : -1;
    return new Date(a.dateLimiteSLA).getTime() - new Date(b.dateLimiteSLA).getTime();
  });
  nonPrisEnCharge.sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime());
  slaBientotDepasse.sort((a, b) => new Date(a.dateLimiteSLA).getTime() - new Date(b.dateLimiteSLA).getTime());

  const appareilsArret = ascenseursAvecRisque
    .filter((a) => a.ascenseur.statutAppareil === StatutAppareil.EN_PANNE || a.ascenseur.statutAppareil === StatutAppareil.A_L_ARRET)
    .sort((a, b) => b.risk.score - a.risk.score);

  const integrationsDeconnectees = getAllIntegrationsExternes().filter((i) => i.statutConnexion === StatutConnexionIntegration.DECONNECTEE);

  /** Depuis quand l'appareil est dans son statut courant, via le dernier changement journalisé (sinon "à l'instant" plutôt qu'une date fictive). */
  const depuisQuand = (ascenseurId: string): string => {
    const derniereEntree = getEntreesJournalModificationByAscenseurId(ascenseurId).find((e) => e.champModifie === ChampModifiable.STATUT_APPAREIL);
    return derniereEntree?.dateModification ?? maintenant.toISOString();
  };

  const detailIntervention = (i: Intervention): string => {
    const ascenseur = getAscenseurById(i.ascenseurId);
    const technicien = i.technicienId ? getTechnicienById(i.technicienId) : undefined;
    const lieu = ascenseur ? `${ascenseur.code} — ${ascenseur.ville}` : i.ascenseurId;
    return technicien ? `${lieu} · ${technicien.nomComplet}` : `${lieu} · non affecté`;
  };

  const groupes: GroupeUrgence[] = [
    {
      type: TypeUrgence.PERSONNE_BLOQUEE,
      titre: 'Personne bloquée',
      total: personneBloquee.length,
      items: personneBloquee.slice(0, LIMITE_ITEMS_PAR_GROUPE).map((i) => ({
        id: i.id,
        titre: `Intervention ${i.numero}`,
        detail: detailIntervention(i),
        dateHeure: i.dateCreation,
        href: `/interventions/${i.id}`,
      })),
    },
    {
      type: TypeUrgence.NON_PRIS_EN_CHARGE,
      titre: 'Non prise en charge',
      total: nonPrisEnCharge.length,
      items: nonPrisEnCharge.slice(0, LIMITE_ITEMS_PAR_GROUPE).map((i) => ({
        id: i.id,
        titre: `Intervention ${i.numero}`,
        detail: detailIntervention(i),
        dateHeure: i.dateCreation,
        href: `/interventions/${i.id}`,
      })),
    },
    {
      type: TypeUrgence.SLA_BIENTOT_DEPASSE,
      titre: 'SLA bientôt dépassé',
      total: slaBientotDepasse.length,
      items: slaBientotDepasse.slice(0, LIMITE_ITEMS_PAR_GROUPE).map((i) => ({
        id: i.id,
        titre: `Intervention ${i.numero}`,
        detail: detailIntervention(i),
        dateHeure: i.dateLimiteSLA,
        href: `/interventions/${i.id}`,
      })),
    },
    {
      type: TypeUrgence.APPAREIL_A_L_ARRET,
      titre: 'Appareils à l’arrêt',
      total: appareilsArret.length,
      items: appareilsArret.slice(0, LIMITE_ITEMS_PAR_GROUPE).map(({ ascenseur, risk }) => ({
        id: ascenseur.id,
        titre: `${ascenseur.code} — ${ascenseur.ville}`,
        detail: `Risque ${risk.score}/100 · ${ascenseur.statutAppareil === StatutAppareil.EN_PANNE ? 'en panne' : "à l'arrêt"}`,
        dateHeure: depuisQuand(ascenseur.id),
        href: `/appareils/${ascenseur.id}`,
      })),
    },
    {
      type: TypeUrgence.ANOMALIE_API,
      titre: 'Anomalie API critique',
      total: integrationsDeconnectees.length,
      items: integrationsDeconnectees.slice(0, LIMITE_ITEMS_PAR_GROUPE).map((integration) => ({
        id: integration.id,
        titre: integration.nomAffiche,
        detail: integration.derniereErreurMessage ?? 'Connexion interrompue',
        dateHeure: integration.derniereErreurDate ?? integration.derniereSynchronisation ?? maintenant.toISOString(),
      })),
    },
  ];

  return groupes.filter((g) => g.total > 0);
}

// ============================================================================
// 3.4 — Activité récente
// ============================================================================

export type ActiviteRecenteItem =
  | { id: string; dateHeure: string; source: 'intervention'; etape: TypeEtapeIntervention; numero: string; ascenseurCode: string; statut: StatutIntervention }
  | { id: string; dateHeure: string; source: 'maintenance'; numero: string; ascenseurCode: string; categories: CategorieMaintenance[] }
  | { id: string; dateHeure: string; source: 'reserve'; numero: string; ascenseurCode: string; gravite: GraviteReserve }
  | { id: string; dateHeure: string; source: 'integration'; systeme: SystemeExterne; evenement: string };

/**
 * Dernière étape connue d'une intervention, déduite de ses propres horodatages
 * (dateCreation → ... → dateCloture) sans reconstruire toute la chronologie
 * (getEtapesInterventionParId), pour rester bon marché sur les ~4000
 * interventions du jeu de données : on ne s'en sert que pour trier/afficher
 * la dernière étape, pas le détail complet.
 */
function derniereEtapeIntervention(i: Intervention): { type: TypeEtapeIntervention; dateHeure: string } {
  if (i.dateCloture) return { type: TypeEtapeIntervention.CLOTUREE, dateHeure: i.dateCloture };
  if (i.dateValidation) return { type: TypeEtapeIntervention.VALIDEE, dateHeure: i.dateValidation };
  if (i.dateTerminee) return { type: TypeEtapeIntervention.TERMINEE, dateHeure: i.dateTerminee };
  if (i.dateArriveeSite) return { type: TypeEtapeIntervention.ARRIVEE_SUR_SITE, dateHeure: i.dateArriveeSite };
  if (i.datePriseEnCharge) return { type: TypeEtapeIntervention.PRISE_EN_CHARGE, dateHeure: i.datePriseEnCharge };
  if (i.dateAffectation) return { type: TypeEtapeIntervention.TECHNICIEN_AFFECTE, dateHeure: i.dateAffectation };
  return { type: TypeEtapeIntervention.INTERVENTION_CREEE, dateHeure: i.dateCreation };
}

/**
 * Certaines dates de la maquette retombent par défaut sur "maintenant" au
 * démarrage du serveur quand aucune date réelle n'est connue (ex. réserve
 * validée sans dateValidation) : sans garde-fou, ces égalités de date
 * peuvent remplir tout le flux avec une seule source. On plafonne donc la
 * contribution de chaque source dans le résultat final, sans changer l'ordre
 * chronologique des éléments retenus.
 */
function limiterParSource(items: ActiviteRecenteItem[], limit: number, maxParSource: number): ActiviteRecenteItem[] {
  const compteurs = new Map<ActiviteRecenteItem['source'], number>();
  const resultat: ActiviteRecenteItem[] = [];
  for (const item of items) {
    if (resultat.length >= limit) break;
    const compte = compteurs.get(item.source) ?? 0;
    if (compte >= maxParSource) continue;
    compteurs.set(item.source, compte + 1);
    resultat.push(item);
  }
  return resultat;
}

/** Flux fusionné des dernières activités (interventions, maintenances, réserves CTQ, intégrations). */
/**
 * Les dernières activités d'une source, les plus récentes d'abord.
 *
 * L'horodatage est converti UNE fois par élément puis trié sur le nombre
 * obtenu : passer `new Date(...)` dans le comparateur le refaisait deux fois
 * par comparaison, soit ~950 000 analyses de chaînes ISO pour les seules
 * 31 777 maintenances. Le tri par clé numérique décroissante est stable et
 * classe donc exactement comme avant, ex æquo compris.
 */
function plusRecents<T>(elements: T[], horodatage: (element: T) => string, combien: number): T[] {
  return elements
    .map((element) => ({ element, instant: new Date(horodatage(element)).getTime() }))
    .sort((a, b) => b.instant - a.instant)
    .slice(0, combien)
    .map(({ element }) => element);
}

export function getActiviteRecente(limit = 15): ActiviteRecenteItem[] {
  const candidatsParSource = Math.max(limit, 20);

  const interventionsItems: ActiviteRecenteItem[] = plusRecents(
    instantaneInterventions().map((i) => ({ intervention: i, etape: derniereEtapeIntervention(i) })),
    ({ etape }) => etape.dateHeure,
    candidatsParSource
  )
    .map(({ intervention, etape }) => ({
      id: `int-etape-${intervention.id}`,
      dateHeure: etape.dateHeure,
      source: 'intervention' as const,
      etape: etape.type,
      numero: intervention.numero,
      ascenseurCode: getAscenseurById(intervention.ascenseurId)?.code ?? intervention.ascenseurId,
      statut: intervention.statut,
    }));

  const maintenancesItems: ActiviteRecenteItem[] = plusRecents(
    instantaneMaintenances().filter(
      (m): m is Maintenance & { dateRealisee: string } => m.statut === StatutMaintenance.REALISEE && !!m.dateRealisee
    ),
    (m) => m.dateRealisee,
    candidatsParSource
  )
    .map((m) => ({
      id: `mnt-${m.id}`,
      dateHeure: m.dateRealisee,
      source: 'maintenance' as const,
      numero: m.numero,
      ascenseurCode: getAscenseurById(m.ascenseurId)?.code ?? m.ascenseurId,
      categories: m.categories,
    }));

  const reservesItems: ActiviteRecenteItem[] = plusRecents(
    getAllEvenementsReserve().filter((e) => e.typeEvenement === TypeEvenementReserve.RESERVE_VALIDEE),
    (e) => e.dateHeure,
    candidatsParSource
  )
    .map((e) => {
      const reserve = getReserveCTQById(e.reserveId);
      return {
        id: `evres-${e.id}`,
        dateHeure: e.dateHeure,
        source: 'reserve' as const,
        numero: reserve?.numero ?? e.reserveId,
        ascenseurCode: (reserve ? getAscenseurById(reserve.appareilId)?.code : undefined) ?? '—',
        gravite: reserve?.gravite ?? GraviteReserve.MINEURE,
      };
    });

  const integrationItems: ActiviteRecenteItem[] = plusRecents(
    getAllJournalEchangesIntegration(),
    (j) => j.dateHeure,
    candidatsParSource
  )
    .map((j) => ({
      id: `jecx-${j.id}`,
      dateHeure: j.dateHeure,
      source: 'integration' as const,
      systeme: j.systeme,
      evenement: j.evenement,
    }));

  const fusion = [...interventionsItems, ...maintenancesItems, ...reservesItems, ...integrationItems].sort(
    (a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()
  );
  return limiterParSource(fusion, limit, Math.max(3, Math.ceil((limit * 2) / 5)));
}

