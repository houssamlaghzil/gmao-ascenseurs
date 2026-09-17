/**
 * Données mockées pour la démo GMAO Ascenseurs — Manei-Lift
 *
 * Génération procédurale déterministe (PRNG à seed fixe, mulberry32) pour
 * atteindre les volumes cibles du référentiel, complétée par une couche
 * curatée (quelques dizaines d'objets nommés à la main) qui porte le
 * scénario démonstratif. Toutes les données sont en mémoire et régénérées
 * (à l'identique, grâce au seed fixe) à chaque redémarrage du serveur.
 *
 * Voir /domain/types.ts pour le modèle de données et la stratégie de
 * génération pour le détail des volumes et des cas limites visés.
 */

import {
  // 1. Appareils & parc
  StatutAppareil,
  TypeParc,
  Technicien,
  TypeAuteurModification,
  AuteurModification,
  OrigineAction,
  ChampModifiable,
  EntreeJournalModification,
  TypeLigneTelealarme,
  StatutTelealarme,
  DetenteurCles,
  NiveauDesservi,
  Telealarme,
  GestionCles,
  AccesLocalTechnique,
  FicheTechniqueAppareil,
  SecteurGeographique,
  DetailModeDegrade,
  ParcAscenseurs,
  Ascenseur,
  // 2. Client & contrats
  TypeClient,
  Client,
  ResponsableClient,
  StatutContrat,
  FrequenceMaintenance,
  NiveauSla,
  SeuilsContrat,
  DefinitionSLA,
  Contrat,
  // 3. Interventions & tickets
  SourceTicket,
  StatutTicket,
  Ticket,
  StatutIntervention,
  MotifIntervention,
  NiveauUrgence,
  PrioriteIntervention,
  MotifReattribution,
  TypeCiblePlanning,
  Intervention,
  Reaffectation,
  // 4. Rapports
  TypeRapport,
  RattachementRapport,
  OrigineDiagnostic,
  LocalDiagnostic,
  MotifNonAcces,
  CategoriePhoto,
  StatutSignatureClient,
  StatutValidationRapport,
  EquipementReferentiel,
  EtatEquipementReferentiel,
  ActionDiagnosticReferentiel,
  RegleObligationPhotos,
  DiagnosticProgressif,
  RefusAcces,
  PhotoRapport,
  SignatureTechnicien,
  SignatureClient,
  Rapport,
  RapportsAgregatGlobal,
  // 5. Maintenances & planning
  CategorieMaintenance,
  StatutMaintenance,
  ResultatTestTelealarme,
  ChecklistItemMaintenance,
  Maintenance,
  TypeAbsence,
  StatutAbsence,
  Tournee,
  AbsenceTechnicien,
  // 6. CTQ & réserves
  StatutReserve,
  StatutControleCTQ,
  GraviteReserve,
  EtatPointControle,
  CategorieBlocControle,
  TypeTraitementReserve,
  TypeEvenementReserve,
  BureauEtudes,
  ReferenceTraitement,
  ControleCTQ,
  BlocControle,
  PointDeControle,
  ReserveCTQ,
  EvenementReserve,
  // 7. Intégrations & administration
  SystemeExterne,
  StatutConnexionIntegration,
  IntegrationExterne,
  DirectionEchange,
  StatutEchange,
  JournalEchangeIntegration,
  RoleUtilisateur,
  StatutCompteUtilisateur,
  ModeAuthentification,
  Permission,
  RoleDefinition,
  Utilisateur,
  TypeMaintenanceRef,
  CausePanneRef,
  TypeRegleMetier,
  RegleMetier,
  TypeNotification,
  CanalNotification,
  ConfigurationNotification,
  // 8. Mobile & synchronisation
  EtatConnexionMobile,
  StatutSessionTechnicien,
  TypeElementSynchronisation,
  StatutSynchronisation,
  OrigineTelechargementAppareil,
  ModePTI,
  EtatProtectionPTI,
  SessionTechnicien,
  ElementFileSynchronisation,
  AppareilTelechargeLocalement,
  ConfigurationPTI,
  EtatPTITechnicien,
  // 9. Tâches asynchrones, carto, notifications, audit
  Coordonnees,
  StatutPresenceTechnicien,
  PositionTechnicien,
  TypeZoneGeographique,
  ZoneGeographique,
  StatutEtapeTournee,
  EtapeTournee,
  TourneeDuJour,
  TypeTacheAsynchrone,
  StatutTacheAsynchrone,
  WorkerTraitement,
  FormatFichierExport,
  TacheAsynchrone,
  GraviteNotification,
  TypeObjetLie,
  Notification,
  TypeEntiteAuditee,
  EntreeAudit,
} from '@/domain/types';
import { calculerStatutControle } from '@/domain/business-logic';

// ============================================================================
// 0. PRNG DÉTERMINISTE, HELPERS DE DATES ET UTILITAIRES DE DISTRIBUTION
// ============================================================================

/**
 * mulberry32 — PRNG à seed fixe. Garantit une génération procédurale
 * reproductible à l'identique à chaque redémarrage du serveur (contrairement
 * à Math.random()), sans dépendance npm supplémentaire.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_GENERATION = 0x4d414e45; // seed fixe ("MANE"), reproductible
const rng = mulberry32(SEED_GENERATION);

function rand(): number {
  return rng();
}

/** Entier aléatoire entre min et max inclus. */
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randBool(probabiliteVrai: number): boolean {
  return rand() < probabiliteVrai;
}

function randPick<T>(items: readonly T[]): T {
  return items[randInt(0, items.length - 1)];
}

