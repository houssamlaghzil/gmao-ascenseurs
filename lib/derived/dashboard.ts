/**
 * Agrégats dérivés pour le Tableau de bord (cahier des charges, section 3).
 *
 * Fichier neuf sous lib/derived/ : ne modifie ni n'étend domain/types.ts,
 * domain/business-logic.ts, domain/risk-scoring.ts ni data/store.ts — il ne
 * fait que composer leurs fonctions/exports existants. Les calculs restent
 * volontairement simples (pas de moteur BI) : l'objectif est une démo
 * crédible et lisible, recalculée à chaque rendu (pages `force-dynamic`).
 */

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
  StatutTicket,
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
  getAllTickets,
  getAscenseurById,
  getEntreesJournalModificationByAscenseurId,
  getReserveCTQById,
  getRiskScoreForAscenseur,
  getTechnicienById,
} from '@/data/store';
import { calculerEtatSLA, calculerTauxRespectSLA, estInterventionHorsSLA } from './sla';

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
  const ascenseurs = getAllAscenseurs();
  const interventions = getAllInterventions();
  const maintenances = getAllMaintenances();

  let enRetard = 0;
  let cetteSemaine = 0;
  for (const m of maintenances) {
    const priorite = getPrioriteAffichageMaintenance(m, maintenant);
    if (priorite === PrioriteAffichageMaintenance.EN_RETARD) enRetard++;
    else if (priorite === PrioriteAffichageMaintenance.CETTE_SEMAINE) cetteSemaine++;
  }

  return {
    totalAscenseurs: ascenseurs.length,
    enService: ascenseurs.filter((a) => a.statutAppareil === StatutAppareil.EN_SERVICE).length,
    enPanne: ascenseurs.filter((a) => a.statutAppareil === StatutAppareil.EN_PANNE).length,
    aLArret: ascenseurs.filter((a) => a.statutAppareil === StatutAppareil.A_L_ARRET).length,
    modeDegrade: ascenseurs.filter((a) => a.statutAppareil === StatutAppareil.MODE_DEGRADE).length,
    interventionsOuvertes: interventions.filter((i) => i.statut !== StatutIntervention.CLOTURE).length,
    interventionsHorsSLA: interventions.filter((i) => estInterventionHorsSLA(i, maintenant)).length,
    maintenancesEnRetard: enRetard,
    maintenancesCetteSemaine: cetteSemaine,
    ticketsNonAffectes: getAllTickets().filter((t) => t.statut === StatutTicket.NON_RAPPROCHE).length,
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

  const panneParJour = new Map<string, number>();
  for (const i of getAllInterventions()) {
    const key = cleJourLocale(new Date(i.dateCreation));
    if (key > cleAujourdhui) continue; // garde-fou : rien ne se crée dans le futur
    panneParJour.set(key, (panneParJour.get(key) ?? 0) + 1);
  }

  const reparationParJour = new Map<string, number>();
  const planifieeParJour = new Map<string, number>();
  const categoriesParJour = new Map<string, Set<CategorieMaintenance>>();
  for (const m of getAllMaintenances()) {
    if (m.statut === StatutMaintenance.REALISEE) {
      if (!m.dateRealisee) continue;
      const key = cleJourLocale(new Date(m.dateRealisee));
      reparationParJour.set(key, (reparationParJour.get(key) ?? 0) + 1);
      continue;
    }
    if (m.statut === StatutMaintenance.ANNULEE) continue;
    const key = cleJourLocale(new Date(m.datePrevue));
    if (key <= cleAujourdhui) continue; // le prévisionnel commence demain
    planifieeParJour.set(key, (planifieeParJour.get(key) ?? 0) + 1);
    const categories = categoriesParJour.get(key) ?? new Set<CategorieMaintenance>();
    for (const categorie of m.categories) categories.add(categorie);
    categoriesParJour.set(key, categories);
  }

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
      const planifiees = planifieeParJour.get(date) ?? 0;
      jours.push({
        date,
        count: planifiees,
        pannes: 0,
        reparations: 0,
        planifiees,
        categoriesPlanifiees: [...(categoriesParJour.get(date) ?? [])],
        temporalite,
        horsPlage: false,
      });
    } else {
      const pannes = panneParJour.get(date) ?? 0;
      const reparations = reparationParJour.get(date) ?? 0;
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
  const ascenseurs = getAllAscenseurs();
  if (ascenseurs.length === 0) return 100;
  const enService = ascenseurs.filter((a) => a.statutAppareil === StatutAppareil.EN_SERVICE).length;
  return Math.round((enService / ascenseurs.length) * 100);
}

export interface SegmentRepartition {
  value: number;
  color: string;
  label: string;
}

/** Répartition interventions ouvertes / clôturées (toutes périodes confondues). */
export function getRepartitionInterventions(): SegmentRepartition[] {
  const interventions = getAllInterventions();
  const cloturees = interventions.filter((i) => i.statut === StatutIntervention.CLOTURE).length;
  const ouvertes = interventions.length - cloturees;
  return [
    { value: ouvertes, color: '#6366f1', label: 'Ouvertes' },
    { value: cloturees, color: '#10b981', label: 'Clôturées' },
  ];
}

/** Répartition des maintenances par statut — mêmes couleurs que StatutMaintenanceBadge. */
export function getRepartitionMaintenances(): SegmentRepartition[] {
  const compteurs = new Map<StatutMaintenance, number>();
  for (const m of getAllMaintenances()) {
    compteurs.set(m.statut, (compteurs.get(m.statut) ?? 0) + 1);
  }
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
  const compteurs = new Map<MotifIntervention, number>();
  for (const i of getAllInterventions()) {
    compteurs.set(i.motif, (compteurs.get(i.motif) ?? 0) + 1);
  }
  return (Object.values(MotifIntervention) as MotifIntervention[])
    .map((motif) => ({ value: compteurs.get(motif) ?? 0, color: COULEUR_MOTIF[motif], label: LIBELLE_MOTIF[motif] }))
    .filter((segment) => segment.value > 0);
}