function randWeighted<T>(options: ReadonlyArray<readonly [T, number]>): T {
  const total = options.reduce((somme, [, poids]) => somme + poids, 0);
  let tirage = rand() * total;
  for (const [valeur, poids] of options) {
    tirage -= poids;
    if (tirage <= 0) return valeur;
  }
  return options[options.length - 1][0];
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pad(n: number, longueur: number): string {
  return String(Math.max(0, Math.trunc(n))).padStart(longueur, '0');
}

/**
 * Répartit `total` unités entières entre les poids fournis (méthode des plus
 * grands restes) : garantit une somme EXACTE, contrairement à un simple
 * arrondi indépendant de chaque part. Réutilisé pour répartir les appareils
 * entre parcs, les parcs entre clients, etc.
 */
function repartirEntiers(total: number, poids: number[]): number[] {
  if (poids.length === 0) return [];
  const sommePoids = poids.reduce((a, b) => a + b, 0);
  if (sommePoids <= 0) return poids.map(() => 0);
  const bruts = poids.map((p) => (p / sommePoids) * total);
  const base = bruts.map((b) => Math.floor(b));
  let reste = total - base.reduce((a, b) => a + b, 0);
  const ordreParFraction = bruts
    .map((b, i) => ({ i, frac: b - Math.floor(b) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < reste && ordreParFraction.length > 0; k++) {
    base[ordreParFraction[k % ordreParFraction.length].i] += 1;
  }
  return base;
}

const JOUR_MS = 24 * 60 * 60 * 1000;
const HEURE_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/** Date dans le passé relative à Date.now() (jours/heures/minutes positifs = passé). */
function dateIl(jours: number, heures: number = 0, minutes: number = 0): string {
  return new Date(Date.now() - jours * JOUR_MS - heures * HEURE_MS - minutes * MINUTE_MS).toISOString();
}

/** Date dans le futur relative à Date.now(). */
function dansLeFutur(jours: number, heures: number = 0, minutes: number = 0): string {
  return new Date(Date.now() + jours * JOUR_MS + heures * HEURE_MS + minutes * MINUTE_MS).toISOString();
}

function ajouterMinutes(dateISO: string, minutes: number): string {
  return new Date(new Date(dateISO).getTime() + minutes * MINUTE_MS).toISOString();
}

function ajouterJours(dateISO: string, jours: number): string {
  return new Date(new Date(dateISO).getTime() + jours * JOUR_MS).toISOString();
}

function differenceJours(dateA: string, dateB: string): number {
  return Math.floor((new Date(dateA).getTime() - new Date(dateB).getTime()) / JOUR_MS);
}

const MAINTENANT_ISO = new Date().toISOString();

// ============================================================================
// RÉFÉRENTIEL GÉOGRAPHIQUE (villes réelles, jamais de vrais géocodages fins)
// ============================================================================

interface VilleRef {
  nom: string;
  codePostal: string;
  latitude: number;
  longitude: number;
}

const VILLES: VilleRef[] = [
  { nom: 'Paris', codePostal: '75009', latitude: 48.8566, longitude: 2.3522 },
  { nom: 'Courbevoie', codePostal: '92400', latitude: 48.8969, longitude: 2.25 },
  { nom: 'Lyon', codePostal: '69002', latitude: 45.764, longitude: 4.8357 },
  { nom: 'Villeurbanne', codePostal: '69100', latitude: 45.7719, longitude: 4.8902 },
  { nom: 'Marseille', codePostal: '13002', latitude: 43.2965, longitude: 5.3698 },
  { nom: 'Toulouse', codePostal: '31000', latitude: 43.6047, longitude: 1.4442 },
  { nom: 'Nice', codePostal: '06000', latitude: 43.7102, longitude: 7.262 },
  { nom: 'Nantes', codePostal: '44000', latitude: 47.2184, longitude: -1.5536 },
  { nom: 'Strasbourg', codePostal: '67000', latitude: 48.5734, longitude: 7.7521 },
  { nom: 'Montpellier', codePostal: '34000', latitude: 43.6108, longitude: 3.8767 },
  { nom: 'Bordeaux', codePostal: '33000', latitude: 44.8378, longitude: -0.5792 },
  { nom: 'Lille', codePostal: '59000', latitude: 50.6292, longitude: 3.0573 },
  { nom: 'Rennes', codePostal: '35000', latitude: 48.1173, longitude: -1.6778 },
  { nom: 'Reims', codePostal: '51100', latitude: 49.2583, longitude: 4.0317 },
  { nom: 'Le Havre', codePostal: '76600', latitude: 49.4944, longitude: 0.1079 },
  { nom: 'Saint-Étienne', codePostal: '42000', latitude: 45.4397, longitude: 4.3872 },
  { nom: 'Toulon', codePostal: '83000', latitude: 43.1242, longitude: 5.928 },
  { nom: 'Grenoble', codePostal: '38000', latitude: 45.1885, longitude: 5.7245 },
  { nom: 'Dijon', codePostal: '21000', latitude: 47.322, longitude: 5.0415 },
  { nom: 'Angers', codePostal: '49000', latitude: 47.4784, longitude: -0.5632 },
];

function villeParNom(nom: string): VilleRef {
  return VILLES.find((v) => v.nom === nom) ?? VILLES[0];
}

/** Jitter ±0,01 à ±0,05° autour du centre-ville — jamais de vraie adresse géocodée. */
function jitterCoordonnees(ville: VilleRef): Coordonnees {
  const decalage = () => (randBool(0.5) ? 1 : -1) * (0.01 + rand() * 0.04);
  return { latitude: ville.latitude + decalage(), longitude: ville.longitude + decalage() };
}

/**
 * Position d'un appareil sur la carte, dispersée autour du centre de sa ville.
 *
 * Utilise un PRNG local semé par l'identifiant plutôt que le PRNG global :
 * la position est stable d'un build à l'autre et l'ajout de cette donnée ne
 * décale pas la séquence partagée (sinon toutes les données de démonstration
 * changeraient). Ce ne sont pas de vraies adresses géocodées.
 */
function coordonneesAppareil(ascenseurId: string, ville: VilleRef): Coordonnees {
  const local = mulberry32(hashChaine(`gps-${ascenseurId}`));
  const decalage = () => (local() < 0.5 ? 1 : -1) * (0.004 + local() * 0.045);
  return { latitude: ville.latitude + decalage(), longitude: ville.longitude + decalage() };
}

interface DefinitionSecteur {
  nom: string;
  villes: string[];
}

const DEFINITIONS_SECTEURS: DefinitionSecteur[] = [
  { nom: 'Secteur Île-de-France', villes: ['Paris', 'Courbevoie'] },
  { nom: 'Secteur Lyon Métropole', villes: ['Lyon', 'Villeurbanne'] },
  { nom: 'Secteur Marseille', villes: ['Marseille'] },
  { nom: 'Secteur Toulouse', villes: ['Toulouse'] },
  { nom: "Secteur Nice Côte d'Azur", villes: ['Nice'] },
  { nom: 'Secteur Nantes', villes: ['Nantes'] },
  { nom: 'Secteur Strasbourg', villes: ['Strasbourg'] },
  { nom: 'Secteur Montpellier', villes: ['Montpellier'] },
  { nom: 'Secteur Bordeaux', villes: ['Bordeaux'] },
  { nom: 'Secteur Lille', villes: ['Lille'] },
  { nom: 'Secteur Rennes', villes: ['Rennes'] },
  { nom: 'Secteur Reims', villes: ['Reims'] },
  { nom: 'Secteur Le Havre', villes: ['Le Havre'] },
  { nom: 'Secteur Saint-Étienne', villes: ['Saint-Étienne'] },
  { nom: 'Secteur Toulon', villes: ['Toulon'] },
  { nom: 'Secteur Grenoble', villes: ['Grenoble'] },
  { nom: 'Secteur Dijon', villes: ['Dijon'] },
  { nom: 'Secteur Angers', villes: ['Angers'] },
];

export const secteursGeographiques: SecteurGeographique[] = DEFINITIONS_SECTEURS.map((def, i) => ({
  id: `sec-${pad(i + 1, 2)}`,
  nom: def.nom,
  villesCouvertes: def.villes,
}));

function secteurPourVille(ville: string): string | undefined {
  return secteursGeographiques.find((s) => s.villesCouvertes.includes(ville))?.id;
}

// ============================================================================
// POOLS DE NOMS (personnes, entreprises)
// ============================================================================

const PRENOMS = [
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Claire', 'Thomas', 'Émilie', 'Antoine', 'Camille',
  'Julien', 'Léa', 'Maxime', 'Chloé', 'Nicolas', 'Sarah', 'Hugo', 'Manon', 'Romain', 'Julie',
  'Mathieu', 'Laura', 'Kevin', 'Aurélie', 'Florian', 'Céline', 'Yanis', 'Inès', 'Baptiste', 'Charlotte',
  'Adrien', 'Pauline', 'Quentin', 'Amandine', 'Vincent', 'Mélanie', 'Guillaume', 'Oriane', 'Bastien', 'Noémie',
];

const NOMS = [
  'Dupont', 'Martin', 'Durand', 'Bernard', 'Moreau', 'Petit', 'Rousseau', 'Lefebvre', 'Mercier', 'Dubois',
  'Fournier', 'Girard', 'Bonnet', 'Lambert', 'Roux', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Sanchez',
  'Garcia', 'Roussel', 'Blanchard', 'Guerin', 'Muller', 'Henry', 'Roy', 'Leroy', 'Simon', 'Laurent',
  'Michel', 'Gauthier', 'Perrin', 'Morel', 'Andre', 'Legrand', 'Faure', 'Vidal', 'Dumont', 'Marchand',
];

function genererNomsUniques(count: number): Array<{ prenom: string; nom: string }> {
  const combos: Array<{ prenom: string; nom: string }> = [];
  for (const prenom of PRENOMS) {
    for (const nom of NOMS) {
      combos.push({ prenom, nom });
    }
  }
  shuffleInPlace(combos);
  return combos.slice(0, count);
}

const NOMS_HUMAINS = genererNomsUniques(220);

function slug(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function telephoneMobile(): string {
  return `06${pad(randInt(0, 99999999), 8)}`;
}

// ============================================================================
// 1a. TECHNICIENS (~70) — générés en premier, aucune dépendance
// ============================================================================

const NB_TECHNICIENS = 70;

const SPECIALITES_TECHNICIEN = [
  'Ascenseurs hydrauliques', 'Ascenseurs électriques', 'Tous types', 'Haute vitesse',
  'Maintenance préventive', 'Électriques & hydrauliques', 'Modernisation', 'Diagnostics avancés',
  'Ascenseurs panoramiques', 'Systèmes de sécurité', 'Cabines et portes', 'Électronique embarquée',
  'Urgences 24/7', 'Mise aux normes', 'Grandes hauteurs',
];

export const techniciens: Technicien[] = Array.from({ length: NB_TECHNICIENS }, (_, i) => {
  const { prenom, nom } = NOMS_HUMAINS[i];
  // Les 3 derniers techniciens du pool sont des comptes archivés (fiche non supprimée, plus en activité).
  const actif = i < NB_TECHNICIENS - 3;
  return {
    id: `tech-${pad(i + 1, 3)}`,
    nomComplet: `${prenom} ${nom}`,
    specialite: SPECIALITES_TECHNICIEN[i % SPECIALITES_TECHNICIEN.length],
    disponible: actif && randBool(0.72),
    actif,
    telephone: telephoneMobile(),
    email: `${slug(prenom)}.${slug(nom)}@manei-lift.fr`,
  };
});

/** Ids des techniciens dédiés aux scénarios curatés (mobile/PTI/CTQ) — voir sections 6 et 8. */
const TECH_SCENARIO_DEFAUT = 'tech-001'; // ouvert par défaut dans le Centre de synchronisation
const TECH_SCENARIO_HORS_LIGNE = 'tech-002';
const TECH_SCENARIO_SYNC_EN_COURS = 'tech-003';
const TECH_SCENARIO_FILE_VIDE_PTI_REACTIVATION = 'tech-004';
const TECH_SCENARIO_PTI_TIERS = 'tech-005';
const TECH_SCENARIO_REAFFECTATION_MOBILE = 'tech-006';
const TECHS_MISSIONS_CTQ = ['tech-007', 'tech-008', 'tech-009', 'tech-010'];

// ============================================================================
// 1b. TOURNÉES (secteurs opérationnels, ~30) — dépend de Secteur + Technicien
// ============================================================================

const NB_TOURNEES = 30;

const COULEURS_TOURNEE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#4d7c0f'];

export const tournees: Tournee[] = Array.from({ length: NB_TOURNEES }, (_, i) => {
  const secteur = secteursGeographiques[i % secteursGeographiques.length];
  const ville = randPick(secteur.villesCouvertes);
  const technicien = techniciens[i % (NB_TECHNICIENS - 3)]; // titulaires toujours actifs
  return {
    id: `tourn-${pad(i + 1, 2)}`,
    nom: `Tournée ${ville}${i >= secteursGeographiques.length ? ' Sud' : ''}`,
    secteurId: secteur.id,
    ville,
    technicienTitulaireId: technicien.id,
    couleur: COULEURS_TOURNEE[i % COULEURS_TOURNEE.length],
    actif: true,
  };
});

function tourneesDuSecteur(secteurId: string | undefined): Tournee[] {
  return tournees.filter((t) => t.secteurId === secteurId);
}

// ============================================================================
// 2a. DÉFINITIONS SLA GLOBALES (référentiel léger, aucune dépendance)
// ============================================================================

/** Délais SLA par défaut (minutes), avant surcharge éventuelle par contrat. */
const DELAI_SLA_DEFAUT: Record<NiveauUrgence, number> = {
  [NiveauUrgence.PERSONNE_BLOQUEE]: 60,
  [NiveauUrgence.STANDARD]: 240,
  [NiveauUrgence.NON_URGENT]: 1440,
};

export const definitionsSLA: DefinitionSLA[] = [
  { id: 'sla-01', niveauUrgence: NiveauUrgence.PERSONNE_BLOQUEE, libelle: 'Personne bloquée', delaiMinutes: DELAI_SLA_DEFAUT[NiveauUrgence.PERSONNE_BLOQUEE] },
  { id: 'sla-02', niveauUrgence: NiveauUrgence.STANDARD, libelle: 'Dépannage standard', delaiMinutes: DELAI_SLA_DEFAUT[NiveauUrgence.STANDARD] },
  { id: 'sla-03', niveauUrgence: NiveauUrgence.NON_URGENT, libelle: 'Intervention non urgente', delaiMinutes: DELAI_SLA_DEFAUT[NiveauUrgence.NON_URGENT] },
];

/** Multiplicateur appliqué aux délais par défaut selon le niveau SLA du contrat. */
const MULTIPLICATEUR_SLA: Record<NiveauSla, number> = {
  [NiveauSla.STANDARD]: 1,
  [NiveauSla.PREMIUM]: 0.75,
  [NiveauSla.PRIORITAIRE]: 0.5,
  [NiveauSla.SUR_MESURE]: 0.6,
};

function delaiContractuelMinutes(niveauUrgence: NiveauUrgence, niveauSla: NiveauSla): number {
  return Math.max(15, Math.round((DELAI_SLA_DEFAUT[niveauUrgence] * MULTIPLICATEUR_SLA[niveauSla]) / 5) * 5);
}

// Quelques surcharges par contrat pour l'écran admin (renseignées après génération des contrats, voir plus bas).
const definitionsSLASurchargees: DefinitionSLA[] = [];

// ============================================================================
// 2b. CLIENTS (50 : 7 curatés + 43 procéduraux)
// ============================================================================

interface DefinitionClientCuratee {
  id: string;
  raisonSociale: string;
  typeClient: TypeClient;
  ville: string;
  siret?: string;
  secteurActivite?: string;
  anciennete: number; // jours
  actif: boolean;
  poids: number; // taille relative pour la répartition des parcs (0 = prospect sans parc)
}

const CLIENTS_CURATES: DefinitionClientCuratee[] = [
  { id: 'cli-001', raisonSociale: 'Unibail-Rodamco-Westfield', typeClient: TypeClient.ENSEIGNE_COMMERCIALE, ville: 'Paris', siret: '682027393', secteurActivite: 'Centres commerciaux', anciennete: 3650, actif: true, poids: 26 },
  { id: 'cli-002', raisonSociale: 'Galeries Lafayette Haussmann', typeClient: TypeClient.ENSEIGNE_COMMERCIALE, ville: 'Paris', siret: '572062289', secteurActivite: 'Grand magasin', anciennete: 2920, actif: true, poids: 16 },
  { id: 'cli-003', raisonSociale: 'Icade Foncière Tertiaire', typeClient: TypeClient.FONCIERE_TERTIAIRE, ville: 'Courbevoie', siret: '582074828', secteurActivite: 'Immobilier de bureaux', anciennete: 2190, actif: true, poids: 13 },
  { id: 'cli-004', raisonSociale: 'Groupe Résidences du Sud', typeClient: TypeClient.BAILLEUR_SOCIAL, ville: 'Montpellier', siret: '399543210', secteurActivite: 'Logement social', anciennete: 2555, actif: true, poids: 9 },
  { id: 'cli-005', raisonSociale: "Aéroports de la Côte d'Azur", typeClient: TypeClient.GESTIONNAIRE_INFRASTRUCTURE, ville: 'Nice', siret: '341257706', secteurActivite: 'Infrastructures de transport', anciennete: 1825, actif: true, poids: 11 },
  { id: 'cli-006', raisonSociale: "Communauté d'Agglomération de l'Ouest", typeClient: TypeClient.COLLECTIVITE, ville: 'Rennes', secteurActivite: 'Collectivité territoriale', anciennete: 30, actif: true, poids: 0 },
  { id: 'cli-007', raisonSociale: 'Nouvelle Foncière Urbaine', typeClient: TypeClient.FONCIERE_TERTIAIRE, ville: 'Lyon', secteurActivite: 'Immobilier tertiaire', anciennete: 15, actif: true, poids: 0 },
];

const POOLS_RAISON_SOCIALE: Record<TypeClient, string[]> = {
  [TypeClient.SYNDIC_COPROPRIETE]: ['Les Tilleuls', 'Le Clos Fleuri', 'Résidence du Parc', 'Villa Concorde', 'Le Belvédère', 'Les Terrasses', 'Le Hameau Vert', 'Le Clos Saint-Michel', 'Les Jardins de la Gare', 'Le Domaine des Lilas', "Cœur de Ville", 'Les Allées Royales'],
  [TypeClient.BAILLEUR_SOCIAL]: ['Habitat', 'OPH', 'Logi', 'Toit et Joie', 'Immobilière Sociale', 'Foyer', 'Nouvel Habitat', 'Clé de Vie'],
  [TypeClient.FONCIERE_TERTIAIRE]: ['Foncière Batignolles', 'Foncière Austerlitz', 'Foncière Presqu\'île', 'Foncière Horizon', 'Foncière Quai Ouest', 'Foncière Grand Large'],
  [TypeClient.ENSEIGNE_COMMERCIALE]: ['Family Store', 'Maison & Style', 'Techno Plus', 'Mode Avenue', 'Sport Concept', 'Bricodeal', 'Gourmet Market', 'Univers Loisirs'],
  [TypeClient.COLLECTIVITE]: ['Mairie', "Communauté d'agglomération", 'Conseil départemental', 'Métropole', 'Syndicat mixte'],
  [TypeClient.GESTIONNAIRE_INFRASTRUCTURE]: ['Aéroport de', 'Gare SNCF', 'Port Autonome de', 'Réseau Métropolitain de'],
  [TypeClient.AUTRE]: ['Groupe Immobilier', 'Multi-Services', 'Patrimoine Conseil', 'Ingénierie Bâtiment'],
};

function genererRaisonSocialeProcedurale(type: TypeClient, ville: string): string {
  const pool = POOLS_RAISON_SOCIALE[type];
  const mot = randPick(pool);
  if (type === TypeClient.SYNDIC_COPROPRIETE) return `Syndic ${ville} — ${mot}`;
  if (type === TypeClient.GESTIONNAIRE_INFRASTRUCTURE || type === TypeClient.COLLECTIVITE) return `${mot} ${ville}`;
  return `${mot} ${ville}`;
}

const NB_CLIENTS_PROCEDURAUX = 43;
const TYPES_CLIENT_PROCEDURAUX: ReadonlyArray<readonly [TypeClient, number]> = [
  [TypeClient.SYNDIC_COPROPRIETE, 30],
  [TypeClient.BAILLEUR_SOCIAL, 22],
  [TypeClient.FONCIERE_TERTIAIRE, 12],
  [TypeClient.ENSEIGNE_COMMERCIALE, 12],
  [TypeClient.COLLECTIVITE, 8],
  [TypeClient.GESTIONNAIRE_INFRASTRUCTURE, 6],
  [TypeClient.AUTRE, 5],
];

interface ClientProceduralPlan {
  id: string;
  raisonSociale: string;
  typeClient: TypeClient;
  ville: string;
  anciennete: number;
  poids: number;
}

const clientsProceduralPlan: ClientProceduralPlan[] = Array.from({ length: NB_CLIENTS_PROCEDURAUX }, (_, i) => {
  const typeClient = randWeighted(TYPES_CLIENT_PROCEDURAUX);
  const ville = randPick(VILLES).nom;
  return {
    id: `cli-${pad(i + 8, 3)}`,
    raisonSociale: genererRaisonSocialeProcedurale(typeClient, ville),
    typeClient,
    ville,
    anciennete: randInt(60, 3300),
    poids: randInt(2, 10),
  };
});

function construireResponsables(clientId: string, nbResponsables: number): ResponsableClient[] {
  const responsables: ResponsableClient[] = [];
  for (let i = 0; i < nbResponsables; i++) {
    const { prenom, nom } = randPick(NOMS_HUMAINS);
    responsables.push({
      id: `resp-${clientId}-${i + 1}`,
      clientId,
      nomComplet: `${prenom} ${nom}`,
      fonction: i === 0 ? 'Responsable technique' : randPick(["Responsable d'exploitation", 'Gestionnaire de patrimoine', 'Responsable sécurité']),
      email: `${slug(prenom)}.${slug(nom)}@${slug(clientId)}.fr`,
      telephone: telephoneMobile(),
      estContactPrincipal: i === 0,
      estContactUrgence: i === 0 || i === nbResponsables - 1,
    });
  }
  return responsables;
}

export const clients: Client[] = [
  ...CLIENTS_CURATES.map((def) => ({
    id: def.id,
    raisonSociale: def.raisonSociale,
    typeClient: def.typeClient,
    siret: def.siret,
    secteurActivite: def.secteurActivite,
    adresseSiege: `${randInt(1, 150)} avenue de la République`,
    villeSiege: def.ville,
    codePostal: villeParNom(def.ville).codePostal,
    responsables: construireResponsables(def.id, def.poids > 0 ? 3 : 1),
    dateEntreeRelation: dateIl(def.anciennete),
    actif: def.actif,
  })),
  ...clientsProceduralPlan.map((def) => ({
    id: def.id,
    raisonSociale: def.raisonSociale,
    typeClient: def.typeClient,
    secteurActivite: undefined,
    adresseSiege: `${randInt(1, 150)} rue ${randPick(['de la Paix', 'Victor Hugo', 'des Alpes', 'du Commerce', 'Jean Moulin', 'de la Gare'])}`,
    villeSiege: def.ville,
    codePostal: villeParNom(def.ville).codePostal,
    responsables: construireResponsables(def.id, randInt(1, 2)),
    dateEntreeRelation: dateIl(def.anciennete),
    actif: true,
  })),
];

function clientById(id: string): Client {
  const c = clients.find((cl) => cl.id === id);
  if (!c) throw new Error(`Client introuvable: ${id}`);
  return c;
}

// ============================================================================
// 3. PARCS D'ASCENSEURS (500) — répartis entre les clients non-prospects
// ============================================================================

const NB_PARCS = 500;

const NOMS_SITES_PAR_TYPE: Record<TypeParc, string[]> = {
  [TypeParc.RESIDENTIEL]: ['Résidence', 'Ensemble Résidentiel', 'Copropriété', 'Villa', 'Le Hameau'],
  [TypeParc.TERTIAIRE]: ['Tour', 'Immeuble de Bureaux', 'Business Center', 'Le Campus', 'Le Cube'],
  [TypeParc.COMMERCIAL]: ['Centre Commercial', 'Galerie', 'Retail Park', "Espace Commercial"],
};

function typeParcPourClient(typeClient: TypeClient): TypeParc {
  switch (typeClient) {
    case TypeClient.SYNDIC_COPROPRIETE:
    case TypeClient.BAILLEUR_SOCIAL:
      return TypeParc.RESIDENTIEL;
    case TypeClient.FONCIERE_TERTIAIRE:
    case TypeClient.COLLECTIVITE:
      return randWeighted([[TypeParc.TERTIAIRE, 3], [TypeParc.RESIDENTIEL, 1]]);
    case TypeClient.ENSEIGNE_COMMERCIALE:
      return TypeParc.COMMERCIAL;
    case TypeClient.GESTIONNAIRE_INFRASTRUCTURE:
      return randWeighted([[TypeParc.COMMERCIAL, 2], [TypeParc.TERTIAIRE, 1]]);
    default:
      return randWeighted([[TypeParc.RESIDENTIEL, 1], [TypeParc.TERTIAIRE, 1], [TypeParc.COMMERCIAL, 1]]);
  }
}

type ClassePeuplement = 'petit' | 'moyen' | 'grand';

interface ParcPlan {
  id: string;
  clientId: string;
  ville: string;
  type: TypeParc;
  classe: ClassePeuplement;
}

const clientsAvecParc = [...CLIENTS_CURATES.filter((c) => c.poids > 0), ...clientsProceduralPlan];
const parcsParClient = repartirEntiers(NB_PARCS, clientsAvecParc.map((c) => c.poids)).map((n) => Math.max(1, n));
// Correction pour retomber exactement sur NB_PARCS après le plancher à 1 par client.
{
  const ecart = NB_PARCS - parcsParClient.reduce((a, b) => a + b, 0);
  if (ecart !== 0) {
    const idxMax = parcsParClient.indexOf(Math.max(...parcsParClient));
    parcsParClient[idxMax] += ecart;
  }
}

const parcsPlan: ParcPlan[] = [];
{
  let compteur = 0;
  clientsAvecParc.forEach((clientDef, idxClient) => {
    const nb = parcsParClient[idxClient];
    for (let i = 0; i < nb; i++) {
      compteur++;
      // Un grand client déploie ses sites sur plusieurs villes ; les petits restent sur leur ville de siège.
      const ville = nb > 4 && randBool(0.35) ? randPick(VILLES).nom : clientDef.ville;
      const type = typeParcPourClient(clientDef.typeClient);
      const classe = randWeighted<ClassePeuplement>([['petit', 62], ['moyen', 28], ['grand', 10]]);
      parcsPlan.push({ id: `parc-${pad(compteur, 4)}`, clientId: clientDef.id, ville, type, classe });
    }
  });
}

function nomSite(type: TypeParc, ville: string, index: number): string {
  const mot = randPick(NOMS_SITES_PAR_TYPE[type]);
  return `${mot} ${ville} ${index}`;
}

export const parcs: ParcAscenseurs[] = parcsPlan.map((plan, i) => {
  const ville = villeParNom(plan.ville);
  return {
    id: plan.id,
    nom: nomSite(plan.type, plan.ville, (i % 40) + 1),
    description:
      plan.type === TypeParc.COMMERCIAL
        ? 'Site commercial à forte affluence'
        : plan.type === TypeParc.TERTIAIRE
          ? 'Immeuble de bureaux'
          : 'Ensemble résidentiel',
    ville: plan.ville,
    adresse: `${randInt(1, 200)} ${randPick(['rue', 'avenue', 'boulevard', 'allée', 'place'])} ${randPick(['de la République', 'des Alpes', 'Victor Hugo', 'du Général de Gaulle', 'Jean Jaurès', 'de la Liberté'])}, ${ville.codePostal} ${plan.ville}`,
    type: plan.type,
    clientId: plan.clientId,
    secteurId: secteurPourVille(plan.ville),
  };
});

function parcById(id: string): ParcAscenseurs {
  const p = parcs.find((pp) => pp.id === id);
  if (!p) throw new Error(`Parc introuvable: ${id}`);
  return p;
}

const parcsParClientId = new Map<string, ParcAscenseurs[]>();
for (const parc of parcs) {
  const liste = parcsParClientId.get(parc.clientId) ?? [];
  liste.push(parc);
  parcsParClientId.set(parc.clientId, liste);
}

// ============================================================================
// 4. CONTRATS (~75 : 7 curatés + procéduraux, 1-3 par client équipé)
// ============================================================================

/** Gabarits de seuils par niveau SLA (plutôt que des valeurs aléatoires indépendantes). */
const GABARITS_SEUILS: Record<NiveauSla, SeuilsContrat> = {
  [NiveauSla.STANDARD]: { dureeMinimaleInterventionMinutes: 20, tempsMinimumPresenceMaintenanceMinutes: 30 },
  [NiveauSla.PREMIUM]: { dureeMinimaleInterventionMinutes: 15, tempsMinimumPresenceMaintenanceMinutes: 25 },
  [NiveauSla.PRIORITAIRE]: { dureeMinimaleInterventionMinutes: 10, tempsMinimumPresenceMaintenanceMinutes: 20 },
  [NiveauSla.SUR_MESURE]: { dureeMinimaleInterventionMinutes: 12, tempsMinimumPresenceMaintenanceMinutes: 22 },
};

function responsableIdsDuClient(clientId: string, nb: number): string[] {
  return clientById(clientId).responsables.slice(0, nb).map((r) => r.id);
}

const contrats: Contrat[] = [];
let seqContrat = 0;
function nextNumeroContrat(annee: number): string {
  seqContrat++;
  return `CTR-${annee}-${pad(seqContrat, 4)}`;
}

function parcIdsDuClient(clientId: string): string[] {
  return (parcsParClientId.get(clientId) ?? []).map((p) => p.id);
}

// --- 7 contrats curatés (cas limites nommés du cycle de vie StatutContrat) ---
contrats.push({
  id: 'ctr-001',
  numero: nextNumeroContrat(2019),
  clientId: 'cli-001',
  parcIds: parcIdsDuClient('cli-001'),
  nombreAppareilsCouverts: 0, // complété après génération des ascenseurs
  dateDebut: dateIl(2555),
  dateFin: dansLeFutur(220),
  frequenceMaintenance: FrequenceMaintenance.MENSUELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: true,
  maintenanceNettoyageIncluse: true,
  niveauSla: NiveauSla.SUR_MESURE,
  seuils: GABARITS_SEUILS[NiveauSla.SUR_MESURE],
  reglesSpecifiques: ['Astreinte 24/7 sur toutes les galeries', 'Priorité absolue sur les week-ends de forte affluence'],
  responsablesClientIds: responsableIdsDuClient('cli-001', 2),
  statut: StatutContrat.ACTIF,
});
contrats.push({
  id: 'ctr-002',
  numero: nextNumeroContrat(2018),
  clientId: 'cli-002',
  parcIds: parcIdsDuClient('cli-002'),
  nombreAppareilsCouverts: 0,
  dateDebut: dateIl(2920),
  dateFin: dansLeFutur(90),
  frequenceMaintenance: FrequenceMaintenance.BIMESTRIELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: true,
  maintenanceNettoyageIncluse: true,
  niveauSla: NiveauSla.PRIORITAIRE,
  seuils: GABARITS_SEUILS[NiveauSla.PRIORITAIRE],
  responsablesClientIds: responsableIdsDuClient('cli-002', 2),
  statut: StatutContrat.ACTIF,
});
contrats.push({
  // Signal dashboard admin : contrat en cours de renouvellement.
  id: 'ctr-003',
  numero: nextNumeroContrat(2022),
  clientId: 'cli-003',
  parcIds: parcIdsDuClient('cli-003'),
  nombreAppareilsCouverts: 0,
  dateDebut: dateIl(1460),
  dateFin: dansLeFutur(25),
  frequenceMaintenance: FrequenceMaintenance.TRIMESTRIELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: false,
  maintenanceNettoyageIncluse: true,
  niveauSla: NiveauSla.PREMIUM,
  seuils: GABARITS_SEUILS[NiveauSla.PREMIUM],
  responsablesClientIds: responsableIdsDuClient('cli-003', 2),
  statut: StatutContrat.EN_RENOUVELLEMENT,
});
contrats.push({
  // Historique du cycle de vie complet : contrat expiré 2020-2022.
  id: 'ctr-004',
  numero: nextNumeroContrat(2020),
  clientId: 'cli-004',
  parcIds: parcIdsDuClient('cli-004'),
  nombreAppareilsCouverts: 0,
  dateDebut: '2020-01-01T00:00:00.000Z',
  dateFin: '2022-12-31T00:00:00.000Z',
  frequenceMaintenance: FrequenceMaintenance.SEMESTRIELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: true,
  maintenanceNettoyageIncluse: false,
  niveauSla: NiveauSla.STANDARD,
  seuils: GABARITS_SEUILS[NiveauSla.STANDARD],
  responsablesClientIds: responsableIdsDuClient('cli-004', 1),
  statut: StatutContrat.EXPIRE,
});
contrats.push({
  id: 'ctr-005',
  numero: nextNumeroContrat(2023),
  clientId: 'cli-004',
  parcIds: parcIdsDuClient('cli-004'),
  nombreAppareilsCouverts: 0,
  dateDebut: '2023-01-01T00:00:00.000Z',
  dateFin: dansLeFutur(480),
  frequenceMaintenance: FrequenceMaintenance.TRIMESTRIELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: true,
  maintenanceNettoyageIncluse: true,
  niveauSla: NiveauSla.STANDARD,
  seuils: GABARITS_SEUILS[NiveauSla.STANDARD],
  responsablesClientIds: responsableIdsDuClient('cli-004', 1),
  statut: StatutContrat.ACTIF,
});
contrats.push({
  id: 'ctr-006',
  numero: nextNumeroContrat(2021),
  clientId: 'cli-005',
  parcIds: parcIdsDuClient('cli-005'),
  nombreAppareilsCouverts: 0,
  dateDebut: dateIl(1825),
  dateFin: dansLeFutur(365),
  frequenceMaintenance: FrequenceMaintenance.MENSUELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: true,
  maintenanceNettoyageIncluse: true,
  niveauSla: NiveauSla.SUR_MESURE,
  seuils: GABARITS_SEUILS[NiveauSla.SUR_MESURE],
  reglesSpecifiques: ['Astreinte 24/7 — terminaux 1 et 2'],
  responsablesClientIds: responsableIdsDuClient('cli-005', 1),
  statut: StatutContrat.ACTIF,
});
// Prospects en négociation, sans appareil rattaché encore.
contrats.push({
  id: 'ctr-007',
  numero: nextNumeroContrat(2026),
  clientId: 'cli-006',
  parcIds: [],
  nombreAppareilsCouverts: 0,
  dateDebut: dansLeFutur(45),
  dateFin: dansLeFutur(45 + 365 * 3),
  frequenceMaintenance: FrequenceMaintenance.TRIMESTRIELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: true,
  maintenanceNettoyageIncluse: false,
  niveauSla: NiveauSla.STANDARD,
  seuils: GABARITS_SEUILS[NiveauSla.STANDARD],
  responsablesClientIds: responsableIdsDuClient('cli-006', 1),
  statut: StatutContrat.EN_NEGOCIATION,
});
contrats.push({
  id: 'ctr-008',
  numero: nextNumeroContrat(2026),
  clientId: 'cli-007',
  parcIds: [],
  nombreAppareilsCouverts: 0,
  dateDebut: dansLeFutur(60),
  dateFin: dansLeFutur(60 + 365 * 3),
  frequenceMaintenance: FrequenceMaintenance.SEMESTRIELLE,
  maintenanceCableIncluse: true,
  maintenanceParachuteIncluse: false,
  maintenanceNettoyageIncluse: false,
  niveauSla: NiveauSla.PREMIUM,
  seuils: GABARITS_SEUILS[NiveauSla.PREMIUM],
  responsablesClientIds: responsableIdsDuClient('cli-007', 1),
  statut: StatutContrat.EN_NEGOCIATION,
});

// --- Contrats procéduraux : 1 à 3 par client procédural équipé de parcs ---
const NIVEAUX_SLA_PROCEDURAUX: ReadonlyArray<readonly [NiveauSla, number]> = [
  [NiveauSla.STANDARD, 60], [NiveauSla.PREMIUM, 25], [NiveauSla.PRIORITAIRE, 10], [NiveauSla.SUR_MESURE, 5],
];
const FREQUENCES_PROCEDURALES: ReadonlyArray<readonly [FrequenceMaintenance, number]> = [
  [FrequenceMaintenance.MENSUELLE, 5], [FrequenceMaintenance.BIMESTRIELLE, 20],
  [FrequenceMaintenance.TRIMESTRIELLE, 45], [FrequenceMaintenance.SEMESTRIELLE, 25], [FrequenceMaintenance.ANNUELLE, 5],
];

for (const clientDef of clientsProceduralPlan) {
  const nbContrats = randWeighted<number>([[1, 60], [2, 30], [3, 10]]);
  const parcIdsClient = parcIdsDuClient(clientDef.id);
  for (let n = 0; n < nbContrats; n++) {
    const niveauSla = randWeighted(NIVEAUX_SLA_PROCEDURAUX);
    const anneeDebut = n === 0 ? randInt(2019, 2024) : randInt(2021, 2025);
    const statut: StatutContrat =
      n === 0
        ? StatutContrat.ACTIF
        : randWeighted<StatutContrat>([[StatutContrat.EN_RENOUVELLEMENT, 4], [StatutContrat.SUSPENDU, 3], [StatutContrat.RESILIE, 3]]);
    contrats.push({
      id: `ctr-${pad(contrats.length + 1, 4)}`,
      numero: nextNumeroContrat(anneeDebut),
      clientId: clientDef.id,
      parcIds: n === 0 ? parcIdsClient : parcIdsClient.slice(0, Math.max(1, Math.ceil(parcIdsClient.length / 2))),
      nombreAppareilsCouverts: 0,
      dateDebut: `${anneeDebut}-01-01T00:00:00.000Z`,
      dateFin: statut === StatutContrat.RESILIE ? `${anneeDebut + 2}-06-30T00:00:00.000Z` : dansLeFutur(randInt(90, 900)),
      frequenceMaintenance: randWeighted(FREQUENCES_PROCEDURALES),
      maintenanceCableIncluse: randBool(0.92),
      maintenanceParachuteIncluse: randBool(0.88),
      maintenanceNettoyageIncluse: randBool(0.7),
      niveauSla,
      seuils: GABARITS_SEUILS[niveauSla],
      responsablesClientIds: responsableIdsDuClient(clientDef.id, 1),
      statut,
    });
  }
}

export { contrats };

function contratById(id: string): Contrat | undefined {
  return contrats.find((c) => c.id === id);
}

/** Contrat le plus pertinent pour couvrir un parc donné (le plus récent parmi ACTIF/EN_RENOUVELLEMENT). */
function contratActifPourParc(parcId: string): Contrat | undefined {
  const parc = parcById(parcId);
  const candidats = contrats.filter(
    (c) =>
      c.clientId === parc.clientId &&
      c.parcIds.includes(parcId) &&
      (c.statut === StatutContrat.ACTIF || c.statut === StatutContrat.EN_RENOUVELLEMENT)
  );
  if (candidats.length === 0) return undefined;
  return candidats.sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())[0];
}

// Quelques surcharges SLA par contrat (référentiel admin), pour les contrats à niveau prioritaire/sur-mesure.
for (const c of contrats.filter((c) => c.niveauSla === NiveauSla.PRIORITAIRE || c.niveauSla === NiveauSla.SUR_MESURE).slice(0, 6)) {
  for (const niveauUrgence of [NiveauUrgence.PERSONNE_BLOQUEE, NiveauUrgence.STANDARD, NiveauUrgence.NON_URGENT]) {
    definitionsSLASurchargees.push({
      id: `sla-ovr-${c.id}-${niveauUrgence}`,
      niveauUrgence,
      libelle: `${niveauUrgence} (surcharge ${c.numero})`,
      delaiMinutes: delaiContractuelMinutes(niveauUrgence, c.niveauSla),
      contratId: c.id,
    });
  }
}
definitionsSLA.push(...definitionsSLASurchargees);

// ============================================================================
// 5. ASCENSEURS (4 348) — boucle procédurale sur les 500 parcs
// ============================================================================

const NB_ASCENSEURS = 4348;

const RAW_TAILLE_CLASSE: Record<ClassePeuplement, [number, number]> = {
  petit: [1, 8],
  moyen: [9, 20],
  grand: [21, 40],
};

const taillesBrutesParcs = parcsPlan.map((p) => randInt(...RAW_TAILLE_CLASSE[p.classe]));
const taillesAscenseursParParc = repartirEntiers(NB_ASCENSEURS, taillesBrutesParcs).map((n) => Math.max(1, n));
{
  const ecart = NB_ASCENSEURS - taillesAscenseursParParc.reduce((a, b) => a + b, 0);
  if (ecart !== 0) {
    const idxMax = taillesAscenseursParParc.indexOf(Math.max(...taillesAscenseursParParc));
    taillesAscenseursParParc[idxMax] += ecart;
  }
}

const MARQUES_MODELES: Array<{ marque: string; modeles: string[] }> = [
  { marque: 'Otis', modeles: ['Gen2', 'Gen2 Premier', 'Hydrofit'] },
  { marque: 'Schindler', modeles: ['3300', '5500', '7000'] },
  { marque: 'KONE', modeles: ['MonoSpace', 'MiniSpace', 'EcoSpace'] },
  { marque: 'TK Elevator', modeles: ['Evolution 200', 'TWIN', 'Synergy'] },
  { marque: 'Orona', modeles: ['3G', 'Aqua', 'Up'] },
  { marque: 'Kleemann', modeles: ['Ecospace', 'Ecodrive', 'Ecoline'] },
];

const FOURNISSEURS_TELEALARME = ['Cofratel', 'Urmet', 'Intratone', 'Cooper Menvier', 'Vigik Services', 'Téléavertisseur Pro'];

function genererNiveauxDesservis(nombreNiveaux: number, nombreSousSols: number): NiveauDesservi[] {
  const niveaux: NiveauDesservi[] = [];
  let ordre = 0;
  for (let i = nombreSousSols; i >= 1; i--) {
    niveaux.push({ code: `-${i}`, libelle: `${i}${i === 1 ? 'er' : 'ème'} sous-sol`, ordre: ordre++ });
  }
  niveaux.push({ code: 'RDC', libelle: 'Rez-de-chaussée', ordre: ordre++ });
  for (let i = 1; i <= nombreNiveaux - nombreSousSols - 1; i++) {
    niveaux.push({ code: String(i), libelle: `${i}${i === 1 ? 'er' : 'ème'} étage`, ordre: ordre++ });
  }
  return niveaux;
}

function genererFicheTechnique(type: TypeParc): FicheTechniqueAppareil {
  const { marque, modeles } = randPick(MARQUES_MODELES);
  const nombreNiveaux =
    type === TypeParc.TERTIAIRE ? randInt(6, 30) : type === TypeParc.COMMERCIAL ? randInt(3, 8) : randInt(3, 12);
  const nombreSousSols = randBool(0.4) ? randInt(1, 2) : 0;
  const anneeInstallation = randWeighted<number>([[randInt(1990, 2009), 15], [randInt(2010, 2019), 40], [randInt(2020, 2025), 45]]);
  const telealarmePresent = randBool(0.94);
  return {
    marque,
    modele: randPick(modeles),
    dateInstallation: `${anneeInstallation}-${pad(randInt(1, 12), 2)}-${pad(randInt(1, 28), 2)}`,
    numeroSerie: `${marque.slice(0, 3).toUpperCase()}-${randInt(100000, 999999)}`,
    referenceConstructeur: `REF-${randInt(1000, 9999)}`,
    chargeUtileKg: randWeighted([[630, 40], [800, 30], [1000, 20], [1275, 10]]),
    vitesseMs: type === TypeParc.TERTIAIRE ? randWeighted([[1.6, 40], [2.5, 40], [4, 20]]) : randWeighted([[0.63, 40], [1, 45], [1.6, 15]]),
    nombreNiveaux,
    niveauxDesservis: genererNiveauxDesservis(nombreNiveaux, nombreSousSols),
    telealarme: {
      present: telealarmePresent,
      fournisseur: telealarmePresent ? randPick(FOURNISSEURS_TELEALARME) : undefined,
      numeroCarteLigne: telealarmePresent ? `${randInt(1000000000, 2000000000)}` : undefined,
      typeLigne: telealarmePresent ? randWeighted([[TypeLigneTelealarme.IP, 55], [TypeLigneTelealarme.GSM, 35], [TypeLigneTelealarme.RTC, 10]]) : undefined,
      statutFonctionnel: !telealarmePresent
        ? StatutTelealarme.NON_TESTEE
        : randWeighted([[StatutTelealarme.FONCTIONNELLE, 90], [StatutTelealarme.DEFAILLANTE, 6], [StatutTelealarme.NON_TESTEE, 4]]),
      dateDernierTest: telealarmePresent ? dateIl(randInt(1, 200)) : undefined,
    },
    digicode: randBool(0.6) ? String(randInt(1000, 9999)) : undefined,
    gestionCles: {
      detenteur: randWeighted([
        [DetenteurCles.GARDIEN, 25], [DetenteurCles.CLIENT_SUR_SITE, 30], [DetenteurCles.BOITE_A_CLES, 20],
        [DetenteurCles.AGENCE_MANEI_LIFT, 15], [DetenteurCles.AUCUNE_REQUISE, 10],
      ]),
      localisation: randBool(0.5) ? "Loge gardien, rez-de-chaussée" : undefined,
    },
    accesLocalTechnique: {
      localisation: randPick(['Toiture, accès par escalier technique', 'Sous-sol, local machinerie', 'Palier dernier étage', "Cour intérieure, local dédié"]),
      digicodeSpecifique: randBool(0.3) ? String(randInt(1000, 9999)) : undefined,
      commentaireAcces: randBool(0.2) ? 'Prévenir le gardien avant intervention' : undefined,
    },
    localisationGPS: undefined,
  };
}

interface AscenseurPlan {
  parc: ParcAscenseurs;
  indexDansParc: number;
}

const ascenseursPlan: AscenseurPlan[] = [];
parcsPlan.forEach((planParc, idx) => {
  const parc = parcById(planParc.id);
  const nb = taillesAscenseursParParc[idx];
  for (let i = 0; i < nb; i++) {
    ascenseursPlan.push({ parc, indexDansParc: i + 1 });
  }
});

function prefixeSite(parc: ParcAscenseurs): string {
  return parc.id.replace('parc-', 'A').toUpperCase();
}

const STATUTS_APPAREIL_PONDERES: ReadonlyArray<readonly [StatutAppareil, number]> = [
  [StatutAppareil.EN_SERVICE, 90], [StatutAppareil.EN_PANNE, 4], [StatutAppareil.A_L_ARRET, 2],
  [StatutAppareil.MODE_DEGRADE, 2.5], [StatutAppareil.ARRET_TRAVAUX, 1.5],
];

function auteurSysteme(): AuteurModification {
  return { type: TypeAuteurModification.SYSTEME, id: 'systeme-generation', nomAffiche: 'Système Manei-Lift' };
}

function auteurTechnicien(t: Technicien): AuteurModification {
  return { type: TypeAuteurModification.TECHNICIEN, id: t.id, nomAffiche: t.nomComplet };
}

const entreesJournalModification: EntreeJournalModification[] = [];
let seqJournal = 0;

function construireModeDegrade(ascenseurId: string, actif: boolean, dateDebutJours: number, dureeJours: number, technicien: Technicien): DetailModeDegrade {
  seqJournal++;
  const journalId = `jrn-${pad(seqJournal, 5)}`;
  const detail: DetailModeDegrade = {
    id: `mdg-${pad(seqJournal, 5)}`,
    ascenseurId,
    etagesConcernes: randBool(0.3) ? ['RDC', '1'] : ['RDC'],
    commentaire: randPick(['Câble de manœuvre à remplacer', 'Attente pièce détachée porte palière', 'Vitesse réduite en attendant expertise']),
    dateDebut: dateIl(dateDebutJours),
    dateFin: actif ? undefined : dateIl(dateDebutJours - dureeJours),
    responsableChangement: auteurTechnicien(technicien),
    actif,
    entreeJournalId: journalId,
  };
  entreesJournalModification.push({
    id: journalId,
    ascenseurId,
    champModifie: ChampModifiable.STATUT_APPAREIL,
    libelleChamp: "Statut de l'appareil",
    ancienneValeur: StatutAppareil.EN_SERVICE,
    nouvelleValeur: StatutAppareil.MODE_DEGRADE,
    auteur: auteurTechnicien(technicien),
    dateModification: detail.dateDebut,
    origine: OrigineAction.MOBILE,
  });
  return detail;
}

export const ascenseurs: Ascenseur[] = ascenseursPlan.map((plan, i) => {
  const { parc, indexDansParc } = plan;
  const client = clientById(parc.clientId);
  const contrat = contratActifPourParc(parc.id);
  const ville = villeParNom(parc.ville);
  const tourneesSecteur = tourneesDuSecteur(parc.secteurId);
  const tournee = tourneesSecteur.length > 0 ? randPick(tourneesSecteur) : undefined;
  const technicienAffecte = tournee
    ? techniciens.find((t) => t.id === tournee.technicienTitulaireId)
    : randPick(techniciens.filter((t) => t.actif));

  const statutAppareil = randWeighted(STATUTS_APPAREIL_PONDERES);
  const id = `asc-${pad(i + 1, 4)}`;
  const fiche = genererFicheTechnique(parc.type);
  // Position sur la carte : dérivée de l'identifiant, pas du PRNG global — ajouter
  // un tirage dans cette boucle décalerait toute la séquence et changerait
  // l'intégralité des données de démonstration.
  fiche.localisationGPS = coordonneesAppareil(id, ville);

  let modeDegrade: DetailModeDegrade | undefined;
  if (statutAppareil === StatutAppareil.MODE_DEGRADE && technicienAffecte) {
    modeDegrade = construireModeDegrade(id, true, randInt(1, 25), randInt(1, 25), technicienAffecte);
  }

  return {
    id,
    code: `${prefixeSite(parc)}-${pad(indexDansParc, 2)}`,
    nom: `${parc.nom} — Cage ${indexDansParc}`,
    parcId: parc.id,
    clientId: client.id,
    contratId: contrat?.id ?? '',
    technicienAffecteId: technicienAffecte?.id,
    tourneeId: tournee?.id,
    secteurId: parc.secteurId,
    adresseComplete: parc.adresse,
    ville: parc.ville,
    codePostal: ville.codePostal,
    statutAppareil,
    modeDegrade,
    ficheTechnique: fiche,
    dateCreationFiche: new Date(new Date(fiche.dateInstallation).getTime() + randInt(1, 30) * JOUR_MS).toISOString(),
  };
});

function ascenseurById(id: string): Ascenseur {
  const a = ascenseurs.find((x) => x.id === id);
  if (!a) throw new Error(`Ascenseur introuvable: ${id}`);
  return a;
}

// --- ~10% des appareils EN_SERVICE portent 1-3 épisodes de mode dégradé passés (profondeur d'historique) ---
{
  const candidats = ascenseurs.filter((a) => a.statutAppareil === StatutAppareil.EN_SERVICE);
  const nbAvecHistorique = Math.round(candidats.length * 0.1);
  for (let k = 0; k < nbAvecHistorique; k++) {
    const asc = candidats[Math.floor((k / nbAvecHistorique) * candidats.length)];
    const technicien = techniciens.find((t) => t.id === asc.technicienAffecteId) ?? randPick(techniciens);
    const nbEpisodes = randInt(1, 3);
    for (let e = 0; e < nbEpisodes; e++) {
      construireModeDegrade(asc.id, false, randInt(30, 400), randInt(1, 20), technicien);
    }
  }
}

// --- Journal de modifications : curatée + échantillon ~30% des appareils ---
{
  const CHAMPS_LEGERS: Array<{ champ: ChampModifiable; libelle: string; anciennes: string[]; nouvelles: string[] }> = [
    { champ: ChampModifiable.DIGICODE, libelle: 'Digicode', anciennes: ['1234', '4521', '0000'], nouvelles: ['5678', '8754', '9999'] },
    { champ: ChampModifiable.GESTION_CLES, libelle: 'Gestion des clés', anciennes: ['Gardien'], nouvelles: ['Boîte à clés'] },
    { champ: ChampModifiable.COMMENTAIRE_ACCES, libelle: "Commentaire d'accès", anciennes: [''], nouvelles: ['Prévenir le gardien avant intervention'] },
    { champ: ChampModifiable.TELEALARME_STATUT, libelle: 'Statut téléalarme', anciennes: ['non_testee'], nouvelles: ['fonctionnelle'] },
  ];
  const echantillon = shuffleInPlace([...ascenseurs]).slice(0, Math.round(ascenseurs.length * 0.3));
  for (const asc of echantillon) {
    const technicien = techniciens.find((t) => t.id === asc.technicienAffecteId) ?? randPick(techniciens);
    const nbEntrees = randInt(1, 3);
    for (let k = 0; k < nbEntrees; k++) {
      const def = randPick(CHAMPS_LEGERS);
      seqJournal++;
      entreesJournalModification.push({
        id: `jrn-${pad(seqJournal, 5)}`,
        ascenseurId: asc.id,
        champModifie: def.champ,
        libelleChamp: def.libelle,
        ancienneValeur: randPick(def.anciennes),
        nouvelleValeur: randPick(def.nouvelles),
        auteur: randBool(0.6) ? auteurTechnicien(technicien) : auteurSysteme(),
        dateModification: dateIl(randInt(1, 300)),
        origine: randBool(0.6) ? OrigineAction.MOBILE : OrigineAction.WEB,
        statutSynchronisation: randBool(0.15) ? StatutSynchronisation.EN_ATTENTE : StatutSynchronisation.SYNCHRONISE,
      });
    }
  }

  // Cas limite canonique (section 46) : digicode 4521 → 8754, technicien de scénario mobile.
  const ascCanonique = ascenseurs[0];
  const techCanonique = techniciens.find((t) => t.id === TECH_SCENARIO_REAFFECTATION_MOBILE)!;
  seqJournal++;
  entreesJournalModification.push({
    id: `jrn-${pad(seqJournal, 5)}`,
    ascenseurId: ascCanonique.id,
    champModifie: ChampModifiable.DIGICODE,
    libelleChamp: 'Digicode',
    ancienneValeur: '4521',
    nouvelleValeur: '8754',
    auteur: auteurTechnicien(techCanonique),
    dateModification: dateIl(0, 0, 20),
    origine: OrigineAction.MOBILE,
    statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
  });
}

export { entreesJournalModification };

// --- Patch : nombreAppareilsCouverts déclaratif (parfois volontairement désynchronisé du réel) ---
{
  const compteReelParContrat = new Map<string, number>();
  for (const asc of ascenseurs) {
    if (!asc.contratId) continue;
    compteReelParContrat.set(asc.contratId, (compteReelParContrat.get(asc.contratId) ?? 0) + 1);
  }
  for (const c of contrats) {
    const reel = compteReelParContrat.get(c.id) ?? 0;
    // ~30% des contrats affichent une valeur déclarative légèrement désynchronisée du décompte réel.
    c.nombreAppareilsCouverts = randBool(0.3) ? Math.max(0, reel + randInt(-8, 12)) : reel;
  }
}

// ============================================================================
// 6. UTILISATEURS (132 comptes applicatifs)
// ============================================================================

const NOMS_UTILISATEURS_NON_TECH = NOMS_HUMAINS.slice(NB_TECHNICIENS, NB_TECHNICIENS + 70);
let curseurNomsUtilisateurs = 0;
function prochainNomUtilisateur(): { prenom: string; nom: string } {
  const n = NOMS_UTILISATEURS_NON_TECH[curseurNomsUtilisateurs % NOMS_UTILISATEURS_NON_TECH.length];
  curseurNomsUtilisateurs++;
  return n;
}

function emailUtilisateur(prenom: string, nom: string): string {
  return `${slug(prenom)}.${slug(nom)}@manei-lift.fr`;
}

const utilisateurs: Utilisateur[] = [];
let seqUtilisateur = 0;

function ajouterUtilisateur(role: RoleUtilisateur, options: Partial<Utilisateur> = {}): Utilisateur {
  seqUtilisateur++;
  const { prenom, nom } = prochainNomUtilisateur();
  const utilisateur: Utilisateur = {
    id: `usr-${pad(seqUtilisateur, 3)}`,
    nomComplet: `${prenom} ${nom}`,
    email: emailUtilisateur(prenom, nom),
    telephone: telephoneMobile(),
    role,
    statut: StatutCompteUtilisateur.ACTIF,
    modeAuthentification: randBool(0.35) ? ModeAuthentification.SSO_ENTREPRISE : ModeAuthentification.LOCAL,
    derniereConnexion: dateIl(randInt(0, 40), randInt(0, 23)),
    dateCreation: dateIl(randInt(60, 1800)),
    ...options,
  };
  if (utilisateur.modeAuthentification === ModeAuthentification.SSO_ENTREPRISE) {
    utilisateur.groupeActiveDirectory = `MANEI-${role.toUpperCase()}`;
  }
  utilisateurs.push(utilisateur);
  return utilisateur;
}

for (let i = 0; i < 4; i++) ajouterUtilisateur(RoleUtilisateur.ADMINISTRATEUR);
for (let i = 0; i < 10; i++) ajouterUtilisateur(RoleUtilisateur.SUPERVISEUR);

const parcsTriesParTaille = [...parcs].sort(
  (a, b) => ascenseurs.filter((x) => x.parcId === b.id).length - ascenseurs.filter((x) => x.parcId === a.id).length
);
for (let i = 0; i < 12; i++) {
  const parcsGeres = shuffleInPlace(parcsTriesParTaille.slice(i * 4, i * 4 + randInt(1, 3)).map((p) => p.id));
  ajouterUtilisateur(RoleUtilisateur.RESPONSABLE_PARC, { parcIds: parcsGeres.length > 0 ? parcsGeres : [parcsTriesParTaille[i % parcsTriesParTaille.length].id] });
}
for (let i = 0; i < 6; i++) ajouterUtilisateur(RoleUtilisateur.GESTIONNAIRE_CONTRATS);
for (let i = 0; i < 6; i++) ajouterUtilisateur(RoleUtilisateur.DISPATCHEUR);

// Comptes TECHNICIEN : liés 1:1 à la fiche Technicien.
for (const tech of techniciens) {
  seqUtilisateur++;
  const [prenom, ...resteNom] = tech.nomComplet.split(' ');
  utilisateurs.push({
    id: `usr-${pad(seqUtilisateur, 3)}`,
    nomComplet: tech.nomComplet,
    email: tech.email ?? emailUtilisateur(prenom, resteNom.join(' ')),
    telephone: tech.telephone,
    role: RoleUtilisateur.TECHNICIEN,
    statut: tech.actif ? StatutCompteUtilisateur.ACTIF : StatutCompteUtilisateur.INACTIF,
    modeAuthentification: ModeAuthentification.LOCAL,
    technicienId: tech.id,
    derniereConnexion: tech.actif ? dateIl(0, randInt(0, 12)) : dateIl(randInt(60, 200)),
    dateCreation: dateIl(randInt(200, 2000)),
  });
}

// Comptes LECTEUR (portail client), répartis sur les clients les plus grands.
const clientsTriesParTaille = [...clients].sort(
  (a, b) => (parcsParClientId.get(b.id)?.length ?? 0) - (parcsParClientId.get(a.id)?.length ?? 0)
);
for (let i = 0; i < 24; i++) {
  const client = clientsTriesParTaille[i % clientsTriesParTaille.length];
  ajouterUtilisateur(RoleUtilisateur.LECTEUR, { clientId: client.id });
}

// --- Cas limites : comptes suspendus / en attente d'activation / dormants ---
utilisateurs[10].statut = StatutCompteUtilisateur.SUSPENDU;
utilisateurs[11].statut = StatutCompteUtilisateur.SUSPENDU;
utilisateurs[12].statut = StatutCompteUtilisateur.SUSPENDU;
utilisateurs[13].statut = StatutCompteUtilisateur.EN_ATTENTE_ACTIVATION;
utilisateurs[13].derniereConnexion = undefined;
utilisateurs[14].statut = StatutCompteUtilisateur.EN_ATTENTE_ACTIVATION;
utilisateurs[14].derniereConnexion = undefined;
utilisateurs[20].derniereConnexion = dateIl(0, 0, 5); // "il y a 5 min"
utilisateurs[21].derniereConnexion = dateIl(40); // compte dormant, "il y a 40 jours"

export { utilisateurs };

function utilisateurById(id: string): Utilisateur | undefined {
  return utilisateurs.find((u) => u.id === id);
}

// ============================================================================
// 7. RÉFÉRENTIEL "AUTRE MAINTENANCE" CONFIGURABLE (TypeMaintenanceRef)
// ============================================================================

export const typesMaintenanceRef: TypeMaintenanceRef[] = [
  { id: 'tmr-01', code: 'graissage_rails', libelle: 'Graissage des rails de guidage', actif: true, ordreAffichage: 1, modifiable: true, couleur: '#f59e0b', dureeMinimaleMinutesParDefaut: 30 },
  { id: 'tmr-02', code: 'controle_portes_palieres', libelle: 'Contrôle renforcé des portes palières', actif: true, ordreAffichage: 2, modifiable: true, couleur: '#3b82f6', dureeMinimaleMinutesParDefaut: 45 },
  { id: 'tmr-03', code: 'inspection_machinerie', libelle: 'Inspection approfondie de la machinerie', actif: true, ordreAffichage: 3, modifiable: true, couleur: '#8b5cf6', dureeMinimaleMinutesParDefaut: 60, necessiteTeleAlarme: false },
  { id: 'tmr-04', code: 'controle_parachute_renforce', libelle: 'Contrôle parachute renforcé', actif: true, ordreAffichage: 4, modifiable: true, couleur: '#ef4444', dureeMinimaleMinutesParDefaut: 50 },
  { id: 'tmr-05', code: 'nettoyage_gaine', libelle: 'Nettoyage de la gaine et de la cuvette', actif: true, ordreAffichage: 5, modifiable: false, couleur: '#10b981', dureeMinimaleMinutesParDefaut: 40 },
];

// ============================================================================
// 8. MAINTENANCES (année courante : passées + à venir ; historique = compteurs)
// ============================================================================

const ANNEE_COURANTE = new Date(MAINTENANT_ISO).getUTCFullYear();
const DEBUT_ANNEE_MS = new Date(`${ANNEE_COURANTE}-01-01T00:00:00.000Z`).getTime();
const FIN_ANNEE_MS = new Date(`${ANNEE_COURANTE}-12-31T00:00:00.000Z`).getTime();

const FREQ_VISITES_AN: Record<FrequenceMaintenance, number> = {
  [FrequenceMaintenance.MENSUELLE]: 12,
  [FrequenceMaintenance.BIMESTRIELLE]: 6,
  [FrequenceMaintenance.TRIMESTRIELLE]: 4,
  [FrequenceMaintenance.SEMESTRIELLE]: 2,
  [FrequenceMaintenance.ANNUELLE]: 1,
};

function datesDuesAnnee(nbParAn: number, offsetJours: number): number[] {
  if (nbParAn <= 0) return [];
  const intervalleMs = (FIN_ANNEE_MS - DEBUT_ANNEE_MS) / nbParAn;
  const dates: number[] = [];
  for (let k = 0; k < nbParAn; k++) {
    const t = DEBUT_ANNEE_MS + k * intervalleMs + offsetJours * JOUR_MS;
    if (t >= DEBUT_ANNEE_MS && t <= FIN_ANNEE_MS) dates.push(t);
  }
  return dates;
}

interface OccurrenceDue {
  categorie: CategorieMaintenance;
  dateMs: number;
}

interface GroupeCombine {
  categories: CategorieMaintenance[];
  dateMs: number;
}

function combinerOccurrences(occurrences: OccurrenceDue[]): GroupeCombine[] {
  const triees = [...occurrences].sort((a, b) => a.dateMs - b.dateMs);
  const groupes: GroupeCombine[] = [];
  for (const occ of triees) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && occ.dateMs - dernier.dateMs <= 15 * JOUR_MS) {
      if (!dernier.categories.includes(occ.categorie)) dernier.categories.push(occ.categorie);
      // Règle capitale (6.3) : on avance, on ne retarde jamais la date retenue.
      dernier.dateMs = Math.min(dernier.dateMs, occ.dateMs);
    } else {
      groupes.push({ categories: [occ.categorie], dateMs: occ.dateMs });
    }
  }
  return groupes;
}

function checklistPourCategories(categories: CategorieMaintenance[]): ChecklistItemMaintenance[] {
  const items: ChecklistItemMaintenance[] = [];
  let n = 0;
  for (const cat of categories) {
    const libelles =
      cat === CategorieMaintenance.CABLE
        ? ['Contrôle visuel des câbles', 'Mesure de tension']
        : cat === CategorieMaintenance.PARACHUTE
          ? ['Test de déclenchement', 'Contrôle du limiteur de vitesse']
          : cat === CategorieMaintenance.NETTOYAGE
            ? ['Nettoyage cabine', 'Nettoyage gaine']
            : ['Contrôle général', 'Graissage'];
    for (const libelle of libelles) {
      n++;
      items.push({ id: `chk-${cat}-${n}`, categorie: cat, libelle, coche: randBool(0.85), obligatoire: n === 1 });
    }
  }
  return items;
}

const maintenances: Maintenance[] = [];
let seqMaintenance = 0;
function nextNumeroMaintenance(): string {
  seqMaintenance++;
  return `MNT-${ANNEE_COURANTE}-${pad(seqMaintenance, 6)}`;
}

/** Compteurs agrégés pour les années précédentes — jamais d'objets Maintenance individuels historisés. */
export interface HistoriqueMaintenanceAgregat {
  ascenseurId: string;
  anneesCouvertes: number;
  totalRealisees: number;
  totalAnnulees: number;
}
export const historiqueMaintenanceParAscenseur: HistoriqueMaintenanceAgregat[] = [];

let compteurEnCoursAujourdhui = 0;
let compteurAnnulees = 0;
const MAX_EN_COURS_AUJOURDHUI = 13;
const MAX_ANNULEES = 3;

for (const asc of ascenseurs) {
  const contrat = contratById(asc.contratId);
  const frequence = contrat?.frequenceMaintenance ?? FrequenceMaintenance.TRIMESTRIELLE;
  const seuilMinutes = contrat?.seuils.tempsMinimumPresenceMaintenanceMinutes ?? 30;
  const offsetAscenseur = (Number(asc.id.replace('asc-', '')) % 20) - 10;

  const occurrences: OccurrenceDue[] = [];
  for (const dateMs of datesDuesAnnee(FREQ_VISITES_AN[frequence], offsetAscenseur)) {
    occurrences.push({ categorie: CategorieMaintenance.PERIODIQUE, dateMs });
  }
  if (!contrat || contrat.maintenanceCableIncluse) {
    // Deux passages câble par an, répartis — un en début d'année, un en fin,
    // conformément à l'obligation contractuelle. Le calendrier n'en posait
    // qu'un seul, ce qui créait un déficit de conformité uniforme sur tout le
    // parc et masquait le vrai signal, celui des visites périodiques.
    for (const dateMs of datesDuesAnnee(2, offsetAscenseur)) {
      occurrences.push({ categorie: CategorieMaintenance.CABLE, dateMs });
    }
  }
  if (!contrat || contrat.maintenanceParachuteIncluse) {
    occurrences.push({ categorie: CategorieMaintenance.PARACHUTE, dateMs: DEBUT_ANNEE_MS + (150 + offsetAscenseur + randInt(-8, 8)) * JOUR_MS });
  }
  if (!contrat || contrat.maintenanceNettoyageIncluse) {
    const nbNettoyage = randInt(3, 8);
    for (const dateMs of datesDuesAnnee(nbNettoyage, offsetAscenseur + 3)) {
      occurrences.push({ categorie: CategorieMaintenance.NETTOYAGE, dateMs });
    }
  }
  if (randBool(0.05)) {
    occurrences.push({ categorie: CategorieMaintenance.AUTRE, dateMs: DEBUT_ANNEE_MS + randInt(0, 360) * JOUR_MS });
  }

  const groupes = combinerOccurrences(occurrences);

  for (const groupe of groupes) {
    const datePrevueMs = groupe.dateMs;
    const datePrevue = new Date(datePrevueMs).toISOString();
    const maintenant = Date.now();
    let statut: StatutMaintenance;
    let dateRealisee: string | undefined;
    let heureArrivee: string | undefined;
    let heureDebut: string | undefined;
    let heureFin: string | undefined;
    let dureeReelleMinutes: number | undefined;
    let avertissement = false;
    let justification: string | undefined;

    const estAujourdhui = Math.abs(datePrevueMs - maintenant) < JOUR_MS / 2 && datePrevueMs <= maintenant + JOUR_MS;
    const estPasse = datePrevueMs < maintenant - JOUR_MS;
    const estFutur = datePrevueMs > maintenant + JOUR_MS / 2;

    if (estAujourdhui && compteurEnCoursAujourdhui < MAX_EN_COURS_AUJOURDHUI && randBool(0.55)) {
      compteurEnCoursAujourdhui++;
      statut = StatutMaintenance.EN_COURS_DE_REALISATION;
      // Au moins une bien au-delà du seuil et une bien en-deçà (cf. compteur en direct).
      const minutesEcoulees = compteurEnCoursAujourdhui === 1 ? seuilMinutes + 45 : compteurEnCoursAujourdhui === 2 ? Math.max(2, seuilMinutes - 20) : randInt(5, seuilMinutes + 30);
      heureArrivee = dateIl(0, 0, minutesEcoulees + 5);
      heureDebut = dateIl(0, 0, minutesEcoulees);
    } else if (estPasse || estAujourdhui) {
      if (compteurAnnulees < MAX_ANNULEES && randBool(0.006)) {
        compteurAnnulees++;
        statut = StatutMaintenance.ANNULEE;
      } else if (randBool(0.055)) {
        // Volume volontairement limité et crédible de retard (2-4% du dû) : reste PLANIFIEE malgré la date passée.
        statut = StatutMaintenance.PLANIFIEE;
      } else {
        statut = StatutMaintenance.REALISEE;
        const jitterMinutes = randInt(-120, 30);
        dateRealisee = new Date(datePrevueMs + jitterMinutes * MINUTE_MS).toISOString();
        heureArrivee = dateRealisee;
        heureDebut = dateRealisee;
        dureeReelleMinutes = randInt(Math.round(seuilMinutes * 0.6), Math.round(seuilMinutes * 2.2));
        heureFin = ajouterMinutes(heureDebut, dureeReelleMinutes);
        if (dureeReelleMinutes < seuilMinutes && randBool(0.025 / 0.9)) {
          avertissement = true;
          if (randBool(0.5)) justification = 'Accès rapide, aucune anomalie détectée — visite courte justifiée';
        }
      }
    } else {
      statut = StatutMaintenance.PLANIFIEE;
    }

    seqMaintenance++;
    maintenances.push({
      id: `mnt-${pad(seqMaintenance, 6)}`,
      numero: nextNumeroMaintenance(),
      ascenseurId: asc.id,
      contratId: contrat?.id,
      technicienId: asc.technicienAffecteId,
      tourneeId: asc.tourneeId,
      categories: groupe.categories,
      typesAutresIds: groupe.categories.includes(CategorieMaintenance.AUTRE) ? [randPick(typesMaintenanceRef).id] : undefined,
      datePrevue,
      dateRealisee,
      statut,
      heureArrivee,
      heureDebut,
      heureFin,
      seuilDureeMinimaleMinutes: seuilMinutes,
      dureeReelleMinutes,
      avertissementDureeInsuffisante: avertissement,
      avertissementJustification: justification,
      testTelealarmeEffectue: statut === StatutMaintenance.REALISEE ? randBool(0.7) : undefined,
      testTelealarmeResultat: statut === StatutMaintenance.REALISEE && randBool(0.7) ? randWeighted([[ResultatTestTelealarme.FONCTIONNELLE, 92], [ResultatTestTelealarme.DEFAILLANTE, 8]]) : undefined,
      checklist: statut === StatutMaintenance.REALISEE && randBool(0.15) ? checklistPourCategories(groupe.categories) : undefined,
      origineDerniereModification: statut === StatutMaintenance.REALISEE ? OrigineAction.MOBILE : OrigineAction.WEB,
    });
  }

  // Historique agrégé (années précédentes) : formule ancienneté × fréquence contractuelle, pas d'objets stockés.
  const anneeInstallation = new Date(asc.ficheTechnique.dateInstallation).getUTCFullYear();
  const anneesCouvertes = Math.max(0, Math.min(5, ANNEE_COURANTE - anneeInstallation));
  if (anneesCouvertes > 0) {
    const visitesParAn = FREQ_VISITES_AN[frequence] + 2; // + câble/parachute/nettoyage moyens
    const totalTheorique = anneesCouvertes * visitesParAn;
    const tauxAnnulation = 0.015;
    historiqueMaintenanceParAscenseur.push({
      ascenseurId: asc.id,
      anneesCouvertes,
      totalRealisees: Math.round(totalTheorique * (1 - tauxAnnulation)),
      totalAnnulees: Math.round(totalTheorique * tauxAnnulation),
    });
  }
}

export { maintenances };

function maintenancesByAscenseurId(ascenseurId: string): Maintenance[] {
  return maintenances.filter((m) => m.ascenseurId === ascenseurId);
}

// ============================================================================
// 9. INTERVENTIONS, TICKETS & RÉAFFECTATIONS (~4 050 interventions)
// ============================================================================

const NB_INTERVENTIONS = 4050;

const COMMENTAIRES_PAR_MOTIF: Record<MotifIntervention, string[]> = {
  [MotifIntervention.PERSONNE_BLOQUEE]: ['Personne bloquée en cabine entre deux étages', "Enfant bloqué en cabine, porte ne s'ouvre pas", 'Personne à mobilité réduite bloquée en cabine'],
  [MotifIntervention.PANNE_ARRET]: ["Arrêt complet de l'appareil", 'Ascenseur ne répond plus aux appels', 'Panne électrique générale'],
  [MotifIntervention.BRUIT_ANORMAL]: ['Bruit anormal au niveau du moteur', 'Grincement important en cabine', 'Vibrations inhabituelles en cabine'],
  [MotifIntervention.PORTE_DEFAILLANTE]: ['Porte palière bloquée en position ouverte', 'Porte cabine ne se ferme plus', 'Portes automatiques désynchronisées'],
  [MotifIntervention.ARRET_ETAGE]: ['Problème de nivellement', "L'appareil ne s'arrête plus correctement à l'étage", 'Défaut de positionnement cabine'],
  [MotifIntervention.ALARME_DECLENCHEE]: ["Alarme déclenchée sans raison apparente", "Déclenchement intempestif du signal d'alarme"],
  [MotifIntervention.DEGRADATION_VANDALISME]: ["Boutons d'appel arrachés", 'Dégradations constatées en cabine', 'Miroir de cabine brisé'],
  [MotifIntervention.AUTRE]: ['Demande de contrôle suite à odeur suspecte', 'Vérification demandée par le client'],
};

const MOTIFS_PONDERES: ReadonlyArray<readonly [MotifIntervention, number]> = [
  [MotifIntervention.PERSONNE_BLOQUEE, 12], [MotifIntervention.PANNE_ARRET, 22], [MotifIntervention.BRUIT_ANORMAL, 12],
  [MotifIntervention.PORTE_DEFAILLANTE, 18], [MotifIntervention.ARRET_ETAGE, 14], [MotifIntervention.ALARME_DECLENCHEE, 10],
  [MotifIntervention.DEGRADATION_VANDALISME, 6], [MotifIntervention.AUTRE, 6],
];

function niveauUrgencePourMotif(motif: MotifIntervention): NiveauUrgence {
  if (motif === MotifIntervention.PERSONNE_BLOQUEE) return NiveauUrgence.PERSONNE_BLOQUEE;
  if (motif === MotifIntervention.PANNE_ARRET || motif === MotifIntervention.ALARME_DECLENCHEE) {
    return randWeighted([[NiveauUrgence.STANDARD, 85], [NiveauUrgence.PERSONNE_BLOQUEE, 10], [NiveauUrgence.NON_URGENT, 5]]);
  }
  if (motif === MotifIntervention.AUTRE) return randWeighted([[NiveauUrgence.NON_URGENT, 70], [NiveauUrgence.STANDARD, 30]]);
  return randWeighted([[NiveauUrgence.STANDARD, 65], [NiveauUrgence.NON_URGENT, 35]]);
}

function prioritePourNiveau(niveau: NiveauUrgence): PrioriteIntervention {
  if (niveau === NiveauUrgence.PERSONNE_BLOQUEE) return PrioriteIntervention.CRITIQUE;
  if (niveau === NiveauUrgence.STANDARD) return randWeighted([[PrioriteIntervention.HAUTE, 40], [PrioriteIntervention.NORMALE, 60]]);
  return randWeighted([[PrioriteIntervention.NORMALE, 50], [PrioriteIntervention.BASSE, 50]]);
}

function etatInitialPourMotif(motif: MotifIntervention): StatutAppareil {
  if (motif === MotifIntervention.ARRET_ETAGE) return randWeighted([[StatutAppareil.A_L_ARRET, 70], [StatutAppareil.EN_PANNE, 30]]);
  if (motif === MotifIntervention.PORTE_DEFAILLANTE || motif === MotifIntervention.BRUIT_ANORMAL) {
    return randWeighted([[StatutAppareil.EN_PANNE, 55], [StatutAppareil.MODE_DEGRADE, 30], [StatutAppareil.A_L_ARRET, 15]]);
  }
  return randWeighted([[StatutAppareil.EN_PANNE, 75], [StatutAppareil.A_L_ARRET, 25]]);
}

const MOTIFS_NON_ACCES_POOL = [MotifNonAcces.CLIENT_ABSENT, MotifNonAcces.LOCAL_FERME, MotifNonAcces.CLES_INDISPONIBLES, MotifNonAcces.DIGICODE_INCONNU, MotifNonAcces.ACCES_BLOQUE];

function avancer(baseISO: string, minMinutes: number, maxMinutes: number): string {
  return ajouterMinutes(baseISO, randInt(minMinutes, maxMinutes));
}

// Statuts d'ouverture (avant arrivée sur site) : la fenêtre SLA reste "en direct".
const STATUTS_OUVERTS_SANS_ARRIVEE: StatutIntervention[] = [
  StatutIntervention.NOUVEAU, StatutIntervention.A_AFFECTER, StatutIntervention.AFFECTE, StatutIntervention.PRIS_EN_CHARGE,
];
const STATUTS_AVEC_PRISE_EN_CHARGE: StatutIntervention[] = [
  StatutIntervention.PRIS_EN_CHARGE, StatutIntervention.EN_COURS, StatutIntervention.EN_ATTENTE_DE_PIECE,
  StatutIntervention.A_REPRENDRE, StatutIntervention.TERMINE, StatutIntervention.A_VALIDER, StatutIntervention.CLOTURE,
];
const STATUTS_AVEC_ARRIVEE: StatutIntervention[] = [
  StatutIntervention.EN_COURS, StatutIntervention.EN_ATTENTE_DE_PIECE, StatutIntervention.A_REPRENDRE,
  StatutIntervention.TERMINE, StatutIntervention.A_VALIDER, StatutIntervention.CLOTURE,
];
const STATUTS_TERMINES: StatutIntervention[] = [StatutIntervention.TERMINE, StatutIntervention.A_VALIDER, StatutIntervention.CLOTURE];

const FENETRE_RECENCE_MINUTES: Record<StatutIntervention, [number, number]> = {
  [StatutIntervention.NOUVEAU]: [3, 1440],
  [StatutIntervention.A_AFFECTER]: [10, 2880],
  [StatutIntervention.AFFECTE]: [15, 4320],
  [StatutIntervention.PRIS_EN_CHARGE]: [15, 4320],
  [StatutIntervention.EN_COURS]: [30, 14400],
  [StatutIntervention.EN_ATTENTE_DE_PIECE]: [1440, 28800],
  [StatutIntervention.A_REPRENDRE]: [1440, 21600],
  [StatutIntervention.TERMINE]: [1440, 86400],
  [StatutIntervention.A_VALIDER]: [1440, 129600],
  [StatutIntervention.CLOTURE]: [2880, 525600],
};

function dateCreationPourStatut(statut: StatutIntervention): string {
  const [minM, maxM] = FENETRE_RECENCE_MINUTES[statut];
  return dateIl(0, 0, randInt(minM, maxM));
}

// --- Plan exact des statuts (garantit les totaux cibles, puis mélangé) ---
const PLAN_STATUTS: Array<[StatutIntervention, number]> = [
  [StatutIntervention.CLOTURE, 2754], [StatutIntervention.A_VALIDER, 162], [StatutIntervention.TERMINE, 121],
  [StatutIntervention.EN_COURS, 324], [StatutIntervention.EN_ATTENTE_DE_PIECE, 81], [StatutIntervention.A_REPRENDRE, 81],
  [StatutIntervention.AFFECTE, 121], [StatutIntervention.PRIS_EN_CHARGE, 122], [StatutIntervention.A_AFFECTER, 162],
  [StatutIntervention.NOUVEAU, 122],
];
const statutsPlanifies: StatutIntervention[] = shuffleInPlace(
  PLAN_STATUTS.flatMap(([statut, n]) => Array.from({ length: n }, () => statut))
);

interface TicketPlan {
  intervention: Intervention;
  nombreTickets: number;
}

const interventions: Intervention[] = [];
const ticketsPlan: TicketPlan[] = [];
let seqIntervention = 0;
let seqTicketNumero = 0;

function nextTicketNumero(annee: number): string {
  seqTicketNumero++;
  return `TCK-${annee}-${pad(seqTicketNumero, 6)}`;
}

const techniciensActifs = techniciens.filter((t) => t.actif);

for (let i = 0; i < NB_INTERVENTIONS; i++) {
  const statutCible = statutsPlanifies[i];
  const ascenseur = randBool(0.3)
    ? randPick(ascenseurs.filter((a) => a.statutAppareil !== StatutAppareil.EN_SERVICE))
    : randPick(ascenseurs);
  const motif = randWeighted(MOTIFS_PONDERES);
  const niveauUrgence = niveauUrgencePourMotif(motif);
  const priorite = prioritePourNiveau(niveauUrgence);
  const contrat = contratById(ascenseur.contratId);
  const niveauSla = contrat?.niveauSla ?? NiveauSla.STANDARD;
  const delaiMinutes = delaiContractuelMinutes(niveauUrgence, niveauSla);

  const dateCreation = dateCreationPourStatut(statutCible);
  const dateDebutDecompteSLA = ajouterMinutes(dateCreation, -randInt(0, 15));
  const dateLimiteSLA = ajouterMinutes(dateDebutDecompteSLA, delaiMinutes);

  let dateAffectation: string | undefined;
  let technicienId: string | undefined;
  let datePriseEnCharge: string | undefined;
  let dateArriveeSite: string | undefined;
  let accesRefuse: boolean | undefined;
  let motifAccesRefuse: string | undefined;
  let etatAppareilInitial: StatutAppareil | undefined;
  let dateTerminee: string | undefined;
  let dureeInterventionMinutes: number | undefined;
  let etatAppareilFinal: StatutAppareil | undefined;
  let dateValidation: string | undefined;
  let dateCloture: string | undefined;

  if (statutCible !== StatutIntervention.NOUVEAU) {
    dateAffectation = avancer(dateCreation, 1, 45);
    technicienId = randPick(techniciensActifs).id;
  }
  if (STATUTS_AVEC_PRISE_EN_CHARGE.includes(statutCible)) {
    datePriseEnCharge = avancer(dateAffectation!, 2, 30);
  }
  if (STATUTS_AVEC_ARRIVEE.includes(statutCible)) {
    dateArriveeSite = avancer(datePriseEnCharge!, 8, 90);
    if (randBool(0.02)) {
      accesRefuse = true;
      motifAccesRefuse = `${randPick(MOTIFS_NON_ACCES_POOL)}`;
    } else {
      etatAppareilInitial = etatInitialPourMotif(motif);
    }
  }
  if (STATUTS_TERMINES.includes(statutCible)) {
    dateTerminee = avancer(dateArriveeSite!, 15, 180);
    dureeInterventionMinutes = Math.max(5, Math.round((new Date(dateTerminee).getTime() - new Date(dateArriveeSite!).getTime()) / MINUTE_MS));
    etatAppareilFinal = randWeighted([[StatutAppareil.EN_SERVICE, 90], [StatutAppareil.ARRET_TRAVAUX, 5], [StatutAppareil.MODE_DEGRADE, 5]]);
  }
  if (statutCible === StatutIntervention.CLOTURE) {
    dateValidation = avancer(dateTerminee!, 30, 2880);
    dateCloture = dateValidation;
  }

  seqIntervention++;
  const anneeNumero = new Date(dateCreation).getUTCFullYear();
  const intervention: Intervention = {
    id: `int-${pad(seqIntervention, 4)}`,
    numero: `INT-${anneeNumero}-${pad(seqIntervention, 6)}`,
    ascenseurId: ascenseur.id,
    contratId: contrat?.id,
    motif,
    motifDetail: randPick(COMMENTAIRES_PAR_MOTIF[motif]),
    niveauUrgence,
    priorite,
    statut: statutCible,
    technicienId,
    delaiContractuelMinutes: delaiMinutes,
    dateDebutDecompteSLA,
    dateLimiteSLA,
    dateCreation,
    dateAffectation,
    datePriseEnCharge,
    dateArriveeSite,
    dateTerminee,
    dateValidation,
    dateCloture,
    dureeInterventionMinutes,
    accesRefuse,
    motifAccesRefuse,
    etatAppareilInitial,
    etatAppareilFinal,
  };
  interventions.push(intervention);

  const nombreTickets = randWeighted<number>([[1, 75], [2, 18], [3, 5], [4, 2]]);
  ticketsPlan.push({ intervention, nombreTickets });
}

export { interventions };

function interventionById(id: string): Intervention | undefined {
  return interventions.find((i) => i.id === id);
}

// --- Tickets : construits depuis le plan multi-tickets de chaque intervention, + orphelins ---
const SOURCES_PONDEREES: ReadonlyArray<readonly [SourceTicket, number]> = [
  [SourceTicket.APPEL_CLIENT, 45], [SourceTicket.SERENITE, 25], [SourceTicket.GETRALINE, 15],
  [SourceTicket.SAISIE_INTERNE, 10], [SourceTicket.AUTRE_API, 5],
];

const tickets: Ticket[] = [];
let seqTicket = 0;

for (const { intervention, nombreTickets } of ticketsPlan) {
  const anneeTicket = new Date(intervention.dateDebutDecompteSLA).getUTCFullYear();
  for (let ordre = 1; ordre <= nombreTickets; ordre++) {
    seqTicket++;
    const dateReception = ordre === 1 ? intervention.dateDebutDecompteSLA : avancer(intervention.dateDebutDecompteSLA, ordre * 3, ordre * 45);
    tickets.push({
      id: `tck-${pad(seqTicket, 6)}`,
      numero: nextTicketNumero(anneeTicket),
      source: randPick(SOURCES_PONDEREES.map(([s]) => s)),
      statut: StatutTicket.RAPPROCHE,
      interventionId: intervention.id,
      ordreDansIntervention: ordre,
      ascenseurId: intervention.ascenseurId,
      dateReception,
      contact: randBool(0.4) ? randPick(['Gardien', 'Locataire', "Responsable d'exploitation", 'Agent de sécurité']) : undefined,
      canal: randBool(0.5) ? randPick(['Téléphone', 'Formulaire web', 'API']) : undefined,
      creeParNom: randBool(0.3) ? `${randPick(NOMS_HUMAINS).prenom} ${randPick(NOMS_HUMAINS).nom}` : undefined,
      dateRapprochement: avancer(dateReception, 0, 5),
    });
  }
}

// Tickets orphelins : ~3-5% du volume total reste non rapproché / écarté.
const NB_TICKETS_NON_RAPPROCHES = 150;
const NB_TICKETS_IGNORES = 20;
for (let k = 0; k < NB_TICKETS_NON_RAPPROCHES; k++) {
  seqTicket++;
  const ascenseur = randPick(ascenseurs);
  const dateReception = dateIl(0, 0, randInt(5, 4320));
  tickets.push({
    id: `tck-${pad(seqTicket, 6)}`,
    numero: nextTicketNumero(new Date(dateReception).getUTCFullYear()),
    source: randPick(SOURCES_PONDEREES.map(([s]) => s)),
    statut: StatutTicket.NON_RAPPROCHE,
    ascenseurId: randBool(0.7) ? ascenseur.id : undefined,
    dateReception,
    contact: randBool(0.4) ? randPick(['Gardien', 'Locataire']) : undefined,
    canal: randPick(['Téléphone', 'Formulaire web', 'API']),
    messageBrut: randBool(0.5) ? "Signalement reçu, appareil non identifié formellement" : undefined,
  });
}
for (let k = 0; k < NB_TICKETS_IGNORES; k++) {
  seqTicket++;
  const dateReception = dateIl(0, 0, randInt(60, 8640));
  tickets.push({
    id: `tck-${pad(seqTicket, 6)}`,
    numero: nextTicketNumero(new Date(dateReception).getUTCFullYear()),
    source: randPick(SOURCES_PONDEREES.map(([s]) => s)),
    statut: StatutTicket.IGNORE,
    dateReception,
    messageBrut: 'Doublon avec un signalement déjà traité',
  });
}

export { tickets };

function ticketsByInterventionId(interventionId: string): Ticket[] {
  return tickets.filter((t) => t.interventionId === interventionId).sort((a, b) => (a.ordreDansIntervention ?? 0) - (b.ordreDansIntervention ?? 0));
}

// --- Cas limites forcés (section 48 et dashboard temps réel) ---
{
  // 3 interventions "NOUVEAU" ultra-fraîches (quelques minutes) pour le bloc Urgences.
  const nouvelles = interventions.filter((i) => i.statut === StatutIntervention.NOUVEAU);
  const minutesFraiches = [3, 7, 12];
  nouvelles.slice(0, 3).forEach((intervention, idx) => {
    intervention.dateCreation = dateIl(0, 0, minutesFraiches[idx]);
    intervention.motif = MotifIntervention.PERSONNE_BLOQUEE;
    intervention.niveauUrgence = NiveauUrgence.PERSONNE_BLOQUEE;
    intervention.priorite = PrioriteIntervention.CRITIQUE;
    intervention.dateDebutDecompteSLA = intervention.dateCreation;
    intervention.delaiContractuelMinutes = 60;
    intervention.dateLimiteSLA = ajouterMinutes(intervention.dateDebutDecompteSLA, 60);
    const t1 = tickets.find((t) => t.interventionId === intervention.id);
    if (t1) {
      t1.dateReception = intervention.dateCreation;
      t1.dateRapprochement = intervention.dateCreation;
    }
  });

  // 4 interventions BIENTOT_DEPASSE (échéance dans 10-20 min) et 2 DEPASSE, parmi les interventions
  // encore ouvertes sans arrivée sur site constatée (SLA "en direct").
  const ouvertesSansArrivee = interventions.filter((i) => STATUTS_OUVERTS_SANS_ARRIVEE.includes(i.statut) && !nouvelles.slice(0, 3).includes(i));
  const bientotDepassees = ouvertesSansArrivee.slice(0, 4);
  const depassees = ouvertesSansArrivee.slice(4, 6);
  bientotDepassees.forEach((i, idx) => {
    i.dateLimiteSLA = dansLeFutur(0, 0, 10 + idx * 3);
  });
  depassees.forEach((i, idx) => {
    i.dateLimiteSLA = dateIl(0, 0, 20 + idx * 40);
  });

  // Reproduction littérale de l'exemple du cahier (section 7.3) : 4 sources fusionnées.
  const planCanonique = ticketsPlan.find((p) => p.nombreTickets === 4);
  if (planCanonique) {
    planCanonique.intervention.numero = 'INT-2026-001245';
    const ticketsCanoniques = ticketsByInterventionId(planCanonique.intervention.id);
    const sourcesCanoniques = [SourceTicket.SERENITE, SourceTicket.GETRALINE, SourceTicket.APPEL_CLIENT, SourceTicket.APPEL_CLIENT];
    ticketsCanoniques.forEach((t, idx) => {
      t.source = sourcesCanoniques[idx] ?? SourceTicket.APPEL_CLIENT;
      t.contact = idx >= 2 ? 'Gardien' : undefined;
      t.messageBrut = idx === 0 ? 'Alerte automatique Sérénité — arrêt détecté' : idx === 1 ? 'Alerte automatique Getraline — panne signalée' : "Appel client : ascenseur en panne";
    });
  }
}

// --- Réaffectations (~7% + 1% double, sur les interventions déjà affectées à un technicien) ---
const MOTIFS_REAFFECTATION_PONDERES: ReadonlyArray<readonly [MotifReattribution, number]> = [
  [MotifReattribution.INDISPONIBILITE_TECHNICIEN, 45], [MotifReattribution.SURCHARGE_TOURNEE, 20],
  [MotifReattribution.COMPETENCE_INSUFFISANTE, 12], [MotifReattribution.PROXIMITE_GEOGRAPHIQUE, 10],
  [MotifReattribution.ABSENCE, 8], [MotifReattribution.DEMANDE_CLIENT, 5],
];

const reaffectations: Reaffectation[] = [];
let seqReaffectation = 0;

function creerReaffectation(intervention: Intervention, ancienTechId: string, nouveauTechId: string, dateHeure: string): Reaffectation {
  seqReaffectation++;
  const origine = seqReaffectation % 2 === 0 ? OrigineAction.MOBILE : OrigineAction.WEB;
  return {
    id: `reaff-${pad(seqReaffectation, 4)}`,
    cibleType: TypeCiblePlanning.INTERVENTION,
    cibleId: intervention.id,
    ancienTechnicienId: ancienTechId,
    nouveauTechnicienId: nouveauTechId,
    motif: randWeighted(MOTIFS_REAFFECTATION_PONDERES),
    commentaire: randBool(0.4) ? 'Réattribution suite à indisponibilité de dernière minute' : undefined,
    dateHeure,
    origine,
    demandeurNom: origine === OrigineAction.WEB ? randPick(utilisateurs.filter((u) => u.role === RoleUtilisateur.DISPATCHEUR)).nomComplet : undefined,
  };
}

{
  const eligibles = shuffleInPlace(interventions.filter((i) => i.dateAffectation));
  const nbUneReaff = Math.round(eligibles.length * 0.07);
  const nbDeuxReaff = Math.round(eligibles.length * 0.01);

  for (let k = 0; k < nbUneReaff; k++) {
    const intervention = eligibles[k];
    const ancien = randPick(techniciensActifs.filter((t) => t.id !== intervention.technicienId)).id;
    reaffectations.push(creerReaffectation(intervention, ancien, intervention.technicienId!, avancer(intervention.dateAffectation!, 5, 300)));
  }
  for (let k = nbUneReaff; k < nbUneReaff + nbDeuxReaff; k++) {
    const intervention = eligibles[k];
    const intermediaire = randPick(techniciensActifs.filter((t) => t.id !== intervention.technicienId)).id;
    const ancien = randPick(techniciensActifs.filter((t) => t.id !== intervention.technicienId && t.id !== intermediaire)).id;
    const date1 = avancer(intervention.dateAffectation!, 5, 120);
    const date2 = avancer(date1, 5, 180);
    reaffectations.push(creerReaffectation(intervention, ancien, intermediaire, date1));
    reaffectations.push(creerReaffectation(intervention, intermediaire, intervention.technicienId!, date2));
  }
}

export { reaffectations };

function reaffectationsByCible(cibleType: TypeCiblePlanning, cibleId: string): Reaffectation[] {
  return reaffectations.filter((r) => r.cibleType === cibleType && r.cibleId === cibleId).sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
}

// --- Réaffectation née hors ligne (mobile, motif ACCES_IMPOSSIBLE) — voir section mobile plus bas ---
const ID_ELEMENT_SYNC_REAFFECTATION_MOBILE = 'efs-mobile-reaffect-01';
{
  const cibleMobile = interventions.find((i) => i.technicienId === TECH_SCENARIO_REAFFECTATION_MOBILE) ?? interventions[100];
  const ancien = randPick(techniciensActifs.filter((t) => t.id !== TECH_SCENARIO_REAFFECTATION_MOBILE)).id;
  cibleMobile.technicienId = TECH_SCENARIO_REAFFECTATION_MOBILE;
  seqReaffectation++;
  reaffectations.push({
    id: `reaff-${pad(seqReaffectation, 4)}`,
    cibleType: TypeCiblePlanning.INTERVENTION,
    cibleId: cibleMobile.id,
    ancienTechnicienId: ancien,
    nouveauTechnicienId: TECH_SCENARIO_REAFFECTATION_MOBILE,
    motif: MotifReattribution.ACCES_IMPOSSIBLE,
    commentaire: "Je ne peux pas traiter cette intervention : accès au bâtiment impossible",
    dateHeure: dateIl(0, 1, 10),
    origine: OrigineAction.MOBILE,
    elementFileSynchronisationId: ID_ELEMENT_SYNC_REAFFECTATION_MOBILE,
  });
}

// ============================================================================
// 10. ABSENCES TECHNICIEN (~14, avec remplacement pour quelques-unes)
// ============================================================================

export const absencesTechnicien: AbsenceTechnicien[] = Array.from({ length: 14 }, (_, i) => {
  const technicien = techniciensActifs[i * 4 % techniciensActifs.length];
  const type = randWeighted<TypeAbsence>([[TypeAbsence.CONGE, 50], [TypeAbsence.MALADIE, 25], [TypeAbsence.FORMATION, 20], [TypeAbsence.AUTRE, 5]]);
  const dateDebutJours = randInt(-10, 20);
  const duree = randInt(1, 12);
  const statut =
    dateDebutJours + duree < 0 ? StatutAbsence.TERMINEE : dateDebutJours > 0 ? StatutAbsence.PLANIFIEE : StatutAbsence.EN_COURS;
  const remplacant = i < 5 ? randPick(techniciensActifs.filter((t) => t.id !== technicien.id)) : undefined;
  return {
    id: `abs-${pad(i + 1, 3)}`,
    technicienId: technicien.id,
    type,
    dateDebut: dateIl(-dateDebutJours).slice(0, 10),
    dateFin: dateIl(-(dateDebutJours + duree)).slice(0, 10),
    statut,
    remplacantId: remplacant?.id,
    commentaire: type === TypeAbsence.MALADIE ? 'Arrêt de travail transmis par le technicien' : undefined,
    tachesTransfereesIds: [],
  };
});

// ============================================================================
// 11. RÉFÉRENTIELS DE DIAGNOSTIC (chaîne équipement → état → action)
// ============================================================================

export const equipementsReferentiel: EquipementReferentiel[] = [
  { id: 'equ-01', code: 'moteur_treuil', libelle: 'Moteur / treuil', actif: true, ordreAffichage: 1, modifiable: true, localsCompatibles: [LocalDiagnostic.LOCAL_MACHINERIE] },
  { id: 'equ-02', code: 'porte_palliere', libelle: 'Porte palière', actif: true, ordreAffichage: 2, modifiable: true, localsCompatibles: [LocalDiagnostic.PORTES_PALIERES] },
  { id: 'equ-03', code: 'porte_cabine', libelle: 'Porte cabine', actif: true, ordreAffichage: 3, modifiable: true, localsCompatibles: [LocalDiagnostic.CABINE] },
  { id: 'equ-04', code: 'variateur', libelle: 'Variateur de vitesse', actif: true, ordreAffichage: 4, modifiable: true, localsCompatibles: [LocalDiagnostic.ARMOIRE_COMMANDE] },
  { id: 'equ-05', code: 'cable_traction', libelle: 'Câble de traction', actif: true, ordreAffichage: 5, modifiable: true, localsCompatibles: [LocalDiagnostic.GAINE, LocalDiagnostic.TOIT_CABINE] },
  { id: 'equ-06', code: 'limiteur_vitesse', libelle: 'Limiteur de vitesse / parachute', actif: true, ordreAffichage: 6, modifiable: true, localsCompatibles: [LocalDiagnostic.FOSSE, LocalDiagnostic.LOCAL_MACHINERIE] },
];

export const etatsEquipementReferentiel: EtatEquipementReferentiel[] = [
  { id: 'etq-01', code: 'usure_avancee', libelle: 'Usure avancée', actif: true, ordreAffichage: 1, modifiable: true, equipementIds: ['equ-01', 'equ-05'], indiquePieceCassee: false },
  { id: 'etq-02', code: 'piece_cassee', libelle: 'Pièce cassée', actif: true, ordreAffichage: 2, modifiable: true, equipementIds: ['equ-02', 'equ-03'], indiquePieceCassee: true },
  { id: 'etq-03', code: 'defaut_reglage', libelle: 'Défaut de réglage', actif: true, ordreAffichage: 3, modifiable: true, equipementIds: ['equ-04', 'equ-06'], indiquePieceCassee: false },
  { id: 'etq-04', code: 'defaut_electrique', libelle: 'Défaut électrique', actif: true, ordreAffichage: 4, modifiable: true, equipementIds: ['equ-04'], indiquePieceCassee: false },
];

export const actionsDiagnosticReferentiel: ActionDiagnosticReferentiel[] = [
  { id: 'act-01', code: 'remplacement', libelle: 'Remplacement de la pièce', actif: true, ordreAffichage: 1, modifiable: true, etatIds: ['etq-01', 'etq-02'], necessitePieceDetachee: true },
  { id: 'act-02', code: 'reglage', libelle: 'Réglage sur site', actif: true, ordreAffichage: 2, modifiable: true, etatIds: ['etq-03'], necessitePieceDetachee: false },
  { id: 'act-03', code: 'reparation_provisoire', libelle: 'Réparation provisoire, retour prévu', actif: true, ordreAffichage: 3, modifiable: true, etatIds: ['etq-01', 'etq-04'], necessitePieceDetachee: true },
];

export const reglesObligationPhotos: RegleObligationPhotos[] = [
  { id: 'rop-01', typeRapport: TypeRapport.DEPANNAGE, nombreMinimal: 1, avantApresObligatoire: false, photoObligatoireSiPieceCassee: true, photoObligatoireSiReserveCtq: true },
  { id: 'rop-02', typeRapport: TypeRapport.MAINTENANCE, nombreMinimal: 0, avantApresObligatoire: false, photoObligatoireSiPieceCassee: true, photoObligatoireSiReserveCtq: true },
  { id: 'rop-03', typeRapport: TypeRapport.DIVERS, nombreMinimal: 0, avantApresObligatoire: false, photoObligatoireSiPieceCassee: false, photoObligatoireSiReserveCtq: true },
];

// ============================================================================
// 12. RAPPORTS (échantillon curé de ~350 objets complets) + PHOTOS + AGRÉGATS
// ============================================================================

/** Pool mutualisé de 18 URLs de placeholders génériques — jamais une image unique par rapport. */
const POOL_URLS_PHOTOS = Array.from({ length: 18 }, (_, i) => `https://picsum.photos/seed/manei-lift-${pad(i + 1, 2)}/640/480`);

export const photosRapport: PhotoRapport[] = [];
let seqPhoto = 0;

function ajouterPhoto(rapportId: string, technicienId: string, categorie: CategoriePhoto, dateHeure: string, reserveCtqId?: string): string {
  seqPhoto++;
  const id = `photo-${pad(seqPhoto, 4)}`;
  photosRapport.push({
    id,
    rapportId,
    url: randPick(POOL_URLS_PHOTOS),
    categorie,
    legende: categorie === CategoriePhoto.PIECE_CASSEE ? 'Pièce endommagée constatée sur site' : undefined,
    dateHeure,
    technicienId,
    reserveCtqId,
  });
  return id;
}

const rapports: Rapport[] = [];
let seqRapport = 0;
let idPhotoReserveCtqExemple: string | undefined;

interface OptionsRapport {
  rattachement: RattachementRapport;
  interventionId?: string;
  numeroPassageIntervention?: number;
  maintenanceId?: string;
  motifRapportIsole?: string;
  typeRapport: TypeRapport;
  ascenseur: Ascenseur;
  technicien: Technicien;
  dateHeureDebut: string;
  dureeMinutes?: number;
  accesObtenu?: boolean;
  motifRefus?: MotifNonAcces;
  etatCloture?: StatutAppareil;
  etagesModeDegrade?: string[];
  statutValidation?: StatutValidationRapport;
  commentaireRefusValidation?: string;
  avecReserveCtqPhoto?: boolean;
  operationsMaintenance?: CategorieMaintenance[];
}

function construireRapport(opts: OptionsRapport): Rapport {
  seqRapport++;
  const id = `rap-${pad(seqRapport, 4)}`;
  const numero = `RAP-${new Date(opts.dateHeureDebut).getUTCFullYear()}-${pad(348000 + seqRapport, 6)}`;
  const accesObtenu = opts.accesObtenu ?? true;
  const dureeMinutes = opts.dureeMinutes ?? randInt(20, 90);
  const dateHeureFin = ajouterMinutes(opts.dateHeureDebut, dureeMinutes);

  let refusAcces: RefusAcces | undefined;
  let etatInitial: StatutAppareil | undefined;
  let diagnostic: DiagnosticProgressif | undefined;
  let etatCloture: StatutAppareil | undefined;
  let etagesModeDegrade: string[] | undefined;
  const photoIds: string[] = [];

  if (!accesObtenu) {
    refusAcces = {
      motif: opts.motifRefus ?? randPick(MOTIFS_NON_ACCES_POOL),
      commentaire: "Le technicien s'est déplacé mais n'a pas pu accéder à l'appareil",
      heureConstat: opts.dateHeureDebut,
    };
  } else {
    etatInitial = randWeighted([[StatutAppareil.EN_PANNE, 55], [StatutAppareil.A_L_ARRET, 20], [StatutAppareil.MODE_DEGRADE, 15], [StatutAppareil.EN_SERVICE, 10]]);
    const local = randPick([LocalDiagnostic.LOCAL_MACHINERIE, LocalDiagnostic.PORTES_PALIERES, LocalDiagnostic.CABINE, LocalDiagnostic.ARMOIRE_COMMANDE, LocalDiagnostic.GAINE]);
    const equipement = equipementsReferentiel.find((e) => e.localsCompatibles.includes(local)) ?? equipementsReferentiel[0];
    const etat = etatsEquipementReferentiel.find((e) => e.equipementIds.includes(equipement.id)) ?? etatsEquipementReferentiel[0];
    const action = actionsDiagnosticReferentiel.find((a) => a.etatIds.includes(etat.id)) ?? actionsDiagnosticReferentiel[0];
    diagnostic = {
      origine: randWeighted([[OrigineDiagnostic.USURE, 35], [OrigineDiagnostic.DEFAUT_ELECTRIQUE, 20], [OrigineDiagnostic.DEFAUT_MECANIQUE, 20], [OrigineDiagnostic.VETUSTE, 15], [OrigineDiagnostic.VANDALISME, 5], [OrigineDiagnostic.AUTRE, 5]]),
      etage: randPick(opts.ascenseur.ficheTechnique.niveauxDesservis).code,
      local,
      equipementId: equipement.id,
      equipementLibelle: equipement.libelle,
      etatConstateId: etat.id,
      etatConstateLibelle: etat.libelle,
      actionId: action.id,
      actionLibelle: action.libelle,
      commentaireDiagnostic: 'Diagnostic réalisé conformément à la procédure standard',
    };
    etatCloture = opts.etatCloture ?? randWeighted([[StatutAppareil.EN_SERVICE, 85], [StatutAppareil.ARRET_TRAVAUX, 8], [StatutAppareil.MODE_DEGRADE, 7]]);
    etagesModeDegrade = etatCloture === StatutAppareil.MODE_DEGRADE ? (opts.etagesModeDegrade ?? ['RDC', '1']) : undefined;

    photoIds.push(ajouterPhoto(id, opts.technicien.id, CategoriePhoto.AVANT_INTERVENTION, opts.dateHeureDebut));
    if (etat.indiquePieceCassee) photoIds.push(ajouterPhoto(id, opts.technicien.id, CategoriePhoto.PIECE_CASSEE, opts.dateHeureDebut));
    photoIds.push(ajouterPhoto(id, opts.technicien.id, CategoriePhoto.APRES_INTERVENTION, dateHeureFin));
    if (opts.avecReserveCtqPhoto) {
      const idPhoto = ajouterPhoto(id, opts.technicien.id, CategoriePhoto.RESERVE_CTQ, dateHeureFin);
      photoIds.push(idPhoto);
      idPhotoReserveCtqExemple = idPhoto;
    }
  }

  const statutValidation = opts.statutValidation ?? StatutValidationRapport.VALIDE;

  return {
    id,
    numero,
    rattachement: opts.rattachement,
    interventionId: opts.interventionId,
    numeroPassageIntervention: opts.numeroPassageIntervention,
    maintenanceId: opts.maintenanceId,
    motifRapportIsole: opts.motifRapportIsole,
    typeRapport: opts.typeRapport,
    ascenseurId: opts.ascenseur.id,
    adresseAppareil: opts.ascenseur.adresseComplete,
    technicienId: opts.technicien.id,
    technicienNom: opts.technicien.nomComplet,
    dateHeureDebut: opts.dateHeureDebut,
    dateHeureFin,
    dureeMinutes,
    accesObtenu,
    refusAcces,
    etatInitial,
    diagnostic,
    operationsMaintenance: opts.operationsMaintenance,
    resultatTestTelealarme: opts.operationsMaintenance ? randWeighted([[ResultatTestTelealarme.FONCTIONNELLE, 92], [ResultatTestTelealarme.DEFAILLANTE, 8]]) : undefined,
    etatCloture,
    etagesModeDegrade,
    commentaireCloture: accesObtenu ? 'Appareil remis en service, essais concluants' : undefined,
    commentaire: accesObtenu ? 'Intervention réalisée conformément au diagnostic' : "Aucune intervention réalisée, accès impossible",
    commentaireSaisieVocale: randBool(0.15),
    photoIds,
    signatureTechnicien: { technicienId: opts.technicien.id, dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+', dateHeure: dateHeureFin },
    signatureClient: accesObtenu
      ? randWeighted<SignatureClient>([
          [{ statut: StatutSignatureClient.SIGNE, nomSignataire: 'Gardien du site', dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+', dateHeure: dateHeureFin }, 75],
          [{ statut: StatutSignatureClient.ABSENT, motifAbsenceOuIndisponibilite: 'Aucun interlocuteur présent sur site', dateHeure: dateHeureFin }, 15],
          [{ statut: StatutSignatureClient.INDISPONIBLE, motifAbsenceOuIndisponibilite: 'Signature électronique indisponible sur site', dateHeure: dateHeureFin }, 10],
        ])
      : { statut: StatutSignatureClient.ABSENT, motifAbsenceOuIndisponibilite: "Accès refusé, pas d'interlocuteur", dateHeure: dateHeureFin },
    origineSaisie: OrigineAction.MOBILE,
    statutSynchronisation: StatutSynchronisation.SYNCHRONISE,
    statutValidation,
    commentaireRefus: statutValidation === StatutValidationRapport.REFUSE_A_CORRIGER ? (opts.commentaireRefusValidation ?? 'Diagnostic incomplet, merci de préciser le local concerné') : undefined,
  };
}

// --- Échantillon issu des interventions (dépannage) ---
const STATUTS_RAPPORT_ELIGIBLES: StatutIntervention[] = [StatutIntervention.CLOTURE, StatutIntervention.A_VALIDER, StatutIntervention.TERMINE];
const interventionsPourRapport = shuffleInPlace(
  interventions.filter((i) => STATUTS_RAPPORT_ELIGIBLES.includes(i.statut) && i.technicienId && i.dateArriveeSite)
).slice(0, 260);

const NB_REJETS_SECOND_CYCLE = 8;
interventionsPourRapport.forEach((intervention, idx) => {
  const ascenseur = ascenseurById(intervention.ascenseurId);
  const technicien = techniciens.find((t) => t.id === intervention.technicienId)!;
  const estRejetDoubleCycle = idx < NB_REJETS_SECOND_CYCLE && intervention.statut !== StatutIntervention.TERMINE;

  if (estRejetDoubleCycle) {
    const premierPassage = construireRapport({
      rattachement: RattachementRapport.INTERVENTION,
      interventionId: intervention.id,
      numeroPassageIntervention: 1,
      typeRapport: TypeRapport.DEPANNAGE,
      ascenseur,
      technicien,
      dateHeureDebut: avancer(intervention.dateArriveeSite!, -60, -30),
      dureeMinutes: randInt(20, 60),
      accesObtenu: true,
      statutValidation: StatutValidationRapport.REFUSE_A_CORRIGER,
    });
    rapports.push(premierPassage);
    rapports.push(
      construireRapport({
        rattachement: RattachementRapport.INTERVENTION,
        interventionId: intervention.id,
        numeroPassageIntervention: 2,
        typeRapport: TypeRapport.DEPANNAGE,
        ascenseur,
        technicien,
        dateHeureDebut: intervention.dateArriveeSite!,
        dureeMinutes: intervention.dureeInterventionMinutes,
        accesObtenu: !intervention.accesRefuse,
        motifRefus: intervention.accesRefuse ? (intervention.motifAccesRefuse as MotifNonAcces) : undefined,
        etatCloture: intervention.etatAppareilFinal,
        statutValidation: intervention.statut === StatutIntervention.CLOTURE ? StatutValidationRapport.VALIDE : StatutValidationRapport.EN_ATTENTE,
      })
    );
    return;
  }

  rapports.push(
    construireRapport({
      rattachement: RattachementRapport.INTERVENTION,
      interventionId: intervention.id,
      numeroPassageIntervention: 1,
      typeRapport: TypeRapport.DEPANNAGE,
      ascenseur,
      technicien,
      dateHeureDebut: intervention.dateArriveeSite!,
      dureeMinutes: intervention.dureeInterventionMinutes,
      accesObtenu: !intervention.accesRefuse,
      motifRefus: intervention.accesRefuse ? (intervention.motifAccesRefuse as MotifNonAcces) : undefined,
      etatCloture: intervention.etatAppareilFinal,
      statutValidation:
        intervention.statut === StatutIntervention.CLOTURE ? StatutValidationRapport.VALIDE : StatutValidationRapport.EN_ATTENTE,
      avecReserveCtqPhoto: idx === 30,
      etagesModeDegrade: idx === 31 ? ['RDC', '1', '2'] : undefined,
    })
  );
  if (idx === 31) rapports[rapports.length - 1].etatCloture = StatutAppareil.MODE_DEGRADE;
});

// --- Échantillon issu des maintenances ---
const maintenancesPourRapport = shuffleInPlace(maintenances.filter((m) => m.statut === StatutMaintenance.REALISEE)).slice(0, 60);
maintenancesPourRapport.forEach((maintenance) => {
  const ascenseur = ascenseurById(maintenance.ascenseurId);
  const technicien = techniciens.find((t) => t.id === maintenance.technicienId) ?? randPick(techniciensActifs);
  const rapport = construireRapport({
    rattachement: RattachementRapport.MAINTENANCE,
    maintenanceId: maintenance.id,
    typeRapport: TypeRapport.MAINTENANCE,
    ascenseur,
    technicien,
    dateHeureDebut: maintenance.heureDebut ?? maintenance.dateRealisee ?? maintenance.datePrevue,
    dureeMinutes: maintenance.dureeReelleMinutes,
    accesObtenu: true,
    etatCloture: StatutAppareil.EN_SERVICE,
    statutValidation: randWeighted([[StatutValidationRapport.VALIDE, 90], [StatutValidationRapport.EN_ATTENTE, 10]]),
    operationsMaintenance: maintenance.categories,
  });
  maintenance.rapportId = rapport.id;
  rapports.push(rapport);
});

// --- Rapports isolés (hors tournée, sans intervention/maintenance préexistante — section 33) ---
const MOTIFS_RAPPORT_ISOLE = [
  'Visite de courtoisie demandée par le syndic', 'Contrôle libre suite à observation du gardien',
  'Vérification ponctuelle hors planning', "Passage suite à remarque de l'exploitant",
];
for (let k = 0; k < 12; k++) {
  const ascenseur = randPick(ascenseurs);
  const technicien = ascenseur.technicienAffecteId ? techniciens.find((t) => t.id === ascenseur.technicienAffecteId)! : randPick(techniciensActifs);
  rapports.push(
    construireRapport({
      rattachement: RattachementRapport.ISOLE,
      motifRapportIsole: randPick(MOTIFS_RAPPORT_ISOLE),
      typeRapport: TypeRapport.DIVERS,
      ascenseur,
      technicien,
      dateHeureDebut: dateIl(randInt(1, 200)),
      accesObtenu: true,
      statutValidation: StatutValidationRapport.VALIDE,
    })
  );
}

export { rapports };

function rapportsByInterventionId(interventionId: string): Rapport[] {
  return rapports.filter((r) => r.interventionId === interventionId).sort((a, b) => (a.numeroPassageIntervention ?? 0) - (b.numeroPassageIntervention ?? 0));
}

// ============================================================================
// 13. AGRÉGATS RAPPORTS (jamais 348 000 objets stockés)
// ============================================================================

/** Total cumulé, CONSTANTE de configuration indépendante de rapports.length. */
const TOTAL_RAPPORTS_CUMULES = 348214;

export const rapportsAgregatGlobal: RapportsAgregatGlobal = {
  totalCumule: TOTAL_RAPPORTS_CUMULES,
  parType: {
    [TypeRapport.DEPANNAGE]: Math.round(TOTAL_RAPPORTS_CUMULES * 0.58),
    [TypeRapport.MAINTENANCE]: Math.round(TOTAL_RAPPORTS_CUMULES * 0.39),
    [TypeRapport.DIVERS]: TOTAL_RAPPORTS_CUMULES - Math.round(TOTAL_RAPPORTS_CUMULES * 0.58) - Math.round(TOTAL_RAPPORTS_CUMULES * 0.39),
  },
  parStatutValidation: {
    [StatutValidationRapport.VALIDE]: Math.round(TOTAL_RAPPORTS_CUMULES * 0.93),
    [StatutValidationRapport.EN_ATTENTE]: Math.round(TOTAL_RAPPORTS_CUMULES * 0.02),
    [StatutValidationRapport.REFUSE_A_CORRIGER]:
      TOTAL_RAPPORTS_CUMULES - Math.round(TOTAL_RAPPORTS_CUMULES * 0.93) - Math.round(TOTAL_RAPPORTS_CUMULES * 0.02),
  },
  parMois: Array.from({ length: 24 }, (_, i) => {
    const d = new Date(MAINTENANT_ISO);
    d.setUTCMonth(d.getUTCMonth() - (23 - i));
    return { mois: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1, 2)}`, count: randInt(11000, 16000) };
  }),
};

/** Compteurs légers par appareil — jamais l'historique complet stocké. */
export interface CompteurRapportsAppareil {
  ascenseurId: string;
  totalRapports: number;
  dernierRapportDate?: string;
  repartitionParType: Record<TypeRapport, number>;
}

export const compteursRapportsParAppareil: CompteurRapportsAppareil[] = ascenseurs.map((asc) => {
  const anneeInstallation = new Date(asc.ficheTechnique.dateInstallation).getUTCFullYear();
  const anciennete = Math.max(1, ANNEE_COURANTE - anneeInstallation);
  const totalDepannage = Math.round(anciennete * randInt(2, 6));
  const totalMaintenance = Math.round(anciennete * randInt(4, 10));
  const totalDivers = randInt(0, 3);
  const rapportsCures = rapports.filter((r) => r.ascenseurId === asc.id);
  const dernierCure = rapportsCures.sort((a, b) => new Date(b.dateHeureDebut).getTime() - new Date(a.dateHeureDebut).getTime())[0];
  return {
    ascenseurId: asc.id,
    totalRapports: totalDepannage + totalMaintenance + totalDivers,
    dernierRapportDate: dernierCure?.dateHeureDebut ?? dateIl(randInt(1, 120)),
    repartitionParType: {
      [TypeRapport.DEPANNAGE]: totalDepannage,
      [TypeRapport.MAINTENANCE]: totalMaintenance,
      [TypeRapport.DIVERS]: totalDivers,
    },
  };
});

/**
 * Génération synthétique paresseuse pour la pagination au-delà de l'échantillon curé.
 * Pure et seedée sur hash(ascenseurId + index) : même entrée, même résultat.
 */
function hashChaine(texte: string): number {
  let h = 0;
  for (let i = 0; i < texte.length; i++) {
    h = (Math.imul(31, h) + texte.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function genererRapportSynthetique(ascenseurId: string, index: number): Rapport {
  const seedLocal = mulberry32(hashChaine(`${ascenseurId}-${index}`));
  const ascenseur = ascenseurs.find((a) => a.id === ascenseurId);
  const technicien = techniciens[seedLocal() * techniciens.length | 0];
  const type = seedLocal() < 0.55 ? TypeRapport.MAINTENANCE : seedLocal() < 0.95 ? TypeRapport.DEPANNAGE : TypeRapport.DIVERS;
  const dateHeureDebut = new Date(Date.now() - Math.floor(seedLocal() * 1500) * JOUR_MS).toISOString();
  const dureeMinutes = 20 + Math.floor(seedLocal() * 70);
  return {
    id: `rap-synth-${ascenseurId}-${index}`,
    numero: `RAP-${new Date(dateHeureDebut).getUTCFullYear()}-${pad(hashChaine(`${ascenseurId}-${index}`) % 999999, 6)}`,
    rattachement: type === TypeRapport.MAINTENANCE ? RattachementRapport.MAINTENANCE : RattachementRapport.ISOLE,
    typeRapport: type,
    ascenseurId,
    adresseAppareil: ascenseur?.adresseComplete ?? '',
    technicienId: technicien.id,
    technicienNom: technicien.nomComplet,
    dateHeureDebut,
    dateHeureFin: ajouterMinutes(dateHeureDebut, dureeMinutes),
    dureeMinutes,
    accesObtenu: true,
    etatInitial: StatutAppareil.EN_PANNE,
    etatCloture: StatutAppareil.EN_SERVICE,
    commentaire: 'Rapport archivé (généré à la demande)',
    photoIds: [],
    origineSaisie: OrigineAction.MOBILE,
    statutSynchronisation: StatutSynchronisation.SYNCHRONISE,
    statutValidation: StatutValidationRapport.VALIDE,
  };
}

const cacheRapportsSynthetiques = new Map<string, Rapport>();
export function genererRapportSynthetiqueMisEnCache(ascenseurId: string, index: number): Rapport {
  const cle = `${ascenseurId}-${index}`;
  const existant = cacheRapportsSynthetiques.get(cle);
  if (existant) return existant;
  const rapport = genererRapportSynthetique(ascenseurId, index);
  cacheRapportsSynthetiques.set(cle, rapport);
  return rapport;
}

// ============================================================================
// 14. CTQ & RÉSERVES (~650 contrôles, ~1 400-1 700 réserves)
// ============================================================================

export const bureauxEtudes: BureauEtudes[] = [
  { id: 'bur-01', nom: 'Bureau Veritas', agrement: 'AGR-BV-2014', contact: 'Service ascenseurs', telephone: telephoneMobile() },
  { id: 'bur-02', nom: 'Apave', agrement: 'AGR-APAVE-2011', contact: 'Pôle levage', telephone: telephoneMobile() },
  { id: 'bur-03', nom: 'Socotec', agrement: 'AGR-SOC-2016', telephone: telephoneMobile() },
  { id: 'bur-04', nom: 'Dekra', agrement: 'AGR-DEKRA-2018', telephone: telephoneMobile() },
  { id: 'bur-05', nom: 'Qualiconsult', agrement: 'AGR-QC-2013', telephone: telephoneMobile() },
  { id: 'bur-06', nom: 'Norisko', agrement: 'AGR-NOR-2019', telephone: telephoneMobile() },
];

const POINTS_PAR_CATEGORIE: Record<CategorieBlocControle, string[]> = {
  [CategorieBlocControle.MACHINERIE]: ['Fixation du moteur', 'État du réducteur', 'Ventilation du local machinerie', 'Éclairage du local machinerie'],
  [CategorieBlocControle.CABINE]: ['État du plancher de cabine', 'Éclairage de secours cabine', 'Ventilation cabine', 'Habillage et miroir'],
  [CategorieBlocControle.PORTES_PALIERES]: ['Étanchéité des portes palières', 'Verrouillage électromécanique', 'Signalétique paliers'],
  [CategorieBlocControle.GAINE_CUVETTE]: ['Propreté de la cuvette', 'Éclairage de gaine', 'Amortisseurs de cuvette'],
  [CategorieBlocControle.DISPOSITIFS_SECURITE]: ['Limiteur de vitesse', 'Parachute', 'Contacts de sécurité des portes'],
  [CategorieBlocControle.TELEALARME]: ['Fonctionnement de la téléalarme', 'Autonomie de la batterie de secours'],
  [CategorieBlocControle.ACCESSIBILITE]: ['Boutons en relief', 'Signalétique braille', 'Main courante cabine'],
  [CategorieBlocControle.DOCUMENTATION]: ['Registre de sécurité à jour', "Carnet d'entretien présent"],
  [CategorieBlocControle.AUTRE]: ['Point de contrôle complémentaire'],
};

const CATEGORIES_BLOC = Object.values(CategorieBlocControle);

function actionDemandeePourCategorie(categorie: CategorieBlocControle): string {
  switch (categorie) {
    case CategorieBlocControle.DISPOSITIFS_SECURITE:
      return 'Remise en conformité du dispositif de sécurité sous 30 jours';
    case CategorieBlocControle.TELEALARME:
      return 'Rétablir le fonctionnement de la téléalarme';
    case CategorieBlocControle.ACCESSIBILITE:
      return 'Mettre en conformité la signalétique accessibilité';
    default:
      return 'Lever la non-conformité constatée lors du prochain passage';
  }
}

function statutReservePondere(joursAnciennete: number): StatutReserve {
  if (joursAnciennete < 60) {
    return randWeighted([[StatutReserve.A_TRAITER, 55], [StatutReserve.PLANIFIEE, 35], [StatutReserve.EN_COURS, 10]]);
  }
  if (joursAnciennete > 365) {
    if (randBool(0.065)) return randWeighted([[StatutReserve.A_TRAITER, 50], [StatutReserve.EN_COURS, 50]]);
    return randWeighted([[StatutReserve.VALIDEE, 90], [StatutReserve.A_CONTROLER, 5], [StatutReserve.TRAITEE, 5]]);
  }
  return randWeighted([
    [StatutReserve.A_TRAITER, 15], [StatutReserve.PLANIFIEE, 15], [StatutReserve.EN_COURS, 20],
    [StatutReserve.TRAITEE, 15], [StatutReserve.A_CONTROLER, 10], [StatutReserve.VALIDEE, 25],
  ]);
}

export const controlesCTQ: ControleCTQ[] = [];
export const reservesCTQ: ReserveCTQ[] = [];
export const evenementsReserve: EvenementReserve[] = [];
let seqControle = 0;
let seqReserve = 0;
let seqEvenementReserve = 0;

function construireEvenementsReserve(reserve: ReserveCTQ): void {
  const chaine: Array<{ statut: StatutReserve; type: TypeEvenementReserve }> = [{ statut: StatutReserve.A_TRAITER, type: TypeEvenementReserve.RESERVE_CREEE }];
  const ordreComplet: Array<{ statut: StatutReserve; type: TypeEvenementReserve }> = [
    { statut: StatutReserve.PLANIFIEE, type: TypeEvenementReserve.RESERVE_PLANIFIEE },
    { statut: StatutReserve.EN_COURS, type: TypeEvenementReserve.TRAITEMENT_DEMARRE },
    { statut: StatutReserve.TRAITEE, type: TypeEvenementReserve.RESERVE_TRAITEE },
    { statut: StatutReserve.A_CONTROLER, type: TypeEvenementReserve.RESERVE_A_CONTROLER },
    { statut: StatutReserve.VALIDEE, type: TypeEvenementReserve.RESERVE_VALIDEE },
  ];
  const indexCible = ordreComplet.findIndex((e) => e.statut === reserve.statut);
  const etapesAJouter = indexCible === -1 ? [] : ordreComplet.slice(0, indexCible + 1);
  chaine.push(...etapesAJouter);

  // ~10% des réserves passées par A_CONTROLER ont connu une contre-visite négative avant validation finale.
  const aEteReouverte = reserve.statut === StatutReserve.VALIDEE && randBool(0.1);
  const dateBase = new Date(reserve.dateConstat).getTime();
  const dateFinale = reserve.dateValidation ? new Date(reserve.dateValidation).getTime() : Date.now();
  const nbEtapes = chaine.length + (aEteReouverte ? 4 : 0);
  const pas = nbEtapes > 1 ? (dateFinale - dateBase) / nbEtapes : 0;

  let compteur = 0;
  for (const etape of chaine) {
    seqEvenementReserve++;
    evenementsReserve.push({
      id: `evres-${pad(seqEvenementReserve, 5)}`,
      reserveId: reserve.id,
      typeEvenement: etape.type,
      dateHeure: new Date(dateBase + pas * compteur).toISOString(),
      nouveauStatut: etape.statut,
      technicienId: reserve.technicienAssigneId,
      origine: OrigineAction.WEB,
    });
    compteur++;
  }
  if (aEteReouverte) {
    const reprises: Array<{ statut: StatutReserve; type: TypeEvenementReserve }> = [
      { statut: StatutReserve.EN_COURS, type: TypeEvenementReserve.RESERVE_REOUVERTE },
      { statut: StatutReserve.EN_COURS, type: TypeEvenementReserve.TRAITEMENT_DEMARRE },
      { statut: StatutReserve.TRAITEE, type: TypeEvenementReserve.RESERVE_TRAITEE },
      { statut: StatutReserve.A_CONTROLER, type: TypeEvenementReserve.RESERVE_A_CONTROLER },
    ];
    for (const etape of reprises) {
      seqEvenementReserve++;
      evenementsReserve.push({
        id: `evres-${pad(seqEvenementReserve, 5)}`,
        reserveId: reserve.id,
        typeEvenement: etape.type,
        dateHeure: new Date(dateBase + pas * compteur).toISOString(),
        nouveauStatut: etape.statut,
        technicienId: reserve.technicienAssigneId,
        commentaire: etape.type === TypeEvenementReserve.RESERVE_REOUVERTE ? 'Contre-visite négative, réserve rouverte' : undefined,
        origine: OrigineAction.WEB,
      });
      compteur++;
    }
    seqEvenementReserve++;
    evenementsReserve.push({
      id: `evres-${pad(seqEvenementReserve, 5)}`,
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.RESERVE_VALIDEE,
      dateHeure: reserve.dateValidation ?? new Date().toISOString(),
      nouveauStatut: StatutReserve.VALIDEE,
      technicienId: reserve.technicienAssigneId,
      origine: OrigineAction.WEB,
    });
  }
}

const NB_CONTROLES_CTQ = 650;
for (let n = 0; n < NB_CONTROLES_CTQ; n++) {
  seqControle++;
  const ascenseur = randPick(ascenseurs);
  const joursDepuisVisite = randInt(-90, 2000); // quelques contrôles à venir (négatif), la majorité passés
  const dateVisite = dateIl(joursDepuisVisite);
  const dateProchainControle = ajouterJours(dateVisite, 5 * 365);
  const bureauEtudes = randPick(bureauxEtudes);
  const controleId = `ctq-${pad(seqControle, 4)}`;

  const nbBlocs = randInt(3, 6);
  const categoriesChoisies = shuffleInPlace([...CATEGORIES_BLOC]).slice(0, nbBlocs);
  if (!categoriesChoisies.includes(CategorieBlocControle.DISPOSITIFS_SECURITE)) categoriesChoisies[0] = CategorieBlocControle.DISPOSITIFS_SECURITE;

  const blocs: BlocControle[] = [];
  const reservesDuControle: ReserveCTQ[] = [];

  categoriesChoisies.forEach((categorie, ordreBloc) => {
    const blocId = `bloc-${controleId}-${ordreBloc + 1}`;
    const libellesPoints = POINTS_PAR_CATEGORIE[categorie];
    const nbPoints = randInt(2, Math.min(4, libellesPoints.length));
    const points: PointDeControle[] = [];

    for (let p = 0; p < nbPoints; p++) {
      const pointId = `pt-${blocId}-${p + 1}`;
      const etat = joursDepuisVisite < 0
        ? EtatPointControle.NON_APPLICABLE
        : randWeighted<EtatPointControle>([[EtatPointControle.CONFORME, 69], [EtatPointControle.NON_CONFORME, 22], [EtatPointControle.NON_APPLICABLE, 6], [EtatPointControle.NON_VERIFIE, 3]]);

      let reserveId: string | undefined;
      if (etat === EtatPointControle.NON_CONFORME) {
        seqReserve++;
        const gravite = randWeighted<GraviteReserve>([[GraviteReserve.MINEURE, 50], [GraviteReserve.MAJEURE, 35], [GraviteReserve.CRITIQUE, 15]]);
        const statut = statutReservePondere(Math.max(0, joursDepuisVisite));
        const technicienAssigne = randBool(0.7) ? randPick(techniciensActifs).id : undefined;
        const dateEcheance = ajouterJours(dateVisite, randInt(30, 180));
        const estTraitee = statut === StatutReserve.TRAITEE || statut === StatutReserve.A_CONTROLER || statut === StatutReserve.VALIDEE;
        const dateTraitement = estTraitee ? ajouterJours(dateVisite, randInt(20, 150)) : undefined;
        const dateValidation = statut === StatutReserve.VALIDEE ? ajouterJours(dateTraitement ?? dateVisite, randInt(5, 60)) : undefined;

        const reserve: ReserveCTQ = {
          id: `res-${pad(seqReserve, 5)}`,
          numero: `RES-${new Date(dateVisite).getUTCFullYear()}-${pad(seqReserve, 5)}`,
          controleId,
          pointDeControleId: pointId,
          appareilId: ascenseur.id,
          clientId: ascenseur.clientId,
          libelleBloc: `${categorie}`,
          description: `Non-conformité constatée : ${libellesPoints[p]}`,
          actionDemandee: actionDemandeePourCategorie(categorie),
          gravite,
          statut,
          dateConstat: dateVisite,
          dateEcheance,
          photosConstatIds: [],
          technicienAssigneId: technicienAssigne,
          traitement: estTraitee ? { type: TypeTraitementReserve.INTERVENTION, id: randPick(interventions).id } : undefined,
          datePlanification: statut !== StatutReserve.A_TRAITER ? ajouterJours(dateVisite, randInt(5, 40)) : undefined,
          dateTraitement,
          commentaireTechnicien: estTraitee ? 'Non-conformité levée, contrôle visuel effectué' : undefined,
          photosTraitementIds: [],
          dateValidation,
          validePar: dateValidation ? 'Bureau de contrôle' : undefined,
        };
        reservesDuControle.push(reserve);
        reserveId = reserve.id;
      }
      points.push({ id: pointId, blocId, libelle: libellesPoints[p], etat, photosConstatIds: [], reserveId });
    }
    blocs.push({ id: blocId, controleId, categorie, libelle: categorie, ordre: ordreBloc + 1, points });
  });

  const statutControle = calculerStatutControle({ id: controleId } as unknown as ControleCTQ, reservesDuControle);
  controlesCTQ.push({
    id: controleId,
    numero: `CTQ-${new Date(dateVisite).getUTCFullYear()}-${pad(seqControle, 4)}`,
    appareilId: ascenseur.id,
    clientId: ascenseur.clientId,
    bureauEtudesId: bureauEtudes.id,
    technicienId: ascenseur.technicienAffecteId,
    dateVisite,
    dateProchainControle,
    statut: reservesDuControle.length === 0 && joursDepuisVisite < 0 ? StatutControleCTQ.PLANIFIE : statutControle,
    nombreReserves: reservesDuControle.length,
    nombreReservesSoldees: reservesDuControle.filter((r) => r.statut === StatutReserve.VALIDEE).length,
    blocs,
    rapportPdfUrl: joursDepuisVisite >= 0 ? `https://reports.manei-lift.fr/ctq/${controleId}.pdf` : undefined,
  });

  for (const reserve of reservesDuControle) {
    reservesCTQ.push(reserve);
    construireEvenementsReserve(reserve);
  }
}

// --- Cas limites CTQ forcés (section 6 de la stratégie) ---
{
  // 1-2 réserves extrêmes proches de 5 ans, jamais traitées.
  const candidatesExtremes = reservesCTQ.filter((r) => r.statut !== StatutReserve.VALIDEE).slice(0, 2);
  candidatesExtremes.forEach((r) => {
    r.dateConstat = dateIl(1750);
    r.statut = StatutReserve.A_TRAITER;
    r.dateEcheance = dateIl(1400);
  });

  // 15-20 réserves CRITIQUE non validées, échéance dépassée ou à moins de 7 jours.
  const critiquesNonValidees = reservesCTQ.filter((r) => r.gravite === GraviteReserve.CRITIQUE && r.statut !== StatutReserve.VALIDEE).slice(0, 18);
  critiquesNonValidees.forEach((r, idx) => {
    r.dateEcheance = idx % 2 === 0 ? dateIl(randInt(1, 15)) : dansLeFutur(randInt(1, 6));
  });

  // Concentration de 20-40 réserves actives sur les 4 techniciens dédiés aux Missions CTQ mobiles.
  const actives = reservesCTQ.filter((r) => r.statut !== StatutReserve.VALIDEE).slice(0, 32);
  actives.forEach((r, idx) => {
    r.technicienAssigneId = TECHS_MISSIONS_CTQ[idx % TECHS_MISSIONS_CTQ.length];
  });
}

function reservesByControleId(controleId: string): ReserveCTQ[] {
  return reservesCTQ.filter((r) => r.controleId === controleId);
}

// ============================================================================
// 15. MOBILE & SYNCHRONISATION — un scénario nommé par technicien de démo
// ============================================================================

export const sessionsTechnicien: SessionTechnicien[] = techniciensActifs.map((tech, i) => {
  const horsLigne = tech.id === TECH_SCENARIO_HORS_LIGNE;
  const syncEnCours = tech.id === TECH_SCENARIO_SYNC_EN_COURS;
  return {
    id: `sess-${pad(i + 1, 3)}`,
    technicienId: tech.id,
    dateDebut: dateIl(0, randInt(6, 9)),
    statut: randBool(0.9) ? StatutSessionTechnicien.EN_COURS : StatutSessionTechnicien.TERMINEE,
    tourneeId: tournees.find((t) => t.technicienTitulaireId === tech.id)?.id,
    etatConnexion: horsLigne ? EtatConnexionMobile.HORS_LIGNE : syncEnCours ? EtatConnexionMobile.SYNCHRONISATION_EN_COURS : EtatConnexionMobile.EN_LIGNE,
    derniereSynchronisationReussie: horsLigne ? dateIl(0, 2) : dateIl(0, 0, randInt(2, 40)),
  };
});

function sessionDuTechnicien(technicienId: string): SessionTechnicien | undefined {
  return sessionsTechnicien.find((s) => s.technicienId === technicienId);
}

export const elementsFileSynchronisation: ElementFileSynchronisation[] = [];
let seqElementSync = 0;
function ajouterElementSync(el: Omit<ElementFileSynchronisation, 'id'>): ElementFileSynchronisation {
  seqElementSync++;
  const complet: ElementFileSynchronisation = { id: `efs-${pad(seqElementSync, 3)}`, ...el };
  elementsFileSynchronisation.push(complet);
  return complet;
}

// Scénario par défaut (technicien ouvert par défaut dans le Centre de synchronisation) : reproduction
// quasi littérale de l'exemple du cahier (section 35).
{
  const tech = TECH_SCENARIO_DEFAUT;
  const session = sessionDuTechnicien(tech)?.id;
  ajouterElementSync({
    type: TypeElementSynchronisation.RAPPORT, entiteId: 'rap-12451', libelleAffichage: 'Rapport #12451', technicienId: tech, sessionTechnicienId: session,
    statut: StatutSynchronisation.SYNCHRONISE, horodatageEvenement: dateIl(0, 1, 10), dateSynchronisationReussie: dateIl(0, 0, 55), nombreTentatives: 1, peutReessayer: false,
  });
  ajouterElementSync({
    type: TypeElementSynchronisation.PHOTO, entiteId: 'photo-885', libelleAffichage: 'Photo #885', technicienId: tech, sessionTechnicienId: session,
    statut: StatutSynchronisation.EN_ATTENTE, horodatageEvenement: dateIl(0, 0, 40), nombreTentatives: 0, peutReessayer: false, tailleOctets: 2_400_000,
  });
  ajouterElementSync({
    type: TypeElementSynchronisation.INTERVENTION, entiteId: 'int-0458', libelleAffichage: 'Intervention #458', technicienId: tech, sessionTechnicienId: session,
    statut: StatutSynchronisation.ENVOI_EN_COURS, horodatageEvenement: dateIl(0, 0, 20), dateDerniereTentative: dateIl(0, 0, 2), nombreTentatives: 1, peutReessayer: false,
  });
  ajouterElementSync({
    type: TypeElementSynchronisation.RAPPORT, entiteId: 'rap-12452', libelleAffichage: 'Rapport #12452', technicienId: tech, sessionTechnicienId: session,
    statut: StatutSynchronisation.ECHEC, horodatageEvenement: dateIl(0, 2, 5), dateDerniereTentative: dateIl(0, 1, 30), nombreTentatives: 3,
    messageErreur: 'Connexion perdue pendant l\'envoi', peutReessayer: true,
  });
}

// Hors ligne, 4 éléments en attente.
{
  const tech = TECH_SCENARIO_HORS_LIGNE;
  const session = sessionDuTechnicien(tech)?.id;
  const types: TypeElementSynchronisation[] = [TypeElementSynchronisation.RAPPORT, TypeElementSynchronisation.PHOTO, TypeElementSynchronisation.MAINTENANCE, TypeElementSynchronisation.RESERVE_CTQ];
  types.forEach((type, idx) => {
    ajouterElementSync({
      type, entiteId: `demo-${tech}-${idx}`, libelleAffichage: `${type} en attente`, technicienId: tech, sessionTechnicienId: session,
      statut: StatutSynchronisation.EN_ATTENTE, horodatageEvenement: dateIl(0, randInt(1, 5)), nombreTentatives: 0, peutReessayer: false,
    });
  });
}

// Synchronisation en cours : mix synchronisé / envoi en cours / en attente.
{
  const tech = TECH_SCENARIO_SYNC_EN_COURS;
  const session = sessionDuTechnicien(tech)?.id;
  ajouterElementSync({ type: TypeElementSynchronisation.RAPPORT, entiteId: `demo-${tech}-1`, libelleAffichage: 'Rapport terrain', technicienId: tech, sessionTechnicienId: session, statut: StatutSynchronisation.SYNCHRONISE, horodatageEvenement: dateIl(0, 0, 30), dateSynchronisationReussie: dateIl(0, 0, 10), nombreTentatives: 1, peutReessayer: false });
  ajouterElementSync({ type: TypeElementSynchronisation.PHOTO, entiteId: `demo-${tech}-2`, libelleAffichage: 'Photo avant/après', technicienId: tech, sessionTechnicienId: session, statut: StatutSynchronisation.ENVOI_EN_COURS, horodatageEvenement: dateIl(0, 0, 8), nombreTentatives: 1, peutReessayer: false });
  ajouterElementSync({ type: TypeElementSynchronisation.MODIFICATION_FICHE_TECHNIQUE, entiteId: `demo-${tech}-3`, libelleAffichage: 'Fiche technique modifiée', technicienId: tech, sessionTechnicienId: session, statut: StatutSynchronisation.EN_ATTENTE, horodatageEvenement: dateIl(0, 0, 3), nombreTentatives: 0, peutReessayer: false });
}

// Réaffectation née hors ligne (motif ACCES_IMPOSSIBLE) — cross-lien avec la Reaffectation créée plus haut.
{
  const tech = TECH_SCENARIO_REAFFECTATION_MOBILE;
  const session = sessionDuTechnicien(tech)?.id;
  const elementReaffect: ElementFileSynchronisation = {
    id: ID_ELEMENT_SYNC_REAFFECTATION_MOBILE, type: TypeElementSynchronisation.REATTRIBUTION_INTERVENTION, entiteId: reaffectations[reaffectations.length - 1].id,
    libelleAffichage: 'Réattribution intervention (accès impossible)', technicienId: tech, sessionTechnicienId: session,
    statut: StatutSynchronisation.SYNCHRONISE, horodatageEvenement: dateIl(0, 1, 10), dateSynchronisationReussie: dateIl(0, 0, 58), nombreTentatives: 1, peutReessayer: false,
  };
  elementsFileSynchronisation.push(elementReaffect);

  // Exemple canonique digicode 4521 → 8754 côté mobile (en_attente), en écho à l'audit déjà SYNCHRONISE.
  ajouterElementSync({
    type: TypeElementSynchronisation.MODIFICATION_FICHE_TECHNIQUE, entiteId: entreesJournalModification[entreesJournalModification.length - 1].id,
    libelleAffichage: 'Digicode modifié (4521 → 8754)', technicienId: tech, sessionTechnicienId: session,
    statut: StatutSynchronisation.EN_ATTENTE, horodatageEvenement: dateIl(0, 0, 20), nombreTentatives: 0, peutReessayer: false,
  });
}

function elementsSyncDuTechnicien(technicienId: string): ElementFileSynchronisation[] {
  return elementsFileSynchronisation.filter((e) => e.technicienId === technicienId);
}

export const appareilsTelechargesLocalement: AppareilTelechargeLocalement[] = [];
for (const tech of techniciensActifs.slice(0, 20)) {
  const tournee = tournees.find((t) => t.technicienTitulaireId === tech.id);
  const appareilsTournee = tournee ? ascenseurs.filter((a) => a.tourneeId === tournee.id).slice(0, randInt(3, 6)) : [];
  for (const asc of appareilsTournee) {
    appareilsTelechargesLocalement.push({
      appareilId: asc.id, technicienId: tech.id, dateTelechargement: dateIl(0, randInt(6, 10)),
      origine: OrigineTelechargementAppareil.TOURNEE,
    });
  }
}

export const configurationsPTI: Record<string, ConfigurationPTI> = {};
export const etatsPTITechnicien: EtatPTITechnicien[] = techniciensActifs.map((tech) => {
  const modeTiers = tech.id === TECH_SCENARIO_PTI_TIERS;
  const config: ConfigurationPTI = modeTiers
    ? { mode: ModePTI.INTEGRATION_SERVICE_TIERS, fournisseurExterne: 'Atlantic PTI Services', urlServiceExterne: 'https://pti.atlantic-services.example/api' }
    : { mode: ModePTI.MODULE_INTERNE };
  configurationsPTI[tech.id] = config;

  if (tech.id === TECH_SCENARIO_FILE_VIDE_PTI_REACTIVATION) {
    return {
      technicienId: tech.id, sessionTechnicienId: sessionDuTechnicien(tech.id)?.id, mode: config.mode,
      etat: EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS, dateDernierChangementEtat: dateIl(0, 0, 3),
      finCompteARebours: dansLeFutur(0, 0, 2), dureeInhibitionSecondes: 300,
    };
  }
  return {
    technicienId: tech.id, sessionTechnicienId: sessionDuTechnicien(tech.id)?.id, mode: config.mode,
    etat: EtatProtectionPTI.PROTECTION_ACTIVE, dateDernierChangementEtat: dateIl(0, randInt(1, 8)),
    identifiantAbonneExterne: modeTiers ? `PTI-${tech.id.toUpperCase()}` : undefined,
  };
});

// ============================================================================
// 16. CARTOGRAPHIE — positions, zones et tournées du jour
// ============================================================================

const STATUTS_PRESENCE_PONDERES: ReadonlyArray<readonly [StatutPresenceTechnicien, number]> = [
  [StatutPresenceTechnicien.EN_LIGNE, 65], [StatutPresenceTechnicien.EN_PAUSE, 15], [StatutPresenceTechnicien.HORS_LIGNE, 20],
];

// Ville "d'ancrage" de chaque technicien (celle de sa tournée titulaire, sinon
// une ville tirée une seule fois) — réutilisée par tourneesDuJour ci-dessous
// pour qu'un technicien sans tournée titulaire ne se voie jamais attribuer des
// arrêts dispersés dans tout le pays.
const villeAncrageParTechnicien = new Map<string, string>();

export const positionsTechnicien: PositionTechnicien[] = techniciensActifs.map((tech) => {
  const tournee = tournees.find((t) => t.technicienTitulaireId === tech.id);
  const nomVille = tournee?.ville ?? randPick(VILLES).nom;
  villeAncrageParTechnicien.set(tech.id, nomVille);
  const ville = villeParNom(nomVille);
  const horsLigne = tech.id === TECH_SCENARIO_HORS_LIGNE;
  return {
    technicienId: tech.id,
    coordonnees: jitterCoordonnees(ville),
    horodatage: dateIl(0, 0, randInt(1, 25)),
    statutPresence: horsLigne ? StatutPresenceTechnicien.HORS_LIGNE : randWeighted(STATUTS_PRESENCE_PONDERES),
    tourneeDuJourId: tournee ? `tdj-${tech.id}` : undefined,
    precisionMetres: randInt(5, 40),
  };
});

export const zonesGeographiques: ZoneGeographique[] = [
  ...secteursGeographiques.map((secteur, i) => {
    const ville = villeParNom(secteur.villesCouvertes[0]);
    const tournee = tournees.find((t) => t.secteurId === secteur.id);
    return {
      id: `zone-${pad(i + 1, 2)}`,
      nom: secteur.nom,
      type: TypeZoneGeographique.SECTEUR_TECHNICIEN,
      couleur: COULEURS_TOURNEE[i % COULEURS_TOURNEE.length],
      contour: [
        { latitude: ville.latitude + 0.03, longitude: ville.longitude - 0.03 },
        { latitude: ville.latitude + 0.03, longitude: ville.longitude + 0.03 },
        { latitude: ville.latitude - 0.03, longitude: ville.longitude + 0.03 },
        { latitude: ville.latitude - 0.03, longitude: ville.longitude - 0.03 },
      ],
      technicienResponsableId: tournee?.technicienTitulaireId,
      secteurId: secteur.id,
    };
  }),
  {
    id: 'zone-com-01', nom: 'Zone commerciale Île-de-France', type: TypeZoneGeographique.ZONE_COMMERCIALE, couleur: '#f97316',
    contour: [{ latitude: 48.9, longitude: 2.2 }, { latitude: 48.9, longitude: 2.5 }, { latitude: 48.8, longitude: 2.5 }, { latitude: 48.8, longitude: 2.2 }],
  },
  {
    id: 'zone-com-02', nom: 'Zone commerciale Lyon', type: TypeZoneGeographique.ZONE_COMMERCIALE, couleur: '#f97316',
    contour: [{ latitude: 45.8, longitude: 4.8 }, { latitude: 45.8, longitude: 4.9 }, { latitude: 45.7, longitude: 4.9 }, { latitude: 45.7, longitude: 4.8 }],
  },
];

export const tourneesDuJour: TourneeDuJour[] = positionsTechnicien
  .filter((p) => p.statutPresence !== StatutPresenceTechnicien.HORS_LIGNE)
  .map((pos) => {
    const tech = techniciens.find((t) => t.id === pos.technicienId)!;
    const tournee = tournees.find((t) => t.technicienTitulaireId === tech.id);
    const appareilsTournee = tournee ? ascenseurs.filter((a) => a.tourneeId === tournee.id) : ascenseurs.filter((a) => a.technicienAffecteId === tech.id);
    const nbEtapes = Math.min(Math.max(4, appareilsTournee.length), 8);
    // Secours géographique : si la tournée n'a pas assez d'appareils qui lui
    // sont propres, on complète avec des appareils de la ville d'ancrage du
    // technicien (sa tournée titulaire si elle existe, sinon la ville tirée
    // pour lui dans positionsTechnicien) plutôt que du parc entier, pour ne
    // jamais tracer une tournée qui saute d'une région à l'autre sur la carte
    // (section 13).
    const villeAncrage = tournee?.ville ?? villeAncrageParTechnicien.get(tech.id);
    const poolSecours = villeAncrage ? ascenseurs.filter((a) => a.ville === villeAncrage) : appareilsTournee;
    const appareilsEtapes =
      appareilsTournee.length >= nbEtapes
        ? appareilsTournee.slice(0, nbEtapes)
        : Array.from({ length: nbEtapes }, () => randPick(poolSecours.length > 0 ? poolSecours : ascenseurs));
    const nbTerminees = randInt(1, nbEtapes - 1);
    const etapes: EtapeTournee[] = appareilsEtapes.map((asc, idx) => {
      const ville = villeParNom(asc.ville);
      const statut = idx < nbTerminees ? StatutEtapeTournee.TERMINEE : idx === nbTerminees ? StatutEtapeTournee.EN_COURS : StatutEtapeTournee.A_VENIR;
      return {
        ordre: idx + 1,
        appareilId: asc.id,
        coordonnees: jitterCoordonnees(ville),
        heurePrevue: dateIl(0, 8 - idx),
        heureReelle: statut === StatutEtapeTournee.TERMINEE ? dateIl(0, 8 - idx, randInt(-10, 10)) : undefined,
        statut,
      };
    });
    return { id: `tdj-${tech.id}`, tourneeId: tournee?.id, technicienId: tech.id, date: MAINTENANT_ISO.slice(0, 10), zoneId: undefined, etapes };
  });

// ============================================================================
// 17. TÂCHES ASYNCHRONES, NOTIFICATIONS & AUDIT (curatés)
// ============================================================================

function idAdmin(index: number): string {
  return utilisateurs.find((u) => u.role === RoleUtilisateur.ADMINISTRATEUR)?.id ?? utilisateurs[index]?.id ?? 'usr-001';
}

/** Durée estimée (minutes) pour les tâches EN_COURS, utilisée par le store pour calculer la progression à la lecture. */
export const dureesEstimeesTachesAsynchrones: Record<string, number> = {};

export const tachesAsynchrones: TacheAsynchrone[] = [
  { id: 'tache-01', type: TypeTacheAsynchrone.EXPORT_HISTORIQUE_CLIENT, libelle: 'Export historique — Unibail-Rodamco-Westfield', statut: StatutTacheAsynchrone.TERMINE, progression: 100, nombreElementsTotal: 1240, nombreElementsTraites: 1240, demandeParUtilisateurId: idAdmin(0), worker: WorkerTraitement.EXPORT, dateDemande: dateIl(2, 3), dateDebutTraitement: dateIl(2, 3), dateFin: dateIl(2, 2), resultat: { urlTelechargement: 'https://exports.manei-lift.fr/hist-cli-001.zip', nomFichier: 'historique-unibail.zip', formatFichier: FormatFichierExport.ZIP, tailleOctets: 18_400_000 } },
  { id: 'tache-02', type: TypeTacheAsynchrone.EXPORT_DONNEES_PARC, libelle: 'Export parc — Tour First', statut: StatutTacheAsynchrone.TERMINE, progression: 100, demandeParUtilisateurId: idAdmin(1), worker: WorkerTraitement.EXPORT, dateDemande: dateIl(5), dateDebutTraitement: dateIl(5), dateFin: dateIl(5), resultat: { urlTelechargement: 'https://exports.manei-lift.fr/parc-005.csv', nomFichier: 'parc-tour-first.csv', formatFichier: FormatFichierExport.CSV, tailleOctets: 340_000 } },
  { id: 'tache-03', type: TypeTacheAsynchrone.GENERATION_RAPPORT_PERIODIQUE, libelle: 'Rapport périodique mensuel — Août 2026', statut: StatutTacheAsynchrone.TERMINE, progression: 100, demandeParUtilisateurId: idAdmin(2), worker: WorkerTraitement.STATISTIQUES, dateDemande: dateIl(15), dateDebutTraitement: dateIl(15), dateFin: dateIl(15), resultat: { urlTelechargement: 'https://exports.manei-lift.fr/rapport-aout-2026.pdf', nomFichier: 'rapport-aout-2026.pdf', formatFichier: FormatFichierExport.PDF, tailleOctets: 2_100_000 } },
  { id: 'tache-04', type: TypeTacheAsynchrone.GENERATION_PDF_UNITAIRE, libelle: `Génération PDF — ${rapports[0]?.numero ?? 'RAP-2026-000001'}`, statut: StatutTacheAsynchrone.TERMINE, progression: 100, demandeParUtilisateurId: idAdmin(3), worker: WorkerTraitement.PDF, dateDemande: dateIl(0, 4), dateDebutTraitement: dateIl(0, 4), dateFin: dateIl(0, 4), resultat: { urlTelechargement: `https://exports.manei-lift.fr/${rapports[0]?.id ?? 'rap'}.pdf`, nomFichier: 'rapport-intervention.pdf', formatFichier: FormatFichierExport.PDF, tailleOctets: 620_000 } },
  { id: 'tache-05', type: TypeTacheAsynchrone.GENERATION_PDF_GROUPEE, libelle: 'Génération PDF groupée — 24 rapports', statut: StatutTacheAsynchrone.EN_COURS, nombreElementsTotal: 24, nombreElementsTraites: 14, demandeParUtilisateurId: idAdmin(0), worker: WorkerTraitement.PDF, dateDemande: dateIl(0, 0, 6), dateDebutTraitement: dateIl(0, 0, 5) },
  { id: 'tache-06', type: TypeTacheAsynchrone.SYNCHRONISATION_INTEGRATION, libelle: 'Synchronisation Sérénité', statut: StatutTacheAsynchrone.EN_COURS, nombreElementsTotal: 300, nombreElementsTraites: 180, demandeParUtilisateurId: 'systeme-generation', worker: WorkerTraitement.INTEGRATIONS, dateDemande: dateIl(0, 0, 3), dateDebutTraitement: dateIl(0, 0, 3) },
  { id: 'tache-07', type: TypeTacheAsynchrone.IMPORT_DONNEES, libelle: 'Import référentiel appareils — lot Nice', statut: StatutTacheAsynchrone.EN_ATTENTE, demandeParUtilisateurId: idAdmin(1), dateDemande: dateIl(0, 0, 1) },
  { id: 'tache-08', type: TypeTacheAsynchrone.EXPORT_DONNEES_PARC, libelle: 'Export parc — Galeries Lafayette', statut: StatutTacheAsynchrone.EN_ATTENTE, demandeParUtilisateurId: idAdmin(2), dateDemande: dateIl(0, 0, 15) },
  { id: 'tache-09', type: TypeTacheAsynchrone.GENERATION_PDF_UNITAIRE, libelle: 'Génération PDF — échec réseau', statut: StatutTacheAsynchrone.ECHEC, demandeParUtilisateurId: idAdmin(3), worker: WorkerTraitement.PDF, dateDemande: dateIl(1), dateDebutTraitement: dateIl(1), dateFin: dateIl(1), messageErreur: 'Service de génération PDF indisponible (timeout)', nombreTentatives: 3 },
  { id: 'tache-10', type: TypeTacheAsynchrone.SYNCHRONISATION_INTEGRATION, libelle: 'Synchronisation SAP — échec authentification', statut: StatutTacheAsynchrone.ECHEC, demandeParUtilisateurId: 'systeme-generation', worker: WorkerTraitement.INTEGRATIONS, dateDemande: dateIl(2), dateDebutTraitement: dateIl(2), dateFin: dateIl(2), messageErreur: 'Jeton API expiré', nombreTentatives: 5 },
  { id: 'tache-11', type: TypeTacheAsynchrone.EXPORT_HISTORIQUE_CLIENT, libelle: 'Export historique — Aéroports Côte d\'Azur', statut: StatutTacheAsynchrone.EN_COURS, nombreElementsTotal: 860, nombreElementsTraites: 120, demandeParUtilisateurId: idAdmin(0), worker: WorkerTraitement.EXPORT, dateDemande: dateIl(0, 0, 2), dateDebutTraitement: dateIl(0, 0, 2) },
  { id: 'tache-12', type: TypeTacheAsynchrone.GENERATION_RAPPORT_PERIODIQUE, libelle: 'Rapport périodique hebdomadaire', statut: StatutTacheAsynchrone.EN_ATTENTE, demandeParUtilisateurId: idAdmin(1), dateDemande: dateIl(0, 0, 30) },
];

// Durées estimées internes (minutes) pour les tâches EN_COURS — la progression est calculée à la lecture.
for (const tache of tachesAsynchrones) {
  if (tache.statut === StatutTacheAsynchrone.EN_COURS && tache.dateDebutTraitement) {
    dureesEstimeesTachesAsynchrones[tache.id] = tache.type === TypeTacheAsynchrone.SYNCHRONISATION_INTEGRATION ? 8 : tache.type === TypeTacheAsynchrone.EXPORT_HISTORIQUE_CLIENT ? 15 : 10;
  }
}

const idTacheExportTerminee = 'tache-01';

export const notifications: Notification[] = [
  { id: 'notif-01', type: TypeNotification.NOUVELLE_INTERVENTION_URGENTE, gravite: GraviteNotification.CRITIQUE, titre: 'Nouvelle urgence', message: 'Personne bloquée signalée — intervention créée automatiquement', dateCreation: dateIl(0, 0, 5), lu: false, destinataireRole: RoleUtilisateur.DISPATCHEUR, objetLieType: TypeObjetLie.INTERVENTION, objetLieId: interventions[0].id },
  { id: 'notif-02', type: TypeNotification.INTERVENTION_ASSIGNEE, gravite: GraviteNotification.INFO, titre: 'Intervention assignée', message: 'Une intervention vous a été assignée', dateCreation: dateIl(0, 1), lu: true, dateLecture: dateIl(0, 0, 40), destinataireUtilisateurId: utilisateurs.find((u) => u.role === RoleUtilisateur.TECHNICIEN)?.id, objetLieType: TypeObjetLie.INTERVENTION, objetLieId: interventions[1].id },
  { id: 'notif-03', type: TypeNotification.SLA_BIENTOT_DEPASSE, gravite: GraviteNotification.AVERTISSEMENT, titre: 'SLA bientôt dépassé', message: 'Une intervention approche de son délai contractuel', dateCreation: dateIl(0, 0, 12), lu: false, destinataireRole: RoleUtilisateur.SUPERVISEUR, objetLieType: TypeObjetLie.INTERVENTION, objetLieId: interventions[2].id },
  { id: 'notif-04', type: TypeNotification.MAINTENANCE_EN_RETARD, gravite: GraviteNotification.AVERTISSEMENT, titre: 'Maintenance en retard', message: 'Une maintenance planifiée dépasse son échéance', dateCreation: dateIl(1), lu: false, destinataireRole: RoleUtilisateur.RESPONSABLE_PARC, objetLieType: TypeObjetLie.MAINTENANCE, objetLieId: maintenances[0].id },
  { id: 'notif-05', type: TypeNotification.SYNCHRONISATION_API_ECHEC, gravite: GraviteNotification.CRITIQUE, titre: 'Échec de synchronisation', message: 'La synchronisation avec SAP a échoué', dateCreation: dateIl(2), lu: false, destinataireRole: RoleUtilisateur.ADMINISTRATEUR, objetLieType: TypeObjetLie.INTEGRATION_API, objetLieId: 'integ-06' },
  { id: 'notif-06', type: TypeNotification.EXPORT_TERMINE, gravite: GraviteNotification.INFO, titre: 'Export terminé', message: "L'export de l'historique client est prêt à être téléchargé", dateCreation: dateIl(2, 2), lu: true, dateLecture: dateIl(2, 1), destinataireUtilisateurId: idAdmin(0), objetLieType: TypeObjetLie.TACHE_ASYNCHRONE, objetLieId: idTacheExportTerminee },
  { id: 'notif-07', type: TypeNotification.RAPPORT_A_CORRIGER, gravite: GraviteNotification.AVERTISSEMENT, titre: 'Rapport à corriger', message: 'Un rapport a été refusé et doit être corrigé', dateCreation: dateIl(0, 5), lu: false, destinataireUtilisateurId: utilisateurs.find((u) => u.role === RoleUtilisateur.TECHNICIEN)?.id, objetLieType: TypeObjetLie.RAPPORT, objetLieId: rapports.find((r) => r.statutValidation === StatutValidationRapport.REFUSE_A_CORRIGER)?.id ?? rapports[0].id },
  { id: 'notif-08', type: TypeNotification.RESERVE_CTQ_AFFECTEE, gravite: GraviteNotification.INFO, titre: 'Réserve CTQ affectée', message: 'Une réserve CTQ vous a été affectée', dateCreation: dateIl(0, 8), lu: false, destinataireUtilisateurId: TECHS_MISSIONS_CTQ[0], objetLieType: TypeObjetLie.RESERVE_CTQ, objetLieId: reservesCTQ[0]?.id ?? 'res-00001' },
  { id: 'notif-09', type: TypeNotification.NOUVELLE_INTERVENTION_URGENTE, gravite: GraviteNotification.CRITIQUE, titre: 'Nouvelle urgence', message: 'Alarme déclenchée — intervention créée automatiquement', dateCreation: dateIl(0, 0, 9), lu: false, destinataireRole: RoleUtilisateur.DISPATCHEUR, objetLieType: TypeObjetLie.INTERVENTION, objetLieId: interventions[3].id },
  { id: 'notif-10', type: TypeNotification.SLA_BIENTOT_DEPASSE, gravite: GraviteNotification.AVERTISSEMENT, titre: 'SLA bientôt dépassé', message: 'Échéance SLA dans moins de 15 minutes', dateCreation: dateIl(0, 0, 3), lu: false, destinataireRole: RoleUtilisateur.SUPERVISEUR, objetLieType: TypeObjetLie.INTERVENTION, objetLieId: interventions[4].id },
  { id: 'notif-11', type: TypeNotification.MAINTENANCE_EN_RETARD, gravite: GraviteNotification.INFO, titre: 'Maintenances en retard', message: '3 maintenances sont désormais en retard sur le parc Lyon', dateCreation: dateIl(3), lu: true, dateLecture: dateIl(2), destinataireRole: RoleUtilisateur.RESPONSABLE_PARC, objetLieType: TypeObjetLie.MAINTENANCE, objetLieId: maintenances[1].id },
  { id: 'notif-12', type: TypeNotification.INTERVENTION_ASSIGNEE, gravite: GraviteNotification.INFO, titre: 'Intervention réattribuée', message: 'Une intervention vous a été réattribuée', dateCreation: dateIl(0, 2), lu: false, destinataireUtilisateurId: utilisateurs.find((u) => u.technicienId === TECH_SCENARIO_REAFFECTATION_MOBILE)?.id, objetLieType: TypeObjetLie.INTERVENTION, objetLieId: reaffectations[reaffectations.length - 1].cibleId },
];

export const entreesAudit: EntreeAudit[] = [];
let seqAudit = 0;
function ajouterAudit(entree: Omit<EntreeAudit, 'id'>): void {
  seqAudit++;
  entreesAudit.push({ id: `audit-${pad(seqAudit, 3)}`, ...entree });
}

// Exemple canonique (section 46) : digicode 4521 → 8754, MOBILE, SYNCHRONISE à J+13min.
ajouterAudit({
  dateHeure: dateIl(5, 0, 0),
  utilisateurId: undefined,
  utilisateurNom: techniciens.find((t) => t.id === TECH_SCENARIO_REAFFECTATION_MOBILE)?.nomComplet,
  origine: OrigineAction.MOBILE,
  typeEntite: TypeEntiteAuditee.APPAREIL,
  entiteId: ascenseurs[0].id,
  champModifie: 'digicode',
  champLibelle: 'Digicode',
  ancienneValeur: '4521',
  nouvelleValeur: '8754',
  description: 'a modifié le digicode. 4521 → 8754',
  statutSynchronisation: StatutSynchronisation.SYNCHRONISE,
  dateSynchronisation: ajouterMinutes(dateIl(5, 0, 0), 13),
});

const TYPES_ENTITE_AUDIT = Object.values(TypeEntiteAuditee);
for (const typeEntite of TYPES_ENTITE_AUDIT) {
  const utilisateur = randPick(utilisateurs);
  ajouterAudit({
    dateHeure: dateIl(randInt(0, 60), randInt(0, 23)),
    utilisateurId: utilisateur.id,
    utilisateurNom: utilisateur.nomComplet,
    origine: randWeighted([[OrigineAction.WEB, 60], [OrigineAction.MOBILE, 25], [OrigineAction.API, 10], [OrigineAction.SYSTEME, 5]]),
    typeEntite,
    entiteId: `${typeEntite}-exemple`,
    description: `a modifié un(e) ${typeEntite}`,
  });
}
// Compléments jusqu'à ~24 entrées, dont 1-2 cas EN_ATTENTE/ECHEC de synchronisation hors ligne.
for (let k = 0; k < 12; k++) {
  const utilisateur = randPick(utilisateurs);
  ajouterAudit({
    dateHeure: dateIl(randInt(0, 90), randInt(0, 23)),
    utilisateurId: utilisateur.id,
    utilisateurNom: utilisateur.nomComplet,
    origine: OrigineAction.MOBILE,
    typeEntite: randPick(TYPES_ENTITE_AUDIT),
    entiteId: `entite-${k}`,
    description: 'a synchronisé une modification depuis le mobile',
    statutSynchronisation: k < 2 ? (k === 0 ? StatutSynchronisation.EN_ATTENTE : StatutSynchronisation.ECHEC) : StatutSynchronisation.SYNCHRONISE,
  });
}

// ============================================================================
// 18. INTÉGRATIONS EXTERNES
// ============================================================================

const SYSTEMES_ORDONNES = [SystemeExterne.SERENITE, SystemeExterne.GETRALINE, SystemeExterne.INTENT, SystemeExterne.CITRON, SystemeExterne.H2, SystemeExterne.SAP];
const NOMS_AFFICHES_INTEGRATION: Record<SystemeExterne, string> = {
  [SystemeExterne.SERENITE]: 'Sérénité — Réception des alertes',
  [SystemeExterne.GETRALINE]: 'Getraline — Réception des alertes',
  [SystemeExterne.INTENT]: 'Intent — Plateforme de supervision',
  [SystemeExterne.CITRON]: 'Citron — Gestion documentaire',
  [SystemeExterne.H2]: 'H2 — Référentiel bâtimentaire',
  [SystemeExterne.SAP]: 'SAP — Catalogue pièces',
};

export const integrationsExternes: IntegrationExterne[] = SYSTEMES_ORDONNES.map((systeme, i) => {
  const deconnectee = systeme === SystemeExterne.SAP;
  return {
    id: `integ-${pad(i + 1, 2)}`,
    systeme,
    nomAffiche: NOMS_AFFICHES_INTEGRATION[systeme],
    statutConnexion: deconnectee ? StatutConnexionIntegration.DECONNECTEE : StatutConnexionIntegration.CONNECTEE,
    derniereSynchronisation: deconnectee ? dateIl(2) : dateIl(0, 0, randInt(1, 30)),
    derniereErreurMessage: deconnectee ? 'Jeton API expiré' : undefined,
    derniereErreurDate: deconnectee ? dateIl(2) : undefined,
    nombreTachesEnAttente: deconnectee ? randInt(15, 40) : randInt(0, 5),
    tempsReponseMoyenMs: deconnectee ? 0 : randInt(120, 1800),
  };
});

export const journalEchangesIntegration: JournalEchangeIntegration[] = [];
let seqJournalEchange = 0;
for (const integration of integrationsExternes) {
  const nbEchanges = integration.statutConnexion === StatutConnexionIntegration.DECONNECTEE ? 5 : randInt(2, 4);
  for (let k = 0; k < nbEchanges; k++) {
    seqJournalEchange++;
    const echec = integration.statutConnexion === StatutConnexionIntegration.DECONNECTEE && k < 2;
    journalEchangesIntegration.push({
      id: `jecx-${pad(seqJournalEchange, 3)}`,
      integrationId: integration.id,
      systeme: integration.systeme,
      direction: randWeighted([[DirectionEchange.ENTRANT, 60], [DirectionEchange.SORTANT, 40]]),
      evenement: integration.systeme === SystemeExterne.SAP ? 'Synchronisation catalogue pièces' : 'Réception ticket entrant',
      dateHeure: dateIl(randInt(0, 5), randInt(0, 23)),
      statut: echec ? StatutEchange.ECHEC : randWeighted([[StatutEchange.SUCCES, 85], [StatutEchange.EN_COURS, 10], [StatutEchange.EN_ATTENTE, 5]]),
      nombreTentatives: echec ? randInt(2, 5) : 1,
      messageErreur: echec ? 'Jeton API expiré' : undefined,
    });
  }
}

// ============================================================================
// 19. RÉFÉRENTIELS ADMINISTRATIFS COMPLÉMENTAIRES
// ============================================================================

const PERMISSIONS_PAR_ROLE: Record<RoleUtilisateur, Permission[]> = {
  [RoleUtilisateur.ADMINISTRATEUR]: Object.values(Permission),
  [RoleUtilisateur.SUPERVISEUR]: [
    Permission.VOIR_PARC, Permission.VOIR_INTERVENTIONS, Permission.GERER_INTERVENTIONS, Permission.VOIR_MAINTENANCES,
    Permission.VOIR_RAPPORTS, Permission.VALIDER_RAPPORTS, Permission.VOIR_CTQ, Permission.VOIR_PLANNING,
    Permission.GERER_PLANNING, Permission.VOIR_CONTRATS, Permission.VOIR_AUDIT_LOGS, Permission.EXPORTER_DONNEES,
  ],
  [RoleUtilisateur.RESPONSABLE_PARC]: [Permission.VOIR_PARC, Permission.GERER_PARC, Permission.VOIR_INTERVENTIONS, Permission.VOIR_MAINTENANCES, Permission.VOIR_RAPPORTS, Permission.VOIR_CTQ],
  [RoleUtilisateur.GESTIONNAIRE_CONTRATS]: [Permission.VOIR_PARC, Permission.VOIR_CONTRATS, Permission.GERER_CONTRATS, Permission.VOIR_RAPPORTS],
  [RoleUtilisateur.DISPATCHEUR]: [Permission.VOIR_PARC, Permission.VOIR_INTERVENTIONS, Permission.GERER_INTERVENTIONS, Permission.VOIR_PLANNING, Permission.GERER_PLANNING],
  [RoleUtilisateur.TECHNICIEN]: [Permission.VOIR_PARC, Permission.VOIR_INTERVENTIONS, Permission.VOIR_MAINTENANCES, Permission.VOIR_PLANNING, Permission.VOIR_CTQ],
  [RoleUtilisateur.LECTEUR]: [Permission.VOIR_PARC, Permission.VOIR_INTERVENTIONS, Permission.VOIR_RAPPORTS],
};

const LIBELLES_ROLE: Record<RoleUtilisateur, string> = {
  [RoleUtilisateur.ADMINISTRATEUR]: 'Administrateur',
  [RoleUtilisateur.SUPERVISEUR]: 'Superviseur',
  [RoleUtilisateur.RESPONSABLE_PARC]: 'Responsable de parc',
  [RoleUtilisateur.GESTIONNAIRE_CONTRATS]: 'Gestionnaire de contrats',
  [RoleUtilisateur.DISPATCHEUR]: 'Dispatcheur',
  [RoleUtilisateur.TECHNICIEN]: 'Technicien',
  [RoleUtilisateur.LECTEUR]: 'Lecteur (portail client)',
};

export const rolesDefinitions: RoleDefinition[] = Object.values(RoleUtilisateur).map((role) => ({
  role,
  libelle: LIBELLES_ROLE[role],
  description: `Rôle applicatif : ${LIBELLES_ROLE[role]}`,
  permissions: PERMISSIONS_PAR_ROLE[role],
}));

export const causesPanneRef: CausePanneRef[] = [
  { id: 'cpr-01', code: 'surtension_reseau', libelle: 'Surtension réseau', categorie: 'Électrique', actif: true, ordreAffichage: 1, modifiable: true },
  { id: 'cpr-02', code: 'infiltration_eau', libelle: 'Infiltration d\'eau en gaine', categorie: 'Environnement', actif: true, ordreAffichage: 2, modifiable: true },
  { id: 'cpr-03', code: 'acte_vandalisme_repete', libelle: 'Acte de vandalisme répété', categorie: 'Vandalisme', actif: true, ordreAffichage: 3, modifiable: true },
  { id: 'cpr-04', code: 'defaut_alimentation', libelle: "Défaut d'alimentation électrique du bâtiment", categorie: 'Électrique', actif: true, ordreAffichage: 4, modifiable: true },
];

export const reglesMetier: RegleMetier[] = [
  { id: 'rm-01', code: 'validation_signature_client', libelle: 'Signature client requise pour clôturer un dépannage', type: TypeRegleMetier.VALIDATION_SIGNATURE_CLIENT, description: 'Un rapport de dépannage ne peut être finalisé sans signature client renseignée (signé, absent ou indisponible).', actif: true, parametres: { obligatoire: true }, modifiablePar: [RoleUtilisateur.ADMINISTRATEUR] },
  { id: 'rm-02', code: 'delai_relance_ticket_non_rapproche', libelle: 'Relance automatique des tickets non rapprochés', type: TypeRegleMetier.AUTRE, description: 'Alerte dispatch si un ticket reste non rapproché plus de 2 heures.', actif: true, parametres: { delaiHeures: 2 }, modifiablePar: [RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.SUPERVISEUR] },
];

export const configurationsNotification: ConfigurationNotification[] = [
  { id: 'cn-01', type: TypeNotification.NOUVELLE_INTERVENTION_URGENTE, libelle: 'Nouvelle intervention urgente', canauxActifs: [CanalNotification.IN_APP, CanalNotification.PUSH_MOBILE, CanalNotification.SMS], rolesDestinataires: [RoleUtilisateur.DISPATCHEUR, RoleUtilisateur.SUPERVISEUR], actif: true },
  { id: 'cn-02', type: TypeNotification.INTERVENTION_ASSIGNEE, libelle: 'Intervention assignée', canauxActifs: [CanalNotification.IN_APP, CanalNotification.PUSH_MOBILE], rolesDestinataires: [RoleUtilisateur.TECHNICIEN], actif: true },
  { id: 'cn-03', type: TypeNotification.SLA_BIENTOT_DEPASSE, libelle: 'SLA bientôt dépassé', canauxActifs: [CanalNotification.IN_APP, CanalNotification.EMAIL], rolesDestinataires: [RoleUtilisateur.SUPERVISEUR, RoleUtilisateur.DISPATCHEUR], actif: true, delaiAvantAlerteMinutes: 15 },
  { id: 'cn-04', type: TypeNotification.MAINTENANCE_EN_RETARD, libelle: 'Maintenance en retard', canauxActifs: [CanalNotification.IN_APP, CanalNotification.EMAIL], rolesDestinataires: [RoleUtilisateur.RESPONSABLE_PARC, RoleUtilisateur.SUPERVISEUR], actif: true },
  { id: 'cn-05', type: TypeNotification.SYNCHRONISATION_API_ECHEC, libelle: 'Échec de synchronisation API', canauxActifs: [CanalNotification.IN_APP, CanalNotification.EMAIL], rolesDestinataires: [RoleUtilisateur.ADMINISTRATEUR], actif: true },
  { id: 'cn-06', type: TypeNotification.EXPORT_TERMINE, libelle: 'Export terminé', canauxActifs: [CanalNotification.IN_APP], rolesDestinataires: [RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.SUPERVISEUR], actif: true },
  { id: 'cn-07', type: TypeNotification.RAPPORT_A_CORRIGER, libelle: 'Rapport à corriger', canauxActifs: [CanalNotification.IN_APP, CanalNotification.PUSH_MOBILE], rolesDestinataires: [RoleUtilisateur.TECHNICIEN], actif: true },
  { id: 'cn-08', type: TypeNotification.RESERVE_CTQ_AFFECTEE, libelle: 'Réserve CTQ affectée', canauxActifs: [CanalNotification.IN_APP, CanalNotification.PUSH_MOBILE], rolesDestinataires: [RoleUtilisateur.TECHNICIEN], actif: true },
];