/** Taux global de respect du SLA (0-100), toutes interventions confondues. */
export function getTauxRespectSLAGlobal(): number {
  return calculerTauxRespectSLA(getAllInterventions());
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

/** Charge courante par technicien (interventions actives + maintenances à venir), triée décroissante. */
export function getChargeTechniciens(limit = 8): ChargeTechnicien[] {
  const chargeInterventions = new Map<string, number>();
  for (const i of getAllInterventions()) {
    if (i.technicienId && STATUTS_INTERVENTION_ACTIFS.includes(i.statut)) {
      chargeInterventions.set(i.technicienId, (chargeInterventions.get(i.technicienId) ?? 0) + 1);
    }
  }
  const chargeMaintenances = new Map<string, number>();
  for (const m of getAllMaintenances()) {
    if (m.technicienId && (m.statut === StatutMaintenance.PLANIFIEE || m.statut === StatutMaintenance.EN_COURS_DE_REALISATION)) {
      chargeMaintenances.set(m.technicienId, (chargeMaintenances.get(m.technicienId) ?? 0) + 1);
    }
  }

  return getAllTechniciens()
    .filter((t) => t.actif)
    .map((t) => {
      const interventionsActives = chargeInterventions.get(t.id) ?? 0;
      const maintenancesAVenir = chargeMaintenances.get(t.id) ?? 0;
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
  for (const ascenseur of getAllAscenseurs()) {
    const risk = getRiskScoreForAscenseur(ascenseur.id);
    if (risk) resultat.push({ ascenseur, risk });
  }
  return resultat;
}

export interface AscenseurRisqueAffiche extends AscenseurAvecRisque {
  tendance7j: number[]; // nombre d'interventions créées par jour, 7 derniers jours
}

function tendance7jPourAscenseur(ascenseurId: string, interventions: Intervention[]): number[] {
  const parJour = new Map<string, number>();
  for (const i of interventions) {
    if (i.ascenseurId !== ascenseurId) continue;
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
  const interventions = getAllInterventions();
  return [...ascenseursAvecRisque]
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, limit)
    .map((item) => ({ ...item, tendance7j: tendance7jPourAscenseur(item.ascenseur.id, interventions) }));
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
  const interventions = getAllInterventions();
  const dejaSignalees = new Set<string>();

  // Les statuts TERMINE/A_VALIDER signifient que le technicien a déjà réglé la situation sur
  // site : la personne n'est plus bloquée, il ne reste qu'une validation administrative à
  // faire. On les garde dans le total (statut non clôturé, comme demandé) mais on priorise
  // dans l'aperçu les cas encore réellement actifs sur le terrain.
  const STATUTS_RESOLUS_SUR_SITE: StatutIntervention[] = [StatutIntervention.TERMINE, StatutIntervention.A_VALIDER];
  const personneBloquee = interventions
    .filter((i) => i.motif === MotifIntervention.PERSONNE_BLOQUEE && i.statut !== StatutIntervention.CLOTURE)
    .sort((a, b) => {
      const aResolu = STATUTS_RESOLUS_SUR_SITE.includes(a.statut);
      const bResolu = STATUTS_RESOLUS_SUR_SITE.includes(b.statut);
      if (aResolu !== bResolu) return aResolu ? 1 : -1;
      return new Date(a.dateLimiteSLA).getTime() - new Date(b.dateLimiteSLA).getTime();
    });
  personneBloquee.forEach((i) => dejaSignalees.add(i.id));

  const nonPrisEnCharge = interventions
    .filter(
      (i) =>
        !dejaSignalees.has(i.id) &&
        i.statut === StatutIntervention.A_AFFECTER &&
        (maintenant.getTime() - new Date(i.dateCreation).getTime()) / 60000 >= SEUIL_NON_PRIS_EN_CHARGE_MINUTES
    )
    .sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime());
  nonPrisEnCharge.forEach((i) => dejaSignalees.add(i.id));

  const slaBientotDepasse = interventions
    .filter((i) => !dejaSignalees.has(i.id) && i.statut !== StatutIntervention.CLOTURE && calculerEtatSLA(i, maintenant).etat === EtatSLA.BIENTOT_DEPASSE)
    .sort((a, b) => new Date(a.dateLimiteSLA).getTime() - new Date(b.dateLimiteSLA).getTime());
  slaBientotDepasse.forEach((i) => dejaSignalees.add(i.id));

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
export function getActiviteRecente(limit = 15): ActiviteRecenteItem[] {
  const candidatsParSource = Math.max(limit, 20);

  const interventionsItems: ActiviteRecenteItem[] = getAllInterventions()
    .map((i) => ({ intervention: i, etape: derniereEtapeIntervention(i) }))
    .sort((a, b) => new Date(b.etape.dateHeure).getTime() - new Date(a.etape.dateHeure).getTime())
    .slice(0, candidatsParSource)
    .map(({ intervention, etape }) => ({
      id: `int-etape-${intervention.id}`,
      dateHeure: etape.dateHeure,
      source: 'intervention' as const,
      etape: etape.type,
      numero: intervention.numero,
      ascenseurCode: getAscenseurById(intervention.ascenseurId)?.code ?? intervention.ascenseurId,
      statut: intervention.statut,
    }));

  const maintenancesItems: ActiviteRecenteItem[] = getAllMaintenances()
    .filter((m): m is Maintenance & { dateRealisee: string } => m.statut === StatutMaintenance.REALISEE && !!m.dateRealisee)
    .sort((a, b) => new Date(b.dateRealisee).getTime() - new Date(a.dateRealisee).getTime())
    .slice(0, candidatsParSource)
    .map((m) => ({
      id: `mnt-${m.id}`,
      dateHeure: m.dateRealisee,
      source: 'maintenance' as const,
      numero: m.numero,
      ascenseurCode: getAscenseurById(m.ascenseurId)?.code ?? m.ascenseurId,
      categories: m.categories,
    }));

  const reservesItems: ActiviteRecenteItem[] = getAllEvenementsReserve()
    .filter((e) => e.typeEvenement === TypeEvenementReserve.RESERVE_VALIDEE)
    .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())
    .slice(0, candidatsParSource)
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

  const integrationItems: ActiviteRecenteItem[] = getAllJournalEchangesIntegration()
    .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())
    .slice(0, candidatsParSource)
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

