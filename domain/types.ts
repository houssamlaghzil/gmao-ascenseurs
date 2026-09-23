/**
 * Modèle de données — Manei-Lift (GMAO Ascenseurs)
 *
 * Refonte complète du domaine autour de la séparation stricte entre :
 *   - le STATUT DE L'APPAREIL (StatutAppareil : en service, en panne, à
 *     l'arrêt, mode dégradé, arrêt travaux) — un fait constaté sur la
 *     machine ;
 *   - le cycle de vie d'une INTERVENTION (StatutIntervention : nouveau →
 *     à affecter → affecté → pris en charge → en cours → en attente de
 *     pièce → à reprendre → terminé → à valider → clôturé) — un processus
 *     de traitement avec dispatch, SLA, réattribution, rapports multiples.
 *
 * Remplace l'ancien modèle EtatGlobal/SousEtatPanne/TypeEvenement/
 * EvenementHistorique, qui mélangeait ces deux notions. Le cycle
 * attribution → réparation → clôture est repris par les fonctions
 * Intervention de business-logic.ts (creerIntervention, affecterTechnicien,
 * prendreEnCharge, ... cloturerIntervention, reaffecter), et le changement
 * de statut d'un appareil devient un simple setter produisant une
 * EntreeJournalModification.
 */

// ============================================================================
// 1. APPAREILS & PARC
// ============================================================================

/**
 * Statut opérationnel de l'appareil (section 5) — INDÉPENDANT du statut
 * d'une intervention (voir StatutIntervention, section 3). Remplace
 * EtatGlobal/SousEtatPanne (voir décision en tête de fichier).
 */
export enum StatutAppareil {
  EN_SERVICE = "en_service",
  EN_PANNE = "en_panne",
  A_L_ARRET = "a_l_arret",
  MODE_DEGRADE = "mode_degrade",
  ARRET_TRAVAUX = "arret_travaux",
}

// Type de parc (pour le calcul de risque, section 4.1)
export enum TypeParc {
  RESIDENTIEL = "residentiel",
  TERTIAIRE = "tertiaire",
  COMMERCIAL = "commercial",
}

// Niveaux de risque pour la maintenance prédictive
export enum RiskLevel {
  FAIBLE = "faible",
  MODERE = "modere",
  ELEVE = "eleve",
}

/**
 * Technicien Manei-Lift. `disponible` reste un indicateur temps réel simple
 * (à distinguer d'une AbsenceTechnicien planifiée, section 11.3) ; `actif`
 * distingue un compte archivé d'un technicien en poste.
 */
export interface Technicien {
  id: string;
  nomComplet: string;
  specialite: string;
  disponible: boolean;
  actif: boolean;
  telephone?: string;
  email?: string;
}

/** Type de la personne/système à l'origine d'une action (distinct du canal — voir OrigineAction). */
export enum TypeAuteurModification {
  TECHNICIEN = "technicien",
  UTILISATEUR_WEB = "utilisateur_web",
  SYSTEME = "systeme",
}

/**
 * Auteur d'une modification, sous forme dénormalisée pour affichage direct
 * sans jointure (utilisé par EntreeJournalModification et, par convention,
 * partout où une action doit être attribuée à quelqu'un de façon lisible).
 */
export interface AuteurModification {
  type: TypeAuteurModification;
  id: string; // technicienId, utilisateurId, ou identifiant système
  nomAffiche: string;
}

/**
 * Canal ayant produit une action (type transverse, réutilisé par tous les
 * journaux/audits/rapports du modèle : EntreeJournalModification, Rapport,
 * Reaffectation, EvenementReserve, EntreeAudit, Maintenance...). Unifie 7
 * enums quasi identiques trouvés dans les modules sources (voir
 * reconciliation-notes.md).
 */
export enum OrigineAction {
  WEB = "web",
  MOBILE = "mobile",
  API = "api",
  SYSTEME = "systeme", // action automatique (calcul, synchronisation, création auto...)
}

/**
 * Champs connus et suivis par le journal de modifications de la fiche
 * appareil. AUTRE + libellé libre permet d'historiser un champ non encore
 * typé sans casser le modèle. Fusionne ChampModifiable (parc-appareil) et
 * ChampFicheTechniqueModifiable (mobile) — voir reconciliation-notes.md.
 */
export enum ChampModifiable {
  STATUT_APPAREIL = "statut_appareil",
  DIGICODE = "digicode",
  CODE_CLE = "code_cle",
  GESTION_CLES = "gestion_cles",
  ACCES_LOCAL_TECHNIQUE = "acces_local_technique",
  COMMENTAIRE_ACCES = "commentaire_acces",
  TELEALARME_NUMERO_LIGNE = "telealarme_numero_ligne",
  TELEALARME_STATUT = "telealarme_statut",
  TECHNICIEN_AFFECTE = "technicien_affecte",
  CONTRAT = "contrat",
  AUTRE = "autre",
}

/**
 * Entrée unique du journal de modifications de la fiche appareil (onglet
 * "Historique", sections 4.2/23/46). Unifie l'onglet en un seul flux
 * chronologique ancienne valeur → nouvelle valeur, quel que soit le champ,
 * y compris les changements de StatutAppareil. Fusionne
 * EntreeJournalModification (parc-appareil) et ModificationFicheTechnique
 * (mobile) : `statutSynchronisation` permet de représenter une modification
 * saisie hors ligne, en attente d'envoi.
 */
export interface EntreeJournalModification {
  id: string;
  ascenseurId: string;
  champModifie: ChampModifiable;
  libelleChamp: string; // libellé humain affiché, ex: "Digicode"
  ancienneValeur: string; // toujours stringifié pour un affichage uniforme
  nouvelleValeur: string;
  auteur: AuteurModification;
  dateModification: string; // ISO — horodatage réel de la saisie terrain, immuable
  origine: OrigineAction;
  /** Renseigné si la modification vient du mobile et transite par la file de synchronisation. */
  statutSynchronisation?: StatutSynchronisation;
}

export enum TypeLigneTelealarme {
  RTC = "rtc",
  GSM = "gsm",
  IP = "ip",
}

export enum StatutTelealarme {
  FONCTIONNELLE = "fonctionnelle",
  DEFAILLANTE = "defaillante",
  NON_TESTEE = "non_testee",
}

export enum DetenteurCles {
  GARDIEN = "gardien",
  CLIENT_SUR_SITE = "client_sur_site",
  BOITE_A_CLES = "boite_a_cles",
  AGENCE_MANEI_LIFT = "agence_manei_lift",
  AUCUNE_REQUISE = "aucune_requise",
}

/** Un niveau desservi, nécessaire pour nommer les étages en mode dégradé. */
export interface NiveauDesservi {
  code: string; // ex: "RDC", "-1", "1", "12"
  libelle: string; // ex: "Rez-de-chaussée", "1er sous-sol"
  ordre: number; // ordre d'affichage, du plus bas au plus haut
}

export interface Telealarme {
  present: boolean;
  fournisseur?: string;
  numeroCarteLigne?: string;
  typeLigne?: TypeLigneTelealarme;
  statutFonctionnel: StatutTelealarme;
  dateDernierTest?: string; // ISO — alimenté aussi par ResultatTestTelealarme (module Maintenances)
}

export interface GestionCles {
  detenteur: DetenteurCles;
  localisation?: string;
  typeCle?: string;
  commentaire?: string;
}

export interface AccesLocalTechnique {
  localisation: string;
  digicodeSpecifique?: string;
  cleSpecifique?: string;
  commentaireAcces?: string;
}

export interface LocalisationGPS {
  latitude: number;
  longitude: number;
}

/**
 * Fiche technique complète de l'appareil (onglet "Fiche technique"). Les
 * champs digicode/gestionCles/accesLocalTechnique/telealarme sont
 * enrichissables par le technicien terrain et donc historisés dans
 * EntreeJournalModification à chaque changement.
 */
export interface FicheTechniqueAppareil {
  marque: string;
  modele: string;
  dateInstallation: string; // ISO date
  numeroSerie?: string;
  referenceConstructeur?: string;
  chargeUtileKg: number;
  vitesseMs: number;
  nombreNiveaux: number;
  niveauxDesservis: NiveauDesservi[];
  telealarme: Telealarme;
  digicode?: string;
  gestionCles: GestionCles;
  accesLocalTechnique: AccesLocalTechnique;
  localisationGPS?: LocalisationGPS;
}

/**
 * Secteur géographique/opérationnel administrable (référentiel léger). Une
 * Tournee (module Maintenances & Planning) y est rattachée par secteurId.
 */
export interface SecteurGeographique {
  id: string;
  nom: string;
  villesCouvertes: string[];
}

/**
 * Détail d'un épisode de mode dégradé (section 5). Plusieurs étages
 * possibles : toujours un tableau, même pour un seul étage.
 */
export interface DetailModeDegrade {
  id: string;
  ascenseurId: string;
  etagesConcernes: string[]; // références à NiveauDesservi.code, longueur >= 1
  commentaire?: string;
  dateDebut: string; // ISO
  dateFin?: string; // renseigné à la sortie du mode dégradé
  responsableChangement: AuteurModification;
  actif: boolean; // true = épisode en cours (doit correspondre à Ascenseur.modeDegrade)
  entreeJournalId?: string; // lien vers l'entrée du journal générée en miroir
}

/**
 * Parc d'ascenseurs = site physique (un bâtiment, une tour, un centre
 * commercial...), rattaché à un Client (donneur d'ordre) et, le cas
 * échéant, à un secteur géographique/opérationnel.
 */
export interface ParcAscenseurs {
  id: string;
  nom: string;
  description: string;
  ville: string;
  adresse: string;
  type: TypeParc;
  clientId: string; // le Client propriétaire/donneur d'ordre du site
  secteurId?: string;
}

/**
 * Ascenseur — nouvelle forme cible (remplace intégralement l'interface
 * Ascenseur existante). Migration depuis l'existant :
 *   - referenceTechnique → code (identifiant métier affiché/recherché)
 *   - etatGlobal/sousEtatPanne/technicienAttribueId → statutAppareil (+
 *     modeDegrade) ; le cycle attribution/réparation part vers Intervention
 */
export interface Ascenseur {
  id: string;
  code: string; // identifiant métier unique, recherché (4.1)
  nom?: string; // libellé usuel/repère interne (ex: "Confluence A1")

  parcId: string;
  clientId: string; // dénormalisé depuis le Parc pour filtre/liste rapides
  contratId: string; // dénormalisé
  technicienAffecteId?: string; // technicien titulaire (hors contexte d'une intervention précise)
  tourneeId?: string;
  secteurId?: string;

  adresseComplete: string;
  ville: string;
  codePostal?: string;

  statutAppareil: StatutAppareil;
  /** Détail présent uniquement si statutAppareil === MODE_DEGRADE (épisode actif). */
  modeDegrade?: DetailModeDegrade;

  ficheTechnique: FicheTechniqueAppareil;

  dateCreationFiche: string; // ISO date
}

/**
 * Ligne calculée pour la liste des appareils (section 4.1). Assemblée à la
 * lecture par jointure — jamais stockée telle quelle.
 */
export interface LigneListeAppareil {
  id: string;
  code: string;
  adresse: string;
  ville: string;
  clientNom: string;
  contratNumero: string;
  technicienNom?: string;
  tourneeNom?: string;
  statut: StatutAppareil;
  derniereMaintenance?: string; // ISO date — module Maintenances
  prochaineMaintenance?: string; // ISO date — module Maintenances
  derniereIntervention?: string; // ISO date — module Interventions
  disponibilitePourcent: number;
  enRetardMaintenance: boolean;
  enModeDegrade: boolean;
}

export interface FiltresListeAppareils {
  statut?: StatutAppareil[];
  clientId?: string[];
  contratId?: string[];
  technicienId?: string[];
  tourneeId?: string[];
  ville?: string[];
  secteurId?: string[];
  typeMaintenance?: CategorieMaintenance[];
  enRetard?: boolean;
  modeDegrade?: boolean;
  recherche?: string; // code, adresse, ville, référence, numéro téléalarme
}

/** Indicateur de disponibilité — calculé, jamais stocké. */
export interface IndicateurDisponibilite {
  ascenseurId: string;
  periodeMois: number;
  tauxDisponibilitePourcent: number;
  dureeImmobilisationHeures: number;
  nombreArrets: number;
}

// ============================================================================
// 2. CLIENT & CONTRATS
// ============================================================================

export enum TypeClient {
  SYNDIC_COPROPRIETE = "syndic_copropriete",
  BAILLEUR_SOCIAL = "bailleur_social",
  FONCIERE_TERTIAIRE = "fonciere_tertiaire",
  ENSEIGNE_COMMERCIALE = "enseigne_commerciale",
  COLLECTIVITE = "collectivite",
  GESTIONNAIRE_INFRASTRUCTURE = "gestionnaire_infrastructure",
  AUTRE = "autre",
}

/**
 * Client final (donneur d'ordre/facturé), distinct du Parc qui reste un
 * site physique. Un Client peut posséder plusieurs Parcs répartis sur
 * plusieurs villes.
 */
export interface Client {
  id: string;
  raisonSociale: string;
  typeClient: TypeClient;
  siret?: string;
  secteurActivite?: string; // libellé libre, ex: "Immobilier commercial"
  adresseSiege: string;
  villeSiege: string;
  codePostal: string;
  responsables: ResponsableClient[];
  dateEntreeRelation: string; // ISO date
  actif: boolean;
}

/**
 * Interlocuteur côté client, rattaché au Client (registre général des
 * contacts). Un même responsable peut être référencé par un ou plusieurs
 * Contrats via Contrat.responsablesClientIds (pas de duplication d'objet).
 */
export interface ResponsableClient {
  id: string;
  clientId: string;
  nomComplet: string;
  fonction: string; // ex: "Responsable technique", "Responsable exploitation"
  email?: string;
  telephone?: string;
  estContactPrincipal: boolean;
  estContactUrgence: boolean;
}

/** Statut de cycle de vie d'un contrat, du premier contact jusqu'à la fin de la relation. */
export enum StatutContrat {
  EN_NEGOCIATION = "en_negociation",
  ACTIF = "actif",
  EN_RENOUVELLEMENT = "en_renouvellement",
  SUSPENDU = "suspendu",
  EXPIRE = "expire",
  RESILIE = "resilie",
}

export enum FrequenceMaintenance {
  MENSUELLE = "mensuelle",
  BIMESTRIELLE = "bimestrielle",
  TRIMESTRIELLE = "trimestrielle",
  SEMESTRIELLE = "semestrielle",
  ANNUELLE = "annuelle",
}

/** Badge synthétique affiché dans la liste des contrats, dérivé des seuils précis de SeuilsContrat. */
export enum NiveauSla {
  STANDARD = "standard",
  PREMIUM = "premium",
  PRIORITAIRE = "prioritaire",
  SUR_MESURE = "sur_mesure",
}

/**
 * Seuils de durée d'un contrat, distincts des délais SLA par urgence (qui
 * vivent désormais dans DefinitionSLA, scopée par contratId) :
 * - dureeMinimaleInterventionMinutes : seuil sous lequel une intervention
 *   de dépannage clôturée trop vite déclenche un avertissement ;
 * - tempsMinimumPresenceMaintenanceMinutes : seuil de présence minimal pour
 *   une visite de maintenance (section 6.5/31).
 */
export interface SeuilsContrat {
  dureeMinimaleInterventionMinutes: number;
  tempsMinimumPresenceMaintenanceMinutes: number;
}

/**
 * Référentiel SLA par niveau d'urgence, éventuellement surchargé par
 * contrat. Un enregistrement sans contratId est le SLA par défaut global.
 * Conçu initialement par le module Interventions mais rattaché ici : c'est
 * un réglage contractuel (section 14).
 */
export interface DefinitionSLA {
  id: string;
  niveauUrgence: NiveauUrgence;
  libelle: string; // "Personne bloquée", "Dépannage standard"...
  delaiMinutes: number;
  contratId?: string; // undefined = SLA par défaut global
}

/** Contrat de maintenance liant un Client à un périmètre d'appareils (section 14). */
export interface Contrat {
  id: string;
  numero: string; // ex. "CTR-2024-0032"
  clientId: string;
  parcIds: string[]; // sites couverts
  nombreAppareilsCouverts: number; // valeur contractuelle déclarée
  dateDebut: string; // ISO
  dateFin: string; // ISO
  frequenceMaintenance: FrequenceMaintenance;
  maintenanceCableIncluse: boolean;
  maintenanceParachuteIncluse: boolean;
  maintenanceNettoyageIncluse: boolean;
  niveauSla: NiveauSla;
  seuils: SeuilsContrat;
  reglesSpecifiques?: string[]; // ex. "Astreinte 24/7 sur le bâtiment tour"
  responsablesClientIds: string[]; // FK vers ResponsableClient
  statut: StatutContrat;
}

// ============================================================================
// 3. INTERVENTIONS & TICKETS
// ============================================================================

/** Canal/système à l'origine d'un signalement (section 7.1). */
export enum SourceTicket {
  APPEL_CLIENT = "appel_client",
  SERENITE = "serenite",
  GETRALINE = "getraline",
  SAISIE_INTERNE = "saisie_interne",
  AUTRE_API = "autre_api",
}

/**
 * Cycle de vie d'un ticket, indépendant de celui de l'intervention.
 * NON_RAPPROCHE alimente le KPI dashboard "Tickets entrants non affectés".
 */
export enum StatutTicket {
  NON_RAPPROCHE = "non_rapproche",
  RAPPROCHE = "rapproche",
  IGNORE = "ignore", // doublon / faux signalement écarté manuellement
}

/**
 * Un signalement brut, quelle que soit sa source. Plusieurs tickets peuvent
 * être regroupés sous une même Intervention (section 7.3).
 */
export interface Ticket {
  id: string;
  numero: string; // ex. "TCK-2026-014820"
  source: SourceTicket;
  statut: StatutTicket;

  interventionId?: string; // renseigné une fois rapproché
  ordreDansIntervention?: number; // rang d'arrivée (1, 2, 3...)
  ascenseurId?: string;

  referenceExterne?: string;
  dateReception: string; // ISO — point de départ potentiel du décompte SLA
  contact?: string;
  canal?: string;
  messageBrut?: string;
  creeParNom?: string; // placeholder en attendant une jointure Utilisateur

  dateRapprochement?: string; // ISO
}

/** Statuts d'intervention, dans l'ordre canonique de progression (section 7.2). */
export enum StatutIntervention {
  NOUVEAU = "nouveau", // créé automatiquement à la réception du 1er ticket
  A_AFFECTER = "a_affecter", // confirmé par le dispatch, en attente d'un technicien
  AFFECTE = "affecte", // technicien désigné, pas encore pris en charge
  PRIS_EN_CHARGE = "pris_en_charge", // technicien a accepté / est en route
  EN_COURS = "en_cours", // arrivée sur site, diagnostic/travaux en cours
  EN_ATTENTE_DE_PIECE = "en_attente_de_piece", // travaux suspendus, pièce commandée
  A_REPRENDRE = "a_reprendre", // pièce reçue OU rapport rejeté : à finir
  TERMINE = "termine", // rapport terrain clos par le technicien
  A_VALIDER = "a_valider", // en attente de validation superviseur/back-office
  CLOTURE = "cloture", // validé, intervention archivée
}

export enum MotifIntervention {
  PERSONNE_BLOQUEE = "personne_bloquee",
  PANNE_ARRET = "panne_arret",
  BRUIT_ANORMAL = "bruit_anormal",
  PORTE_DEFAILLANTE = "porte_defaillante",
  ARRET_ETAGE = "arret_etage",
  ALARME_DECLENCHEE = "alarme_declenchee",
  DEGRADATION_VANDALISME = "degradation_vandalisme",
  AUTRE = "autre",
}

/** Niveau d'urgence : détermine le délai SLA applicable (section 7.4, via DefinitionSLA). */
export enum NiveauUrgence {
  PERSONNE_BLOQUEE = "personne_bloquee",
  STANDARD = "standard",
  NON_URGENT = "non_urgent",
}

/** Priorité affichée/triée, généralement dérivée de niveauUrgence mais ajustable par le dispatch. */
export enum PrioriteIntervention {
  CRITIQUE = "critique",
  HAUTE = "haute",
  NORMALE = "normale",
  BASSE = "basse",
}

/** État SLA calculé dynamiquement à la lecture (jamais stocké tel quel). */
export enum EtatSLA {
  DANS_LES_DELAIS = "dans_les_delais",
  BIENTOT_DEPASSE = "bientot_depasse",
  DEPASSE = "depasse",
  NON_APPLICABLE = "non_applicable",
}

/** Étapes-types de la chronologie d'une intervention (section 8). */
export enum TypeEtapeIntervention {
  SIGNALEMENT_RECU = "signalement_recu",
  INTERVENTION_CREEE = "intervention_creee",
  TICKET_RATTACHE = "ticket_rattache",
  TECHNICIEN_AFFECTE = "technicien_affecte",
  REATTRIBUEE = "reattribuee",
  PRISE_EN_CHARGE = "prise_en_charge",
  ARRIVEE_SUR_SITE = "arrivee_sur_site",
  ACCES_REFUSE = "acces_refuse",
  RAPPORT_AJOUTE = "rapport_ajoute",
  ETAT_APPAREIL_CHANGE = "etat_appareil_change",
  MISE_EN_ATTENTE_PIECE = "mise_en_attente_piece",
  REPRISE = "reprise",
  RAPPORT_REJETE = "rapport_rejete",
  TERMINEE = "terminee",
  VALIDEE = "validee",
  CLOTUREE = "cloturee",
  COMMENTAIRE = "commentaire",
}

/**
 * Motif de réattribution, qu'elle vienne du Web (dispatcher, bouton
 * "Réattribuer", section 8), du mobile ("Je ne peux pas traiter cette
 * intervention", section 34) ou du planning (absence, drag & drop, section
 * 11.2/11.3). Fusionne 2 enums quasi identiques — voir reconciliation-notes.md.
 */
export enum MotifReattribution {
  INDISPONIBILITE_TECHNICIEN = "indisponibilite_technicien",
  COMPETENCE_INSUFFISANTE = "competence_insuffisante",
  SURCHARGE_TOURNEE = "surcharge_tournee",
  PROXIMITE_GEOGRAPHIQUE = "proximite_geographique",
  ABSENCE = "absence",
  DEMANDE_CLIENT = "demande_client",
  ACCES_IMPOSSIBLE = "acces_impossible",
  AUTRE = "autre",
}

/** Cible d'une réaffectation : une Intervention ou une Maintenance (section 11.2). */
export enum TypeCiblePlanning {
  MAINTENANCE = "maintenance",
  INTERVENTION = "intervention",
}

/**
 * L'intervention regroupe un ou plusieurs Tickets portant sur le même
 * besoin, pour le même appareil (section 7.3). Entité pivot des sections 7
 * et 8.
 */
export interface Intervention {
  id: string;
  numero: string; // "INT-2026-001245"

  ascenseurId: string;
  contratId?: string;

  motif: MotifIntervention;
  motifDetail?: string;
  niveauUrgence: NiveauUrgence;
  priorite: PrioriteIntervention;
  statut: StatutIntervention;

  technicienId?: string; // technicien actuellement affecté (undefined si NOUVEAU/A_AFFECTER)

  // --- SLA (section 7.4) ---
  delaiContractuelMinutes: number;
  dateDebutDecompteSLA: string; // ISO = dateReception du 1er ticket, PAS dateCreation
  dateLimiteSLA: string; // ISO = dateDebutDecompteSLA + delaiContractuelMinutes

  // --- Cycle de vie (alimentent la chronologie section 8) ---
  dateCreation: string;
  dateAffectation?: string;
  datePriseEnCharge?: string;
  dateArriveeSite?: string;
  dateTerminee?: string;
  dateValidation?: string;
  dateCloture?: string;
  dureeInterventionMinutes?: number;

  // --- Accès à l'appareil (parcours mobile section 24) ---
  accesRefuse?: boolean;
  motifAccesRefuse?: string;

  // --- État de l'appareil constaté (section 8/25/27), StatutAppareil réutilisé :
  // absent si accesRefuse (on ne peut pas constater un état qu'on n'a pas observé)
  etatAppareilInitial?: StatutAppareil; // à l'arrivée du technicien
  etatAppareilFinal?: StatutAppareil; // à la clôture du rapport
}

/**
 * Une étape de la chronologie d'une intervention (section 8, "timeline
 * visuelle"). Source de vérité de l'écran Détail intervention > Chronologie.
 */
export interface EtapeIntervention {
  id: string;
  interventionId: string;
  type: TypeEtapeIntervention;
  dateHeure: string; // ISO
  commentaire?: string;
  technicienId?: string;
  ticketId?: string; // renseigné pour SIGNALEMENT_RECU/TICKET_RATTACHE
  rapportId?: string; // renseigné pour RAPPORT_AJOUTE
  etatAppareil?: StatutAppareil; // renseigné pour ETAT_APPAREIL_CHANGE
  reaffectationId?: string; // renseigné pour REATTRIBUEE
  origine: OrigineAction;
}

/**
 * Réaffectation d'une Intervention ou d'une Maintenance vers un autre
 * technicien. Fusionne 3 entités quasi identiques trouvées dans les modules
 * sources : Reattribution (interventions), ReaffectationTache
 * (maintenances-planning), DemandeReattributionIntervention (mobile) — voir
 * reconciliation-notes.md. Couvre le bouton Web "Réattribuer" (section 8),
 * le mobile "Je ne peux pas traiter cette intervention" (section 34), le
 * drag & drop planning (section 11.2) et le remplacement pour absence
 * (section 11.3).
 */
export interface Reaffectation {
  id: string;
  cibleType: TypeCiblePlanning;
  cibleId: string; // id de l'Intervention ou de la Maintenance concernée
  ancienTechnicienId?: string; // absent si la cible n'était pas encore affectée
  nouveauTechnicienId: string;
  motif: MotifReattribution;
  commentaire?: string;
  dateHeure: string; // ISO — horodatage réel, immuable (seule exception : le recalage de fraîcheur de la démo, rafraichirFraicheurScenarios dans data/store.ts)
  origine: OrigineAction;
  demandeurNom?: string; // dispatcher (Web) ou technicien lui-même (Mobile)
  origineAbsenceId?: string; // renseigné si déclenchée automatiquement par une AbsenceTechnicien
  utilisateurId?: string; // planificateur à l'origine, absent si automatique
  /** Renseigné si la demande est née hors ligne côté mobile. */
  elementFileSynchronisationId?: string;
}

/**
 * Résultat calculé à la lecture (jamais stocké sur Intervention). Règle de
 * calcul : accesRefuse ou pas de délai défini → NON_APPLICABLE ; si
 * dateArriveeSite connue → comparaison figée (plus de "bientôt dépassé",
 * le sort est scellé) ; sinon → compte à rebours en direct.
 */
export interface EtatSLACalcule {
  interventionId: string;
  delaiContractuelMinutes: number;
  dateLimite: string;
  tempsRestantMinutes: number; // négatif si dépassé
  depassementMinutes: number; // 0 si dans les délais
  pourcentageConsomme: number; // peut dépasser 100
  etat: EtatSLA;
}

/** Ligne de la liste des interventions (section 7.1) — vue de lecture, jamais stockée. */
export interface InterventionListItem {
  intervention: Intervention;
  codeAppareil: string;
  clientNom: string;
  ville: string;
  technicienNom?: string;
  nombreTickets: number;
  sla: EtatSLACalcule;
}

/** Agrégat complet pour l'écran Détail d'une intervention (section 8) — vue de lecture. */
export interface InterventionDetail {
  intervention: Intervention;
  ascenseur: Ascenseur;
  parc: ParcAscenseurs;
  tickets: Ticket[]; // triés par ordreDansIntervention
  etapes: EtapeIntervention[]; // triées chronologiquement
  reaffectations: Reaffectation[];
  technicienActuel?: Technicien;
  sla: EtatSLACalcule;
}

// ============================================================================
// 4. RAPPORTS
// ============================================================================

/** Nature du rapport : ce que le technicien est venu faire. */
export enum TypeRapport {
  DEPANNAGE = "depannage",
  MAINTENANCE = "maintenance",
  DIVERS = "divers", // visite libre / motif hors corrective-préventive
}

/** Comment le rapport est raccroché au reste du système (section 9). */
export enum RattachementRapport {
  INTERVENTION = "intervention", // requiert interventionId
  MAINTENANCE = "maintenance", // requiert maintenanceId
  ISOLE = "isole", // rapport hors tournée, sans intervention/maintenance préexistante (section 33)
}

/** Étape 1 du diagnostic progressif (section 26) : cause probable perçue par le technicien. */
export enum OrigineDiagnostic {
  VETUSTE = "vetuste",
  USURE = "usure",
  VANDALISME = "vandalisme",
  DEFAUT_ELECTRIQUE = "defaut_electrique",
  DEFAUT_MECANIQUE = "defaut_mecanique",
  AUTRE = "autre",
}

/** Étape 3 du diagnostic progressif (section 26) : partie physique de l'appareil concernée. */
export enum LocalDiagnostic {
  CABINE = "cabine",
  GAINE = "gaine",
  TOIT_CABINE = "toit_cabine",
  FOSSE = "fosse",
  LOCAL_MACHINERIE = "local_machinerie",
  PORTES_PALIERES = "portes_palieres",
  ARMOIRE_COMMANDE = "armoire_commande",
  AUTRE = "autre",
}

/** Motif de non-accès à l'appareil (section 24) — référentiel proposé, à administrer (section 17). */
export enum MotifNonAcces {
  CLIENT_ABSENT = "client_absent",
  LOCAL_FERME = "local_ferme",
  CLES_INDISPONIBLES = "cles_indisponibles",
  DIGICODE_INCONNU = "digicode_inconnu",
  ACCES_BLOQUE = "acces_bloque",
  AUTRE = "autre",
}

/** Catégorie d'une photo (section 29). */
export enum CategoriePhoto {
  ETAT_GENERAL = "etat_general",
  AVANT_INTERVENTION = "avant_intervention",
  APRES_INTERVENTION = "apres_intervention",
  PIECE_CASSEE = "piece_cassee",
  RESERVE_CTQ = "reserve_ctq",
  SIGNALETIQUE = "signaletique",
  AUTRE = "autre",
}

/** Issue de la signature client (section 30). */
export enum StatutSignatureClient {
  SIGNE = "signe",
  ABSENT = "absent",
  INDISPONIBLE = "indisponible",
}

/** Validation métier du rapport côté pilotage (notif "Rapport refusé/à corriger", section 45). */
export enum StatutValidationRapport {
  EN_ATTENTE = "en_attente",
  VALIDE = "valide",
  REFUSE_A_CORRIGER = "refuse_a_corriger",
}

/**
 * Référentiel administrable des équipements sélectionnables à l'étape 4 du
 * diagnostic (section 26), filtré par le local choisi à l'étape 3. Étend
 * ReferentielItem (section 7) pour bénéficier du même socle admin
 * (code/ordreAffichage/modifiable) que les autres référentiels.
 */
export interface EquipementReferentiel extends ReferentielItem {
  localsCompatibles: LocalDiagnostic[]; // filtre l'étape 4 selon l'étape 3
}

/** Référentiel des états constatés sur l'équipement, filtré par l'équipement choisi (étape 5). */
export interface EtatEquipementReferentiel extends ReferentielItem {
  equipementIds: string[]; // filtre l'étape 5 selon l'étape 4
  indiquePieceCassee: boolean; // pilote la règle "photo obligatoire pièce cassée" (section 29)
}

/** Référentiel des actions réalisées/demandées, filtré par l'état constaté (étape 6). */
export interface ActionDiagnosticReferentiel extends ReferentielItem {
  etatIds: string[]; // filtre l'étape 6 selon l'étape 5
  necessitePieceDetachee: boolean;
}

/**
 * Règle d'obligation des photos par type de rapport (section 29, "règles
 * avancées optionnelles"). Représentation structurée et fortement typée,
 * préférée à une règle générique RegleMetier pour ce cas précis — voir
 * reconciliation-notes.md.
 */
export interface RegleObligationPhotos {
  id: string;
  typeRapport: TypeRapport;
  nombreMinimal: number;
  avantApresObligatoire: boolean;
  photoObligatoireSiPieceCassee: boolean;
  photoObligatoireSiReserveCtq: boolean;
}

/**
 * Diagnostic progressif en 6 étapes (section 26) : Origine → Étage → Local
 * → Équipement → État → Action. Les id+libellé des étapes 4-6 sont
 * dupliqués (FK + snapshot figé) pour que le rapport reste lisible même si
 * le référentiel évolue ensuite. Absent si accesObtenu = false.
 */
export interface DiagnosticProgressif {
  origine: OrigineDiagnostic; // étape 1
  etage?: string; // étape 2 — libellé libre du niveau
  local?: LocalDiagnostic; // étape 3

  equipementId?: string; // étape 4
  equipementLibelle?: string;

  etatConstateId?: string; // étape 5
  etatConstateLibelle?: string;

  actionId?: string; // étape 6
  actionLibelle?: string;

  commentaireDiagnostic?: string;
}

/**
 * Raccourci "pas d'accès à l'appareil" (section 24). Dès que accesObtenu =
 * false, seuls ces champs existent : le reste du formulaire (état initial,
 * diagnostic, clôture normale) est ignoré et Rapport.etatCloture reste
 * undefined.
 */
export interface RefusAcces {
  motif: MotifNonAcces;
  commentaire?: string;
  photoIds?: string[];
  heureConstat: string; // ISO
}

/** Photo attachée à un rapport (section 29). */
export interface PhotoRapport {
  id: string;
  rapportId: string;
  url: string; // mock: placeholder local ou data URL légère
  categorie: CategoriePhoto;
  legende?: string;
  dateHeure: string;
  technicienId: string;
  reserveCtqId?: string; // requis si categorie = RESERVE_CTQ
}

/** Signature technicien (section 30) — obligatoire pour finaliser le rapport. */
export interface SignatureTechnicien {
  technicienId: string;
  dataUrl: string; // mock: tracé simplifié encodé en base64/SVG
  dateHeure: string;
}

/** Signature client (section 30) — toujours une décision explicite, jamais un champ vide. */
export interface SignatureClient {
  statut: StatutSignatureClient;
  nomSignataire?: string; // requis si statut = SIGNE
  dataUrl?: string; // requis si statut = SIGNE
  motifAbsenceOuIndisponibilite?: string;
  dateHeure: string;
}

/**
 * Rapport d'intervention/maintenance rempli par un technicien (section 9,
 * 24-30). Rattaché à une Intervention, une Maintenance, ou "isolé". Une
 * Intervention peut porter plusieurs Rapports successifs, d'où
 * numeroPassageIntervention.
 *
 * etatInitial/etatCloture réutilisent StatutAppareil (au lieu des enums
 * EtatInitialAppareil/EtatClotureRapport du module d'origine, qui
 * introduisaient une valeur PAS_D_ACCES concurrente de accesObtenu/
 * refusAcces) — voir reconciliation-notes.md. Les deux restent absents si
 * accesObtenu = false : on ne stocke jamais un état qu'on n'a pas observé.
 */
export interface Rapport {
  id: string;
  numero: string; // ex: "RAP-2026-348219"

  rattachement: RattachementRapport;
  interventionId?: string; // requis si rattachement = INTERVENTION
  numeroPassageIntervention?: number; // 1, 2, 3… position dans l'historique de l'intervention
  maintenanceId?: string; // requis si rattachement = MAINTENANCE
  motifRapportIsole?: string; // saisi librement si rattachement = ISOLE

  typeRapport: TypeRapport;

  // --- Appareil et technicien (snapshots figés) ---
  ascenseurId: string;
  adresseAppareil: string;
  technicienId: string;
  technicienNom: string;

  // --- Horodatage (jamais modifié par un nouvel essai de synchronisation) ---
  dateHeureDebut: string; // ISO
  dateHeureFin?: string; // ISO — renseigné à la clôture
  dureeMinutes?: number; // figé à la clôture, non recalculé ensuite

  // --- Étape 1 : accès (section 24) ---
  accesObtenu: boolean;
  refusAcces?: RefusAcces; // requis si accesObtenu = false ; exclusif avec tout ce qui suit

  // --- État initial (section 25), uniquement si accesObtenu = true ---
  etatInitial?: StatutAppareil;

  // --- Diagnostic progressif (section 26), uniquement si accesObtenu = true ---
  diagnostic?: DiagnosticProgressif;

  // --- Spécifique typeRapport = MAINTENANCE ---
  operationsMaintenance?: CategorieMaintenance[];
  resultatTestTelealarme?: ResultatTestTelealarme;

  // --- Clôture (section 27), requis si accesObtenu = true ---
  etatCloture?: StatutAppareil;
  etagesModeDegrade?: string[]; // requis si etatCloture = MODE_DEGRADE
  commentaireCloture?: string;

  // --- Compte-rendu (section 28) ---
  commentaire?: string;
  commentaireSaisieVocale?: boolean;

  // --- Photos (section 29) ---
  photoIds: string[];

  // --- Signatures (section 30) ---
  signatureTechnicien?: SignatureTechnicien;
  signatureClient?: SignatureClient;

  // --- Cycle de vie ---
  origineSaisie: OrigineAction;
  statutSynchronisation: StatutSynchronisation;
  dateDerniereTentativeSync?: string;
  statutValidation: StatutValidationRapport;
  commentaireRefus?: string; // requis si statutValidation = REFUSE_A_CORRIGER
}

/** Résultat générique de validation métier (photos, finalisation...). */
export interface ResultatValidationRapport {
  valide: boolean;
  erreurs: string[];
}

/**
 * Agrégat global des rapports (dashboard, listes). totalCumule est une
 * CONSTANTE de configuration (ex: 348 214), indépendante du nombre d'objets
 * Rapport réellement matérialisés en mémoire (voir mock-data-strategy.md).
 */
export interface RapportsAgregatGlobal {
  totalCumule: number;
  parType: Record<TypeRapport, number>;
  parStatutValidation: Record<StatutValidationRapport, number>;
  parMois: Array<{ mois: string; count: number }>;
}

/** Une étape affichée dans la chronologie de l'aperçu PDF (section 9.3). */
export interface EtapeChronologiePdf {
  libelle: string; // "Arrivée sur site", "Diagnostic posé", "Clôture", "Signature client"
  dateHeure: string;
}

/**
 * Vue de rendu pour l'aperçu PDF client (section 9.3) : contraste élevé,
 * grandes photos, chronologie claire. Calculée à la demande, jamais stockée.
 */
export interface RapportPdfApercu {
  rapport: Rapport;
  appareilCode: string;
  clientNom: string;
  chronologie: EtapeChronologiePdf[];
  photosMisesEnAvant: PhotoRapport[];
}

// ============================================================================
// 5. MAINTENANCES & PLANNING
// ============================================================================

/**
 * Catégories d'opération de maintenance (section 6.1/6.4). Remplace
 * TypeMaintenance (parc-appareil) et TypeOperationMaintenance (rapports),
 * 3 déclinaisons identiques du même enum — voir reconciliation-notes.md.
 */
export enum CategorieMaintenance {
  PERIODIQUE = "periodique",
  CABLE = "cable",
  PARACHUTE = "parachute",
  NETTOYAGE = "nettoyage",
  AUTRE = "autre", // renvoie vers le référentiel configurable TypeMaintenanceRef
}

/** Cycle de vie d'une maintenance (occurrence = un passage, éventuellement combiné). */
export enum StatutMaintenance {
  PLANIFIEE = "planifiee",
  EN_COURS_DE_REALISATION = "en_cours_de_realisation",
  REALISEE = "realisee",
  ANNULEE = "annulee", // reportée définitivement par un planificateur
}

/** Résultat du test téléalarme obligatoire (section 31 — mobile). Déclaration unique (voir notes). */
export enum ResultatTestTelealarme {
  FONCTIONNELLE = "fonctionnelle",
  DEFAILLANTE = "defaillante",
}

/**
 * Item de checklist mobile (section 31). Rattaché à une catégorie précise
 * pour afficher une checklist distincte par opération quand plusieurs
 * catégories sont combinées dans le même passage.
 */
export interface ChecklistItemMaintenance {
  id: string;
  categorie: CategorieMaintenance;
  libelle: string;
  coche: boolean;
  obligatoire: boolean;
}

/**
 * Maintenance = un passage (une occurrence), pouvant combiner plusieurs
 * opérations (section 6.4).
 *
 * RÈGLE CAPITALE (section 6.3) : `datePrevue` est calculée depuis le
 * calendrier CONTRACTUEL au moment de la génération/planification. Elle
 * n'est JAMAIS recalculée à partir de `dateRealisee` d'une occurrence
 * précédente — sinon un retard se "rattraperait" artificiellement. Lors
 * d'une combinaison (section 6.4, plusieurs `categories` dans un même
 * passage), la `datePrevue` retenue est la plus proche des dates dues de
 * chaque catégorie combinée : on avance un entretien, on n'en retarde jamais un.
 */
export interface Maintenance {
  id: string;
  numero: string; // ex: "MNT-2026-004821" (renommé depuis `reference` pour cohérence avec Contrat/Intervention/Rapport)
  ascenseurId: string;
  contratId?: string; // dénormalisé depuis l'ascenseur

  technicienId?: string;
  tourneeId?: string;

  categories: CategorieMaintenance[]; // une ou plusieurs opérations combinées
  typesAutresIds?: string[]; // FK vers TypeMaintenanceRef — uniquement si AUTRE ∈ categories

  datePrevue: string; // ISO date — issue du calendrier contractuel, jamais recalculée
  dateRealisee?: string; // ISO timestamp — requis si statut = REALISEE

  statut: StatutMaintenance;

  heureArrivee?: string;
  heureDebut?: string; // requis si statut = EN_COURS_DE_REALISATION ou REALISEE
  heureFin?: string; // requis si statut = REALISEE
  seuilDureeMinimaleMinutes: number; // dénormalisé depuis SeuilsContrat à la planification
  dureeReelleMinutes?: number;
  avertissementDureeInsuffisante: boolean;
  avertissementJustification?: string;

  testTelealarmeEffectue?: boolean;
  testTelealarmeResultat?: ResultatTestTelealarme; // requis si testTelealarmeEffectue = true

  checklist?: ChecklistItemMaintenance[];

  rapportId?: string; // rapport associé une fois REALISEE
  commentaire?: string;
  origineDerniereModification?: OrigineAction;
}

/** Granularité d'affichage du planning technicien (section 11.1) — paramètre de vue, non stocké. */
export enum VuePlanning {
  JOUR = "jour",
  SEMAINE = "semaine",
  MOIS = "mois",
}

export enum TypeTachePlanning {
  MAINTENANCE = "maintenance",
  INTERVENTION = "intervention",
  ABSENCE = "absence",
}

export enum TypeAbsence {
  CONGE = "conge",
  MALADIE = "maladie",
  FORMATION = "formation",
  AUTRE = "autre",
}

export enum StatutAbsence {
  PLANIFIEE = "planifiee",
  EN_COURS = "en_cours",
  TERMINEE = "terminee",
}

/**
 * Tournée = secteur/route assigné(e) à un technicien titulaire, regroupant
 * un ensemble d'appareils (section 4.1 colonne "Tournée", section 12).
 * secteurId référence SecteurGeographique (section 1). Distincte de
 * TourneeDuJour (section 9), qui est l'instance datée d'une tournée avec
 * ses arrêts concrets pour le rendu carte.
 */
export interface Tournee {
  id: string;
  nom: string; // ex: "Tournée Lyon Presqu'île"
  secteurId?: string;
  ville: string;
  technicienTitulaireId: string;
  couleur?: string;
  actif: boolean;
}

/** Absence d'un technicien sur une période, avec remplacement (section 11.3). */
export interface AbsenceTechnicien {
  id: string;
  technicienId: string;
  type: TypeAbsence;
  dateDebut: string; // ISO date (incluse)
  dateFin: string; // ISO date (incluse)
  statut: StatutAbsence;
  remplacantId?: string;
  commentaire?: string;
  tachesTransfereesIds: string[]; // ids des TachePlanning transférées au remplaçant
}

/**
 * Projection d'affichage du planning technicien (section 11.1) : une case
 * dans la vue jour/semaine/mois. Matérialise une Maintenance, une
 * Intervention ou une Absence sous une forme homogène pour un drag & drop
 * générique (section 11.2). Régénérée depuis les entités sources ; seuls
 * les champs de réaffectation sont persistés pour l'historique visuel.
 */
export interface TachePlanning {
  id: string;
  type: TypeTachePlanning;
  technicienId: string;
  tourneeId?: string;
  ascenseurId?: string; // absent pour une ABSENCE
  referenceId: string; // id de la Maintenance/Intervention/AbsenceTechnicien sous-jacente
  dateDebut: string; // ISO timestamp
  dateFin: string; // ISO timestamp
  urgent: boolean;
  libelle: string; // ex: "Périodique + câble — ASC-0231"
  statutAffichage: string; // libellé court, ex: "En retard", "Planifiée", "Absent"
  reaffecte: boolean; // true si déplacé depuis son technicien/tournée d'origine
  technicienOrigineId?: string; // requis si reaffecte = true
  motifReaffectation?: MotifReattribution; // requis si reaffecte = true
}

/** Regroupement de la "vue prioritaire" (section 6.2) — calculé, jamais stocké. */
export enum PrioriteAffichageMaintenance {
  EN_RETARD = "en_retard",
  CETTE_SEMAINE = "cette_semaine",
  A_VENIR = "a_venir",
}

/** Maintenance enrichie des champs calculés à l'affichage (retard, priorité, durée en cours). */
export interface MaintenanceAvecUrgence extends Maintenance {
  retardJours: number; // 0 si non en retard
  prioriteAffichage: PrioriteAffichageMaintenance | null; // null si REALISEE/ANNULEE
  dureeEnCoursMinutes?: number; // calculé si statut = EN_COURS_DE_REALISATION
}

/** Résumé de charge d'un technicien pour un jour donné (vue "mois" du planning). */
export interface ChargeJourTechnicien {
  technicienId: string;
  date: string; // ISO date
  nombreTaches: number;
  nombreUrgences: number;
  nombreMaintenancesEnRetard: number;
  tauxRemplissage: number; // 0-100, indicatif
}

// ============================================================================
// 6. CTQ & RÉSERVES
// ============================================================================

/**
 * Statut d'une réserve CTQ — cycle de vie complet (section 10.3) :
 * A_TRAITER -> PLANIFIEE -> EN_COURS -> TRAITEE -> A_CONTROLER -> VALIDEE
 * (retour possible de A_CONTROLER vers EN_COURS si contre-visite négative).
 */
export enum StatutReserve {
  A_TRAITER = "a_traiter",
  PLANIFIEE = "planifiee",
  EN_COURS = "en_cours",
  TRAITEE = "traitee",
  A_CONTROLER = "a_controler",
  VALIDEE = "validee",
}

/** Statut agrégé d'un contrôle CTQ, dérivé de l'état de ses réserves — jamais positionné à la main. */
export enum StatutControleCTQ {
  PLANIFIE = "planifie",
  REALISE_SANS_RESERVE = "realise_sans_reserve",
  RESERVES_A_TRAITER = "reserves_a_traiter",
  RESERVES_EN_COURS = "reserves_en_cours",
  RESERVES_A_CONTROLER = "reserves_a_controler",
  SOLDE = "solde",
}

/** Gravité d'une réserve — pilote la priorisation terrain et les urgences dashboard. */
export enum GraviteReserve {
  MINEURE = "mineure",
  MAJEURE = "majeure",
  CRITIQUE = "critique", // impact sécurité des personnes
}

/** État constaté sur un point de contrôle lors de la visite du bureau d'études. */
export enum EtatPointControle {
  CONFORME = "conforme",
  NON_CONFORME = "non_conforme", // génère systématiquement une ReserveCTQ liée
  NON_APPLICABLE = "non_applicable",
  NON_VERIFIE = "non_verifie",
}

/** Catégorie réglementaire d'un bloc de contrôle (arrêté du 18/11/2004) — référentiel administrable. */
export enum CategorieBlocControle {
  MACHINERIE = "machinerie",
  CABINE = "cabine",
  PORTES_PALIERES = "portes_palieres",
  GAINE_CUVETTE = "gaine_cuvette",
  DISPOSITIFS_SECURITE = "dispositifs_securite",
  TELEALARME = "telealarme",
  ACCESSIBILITE = "accessibilite",
  DOCUMENTATION = "documentation",
  AUTRE = "autre",
}

/** Type d'action de terrain qui traite une réserve. */
export enum TypeTraitementReserve {
  INTERVENTION = "intervention",
  MAINTENANCE = "maintenance",
}

/** Type d'événement dans l'historique d'une réserve (traçabilité section 46). */
export enum TypeEvenementReserve {
  RESERVE_CREEE = "reserve_creee",
  RESERVE_PLANIFIEE = "reserve_planifiee",
  TRAITEMENT_DEMARRE = "traitement_demarre",
  RESERVE_TRAITEE = "reserve_traitee",
  RESERVE_A_CONTROLER = "reserve_a_controler",
  RESERVE_VALIDEE = "reserve_validee",
  RESERVE_REOUVERTE = "reserve_reouverte", // contre-visite négative
  COMMENTAIRE_AJOUTE = "commentaire_ajoute",
}

/** Bureau d'études/organisme de contrôle accrédité en charge des CTQ. */
export interface BureauEtudes {
  id: string;
  nom: string;
  agrement?: string;
  contact?: string;
  telephone?: string;
}

/** Référence polymorphe vers l'action de terrain qui traite une réserve. */
export interface ReferenceTraitement {
  type: TypeTraitementReserve;
  id: string; // interventionId ou maintenanceId selon `type`
}

/**
 * Contrôle technique quinquennal (CTQ) réalisé sur un appareil (section
 * 10.1). `statut` est TOUJOURS dérivé des réserves — jamais saisi à la main.
 */
export interface ControleCTQ {
  id: string;
  numero: string; // ex. "CTQ-2026-0347"
  appareilId: string;
  clientId: string;
  bureauEtudesId: string;
  technicienId?: string; // technicien Manei-Lift référent du suivi des réserves
  dateVisite: string; // ISO
  dateProchainControle: string; // ISO — échéance réglementaire (+5 ans)
  statut: StatutControleCTQ;
  nombreReserves: number; // dénormalisé pour l'affichage rapide
  nombreReservesSoldees: number; // permet d'afficher "3/5 traitées"
  blocs: BlocControle[];
  rapportPdfUrl?: string;
}

/** Bloc réglementaire d'un contrôle (ex. "Machinerie", "Portes palières") — section 10.2. */
export interface BlocControle {
  id: string;
  controleId: string;
  categorie: CategorieBlocControle;
  libelle: string;
  ordre: number;
  points: PointDeControle[];
}

/** Point de contrôle unitaire au sein d'un bloc (section 10.2). */
export interface PointDeControle {
  id: string;
  blocId: string;
  libelle: string;
  reference?: string; // référence réglementaire
  etat: EtatPointControle;
  commentaireControleur?: string;
  photosConstatIds: string[]; // FK vers PhotoRapport, prises par le contrôleur lors de la visite
  reserveId?: string; // renseigné uniquement si etat = NON_CONFORME
}

/**
 * Réserve CTQ — anomalie relevée sur un point de contrôle, à lever avant la
 * prochaine échéance. Entité pivot du module CTQ. Les photos réutilisent
 * PhotoRapport (via ids) au lieu de string[] d'URLs brutes, pour une
 * métadonnée cohérente (auteur, catégorie, date) partout dans le modèle —
 * voir reconciliation-notes.md.
 */
export interface ReserveCTQ {
  id: string;
  numero: string; // ex. "RES-2026-01582"
  controleId: string;
  pointDeControleId: string;

  appareilId: string; // dénormalisé pour les vues mobile/liste et le filtrage transverse
  clientId: string;
  libelleBloc: string;

  description: string;
  actionDemandee: string;
  gravite: GraviteReserve;
  localisation?: string;

  statut: StatutReserve;
  dateConstat: string; // ISO
  dateEcheance?: string;
  photosConstatIds: string[]; // photos "avant", FK vers PhotoRapport

  technicienAssigneId?: string;
  traitement?: ReferenceTraitement;
  datePlanification?: string;
  dateTraitement?: string;
  commentaireTechnicien?: string;
  photosTraitementIds: string[]; // photos "après" — obligatoires (section 29), FK vers PhotoRapport

  dateValidation?: string;
  validePar?: string;
  commentaireValidation?: string;
}

/** Événement dans l'historique d'une réserve (audit section 46). */
export interface EvenementReserve {
  id: string;
  reserveId: string;
  typeEvenement: TypeEvenementReserve;
  dateHeure: string; // ISO
  ancienStatut?: StatutReserve;
  nouveauStatut?: StatutReserve;
  technicienId?: string;
  commentaire?: string;
  origine?: OrigineAction;
}

/** Ligne d'affichage du détail d'un contrôle (section 10.2) — vue de lecture, jamais stockée. */
export interface LignePointDeControle {
  blocLibelle: string;
  point: PointDeControle;
  reserve?: ReserveCTQ; // présent uniquement si point.etat === NON_CONFORME
}

/**
 * Mission CTQ mobile (section 32) — vue "réserve affectée à un technicien",
 * aplatie pour un rendu terrain immédiat. Calculée, jamais persistée
 * séparément de ReserveCTQ.
 */
export interface MissionCTQ extends ReserveCTQ {
  appareilCode: string;
  adresseAppareil: string;
  clientNom: string;
  bureauEtudesNom: string;
}

/**
 * NOTE — logique métier CTQ (planifierReserve, demarrerTraitementReserve,
 * declarerReserveTraitee, soumettreReservePourControle, validerReserve,
 * reouvrirReserve, calculerStatutControle, estReserveEnRetard) : proposée
 * par le module CTQ sur le même modèle que declarerPanne/attribuerTechnicien
 * (garde métier + throw Error + retour { reserve, evenement }). À ajouter
 * dans business-logic.ts lors de la fusion — non dupliquée ici car ce
 * fichier ne contient que des types.
 */

// ============================================================================
// 7. INTÉGRATIONS & ADMINISTRATION
// ============================================================================

/** Systèmes tiers explicitement listés dans le cahier des charges (section 15). */
export enum SystemeExterne {
  SERENITE = "serenite",
  GETRALINE = "getraline",
  INTENT = "intent",
  CITRON = "citron",
  H2 = "h2",
  SAP = "sap",
}

/**
 * Statut de connexion tel que littéralement demandé ("Connectée /
 * déconnectée"). L'état "lente" affiché en maquette est un badge dérivé
 * côté UI quand tempsReponseMoyenMs dépasse un seuil (ex. 1500 ms) alors que
 * statutConnexion reste CONNECTEE.
 */
export enum StatutConnexionIntegration {
  CONNECTEE = "connectee",
  DECONNECTEE = "deconnectee",
}

/** État courant d'une intégration externe (carte affichée sur l'écran Intégrations). */
export interface IntegrationExterne {
  id: string;
  systeme: SystemeExterne;
  nomAffiche: string; // ex. "SAP — Catalogue pièces"
  statutConnexion: StatutConnexionIntegration;
  derniereSynchronisation?: string; // ISO ; absent si jamais synchronisé
  derniereErreurMessage?: string;
  derniereErreurDate?: string; // ISO
  nombreTachesEnAttente: number;
  tempsReponseMoyenMs: number;
}

export enum DirectionEchange {
  ENTRANT = "entrant",
  SORTANT = "sortant",
}

export enum StatutEchange {
  SUCCES = "succes",
  ECHEC = "echec",
  EN_COURS = "en_cours",
  EN_ATTENTE = "en_attente",
}

/** Ligne du journal des échanges avec un système externe. */
export interface JournalEchangeIntegration {
  id: string;
  integrationId: string;
  systeme: SystemeExterne; // dénormalisé pour affichage/tri rapide
  direction: DirectionEchange;
  evenement: string; // ex. "Réception ticket #4521", "Envoi rapport PDF"
  dateHeure: string; // ISO
  statut: StatutEchange;
  nombreTentatives: number;
  messageErreur?: string; // requis si statut = ECHEC
}

/**
 * Rôles applicatifs (sections 14/15/17). Fusionne les listes de rôles des
 * modules contrats-admin (6 valeurs) et taches-carto-notif (5 valeurs, stub
 * explicitement délégué à ce module) — voir reconciliation-notes.md.
 * RESPONSABLE_EXPLOITATION (taches-carto-notif) est absorbé par SUPERVISEUR ;
 * CLIENT (taches-carto-notif) est absorbé par LECTEUR.
 */
export enum RoleUtilisateur {
  ADMINISTRATEUR = "administrateur",
  SUPERVISEUR = "superviseur",
  RESPONSABLE_PARC = "responsable_parc",
  GESTIONNAIRE_CONTRATS = "gestionnaire_contrats",
  DISPATCHEUR = "dispatcheur",
  TECHNICIEN = "technicien",
  LECTEUR = "lecteur", // portail client / consultation seule
}

export enum StatutCompteUtilisateur {
  ACTIF = "actif",
  INACTIF = "inactif",
  SUSPENDU = "suspendu",
  EN_ATTENTE_ACTIVATION = "en_attente_activation",
}

/** Mode d'authentification (section 41 : connexion SSO/Active Directory). */
export enum ModeAuthentification {
  LOCAL = "local",
  SSO_ENTREPRISE = "sso_entreprise",
}

/** Permissions granulaires composant la matrice rôles x permissions. */
export enum Permission {
  VOIR_PARC = "voir_parc",
  GERER_PARC = "gerer_parc",
  VOIR_INTERVENTIONS = "voir_interventions",
  GERER_INTERVENTIONS = "gerer_interventions",
  VOIR_MAINTENANCES = "voir_maintenances",
  GERER_MAINTENANCES = "gerer_maintenances",
  VOIR_RAPPORTS = "voir_rapports",
  VALIDER_RAPPORTS = "valider_rapports",
  VOIR_CTQ = "voir_ctq",
  GERER_CTQ = "gerer_ctq",
  VOIR_PLANNING = "voir_planning",
  GERER_PLANNING = "gerer_planning",
  VOIR_CONTRATS = "voir_contrats",
  GERER_CONTRATS = "gerer_contrats",
  VOIR_INTEGRATIONS = "voir_integrations",
  GERER_INTEGRATIONS = "gerer_integrations",
  VOIR_GEOLOCALISATION_TECHNICIENS = "voir_geolocalisation_techniciens", // réservé, section 13
  ADMINISTRER_UTILISATEURS = "administrer_utilisateurs",
  ADMINISTRER_REFERENTIELS = "administrer_referentiels",
  VOIR_AUDIT_LOGS = "voir_audit_logs",
  EXPORTER_DONNEES = "exporter_donnees",
}

/** Définition d'un rôle : libellé affiché + permissions accordées. */
export interface RoleDefinition {
  role: RoleUtilisateur;
  libelle: string;
  description: string;
  permissions: Permission[];
}

/**
 * Compte utilisateur applicatif, source de vérité pour l'authentification
 * locale ou SSO et pour l'écran Administration > Utilisateurs. Version
 * canonique (contrats-admin) ; le stub minimal proposé par
 * taches-carto-notif ({id,nomComplet,email,role,actif}) est absorbé ici
 * (actif se déduit de statut === ACTIF).
 */
export interface Utilisateur {
  id: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  role: RoleUtilisateur;
  statut: StatutCompteUtilisateur;
  modeAuthentification: ModeAuthentification;
  groupeActiveDirectory?: string; // renseigné uniquement si modeAuthentification = SSO_ENTREPRISE
  parcIds?: string[]; // périmètre visible, utilisé pour RESPONSABLE_PARC
  clientId?: string; // portail client, utilisé pour LECTEUR
  technicienId?: string; // lien vers la fiche Technicien, utilisé pour TECHNICIEN
  derniereConnexion?: string; // ISO
  dateCreation: string; // ISO
}

/**
 * Socle commun à tous les référentiels administrables (le cahier des
 * charges demande explicitement qu'ils restent configurables, ex. section
 * 6.1 "autre maintenance configurable").
 */
export interface ReferentielItem {
  id: string;
  code: string; // slug stable, ex. "periodique"
  libelle: string;
  description?: string;
  actif: boolean;
  ordreAffichage: number;
  modifiable: boolean; // false pour les entrées socle non supprimables
}

/**
 * Types de maintenance "autre" configurables (section 6.1/17). Fusionne
 * TypeMaintenanceConfigure (maintenances-planning) et TypeMaintenanceRef
 * (contrats-admin), qui modélisaient la même chose sous deux formes — voir
 * reconciliation-notes.md.
 */
export interface TypeMaintenanceRef extends ReferentielItem {
  couleur?: string; // affichage calendrier/planning
  dureeMinimaleMinutesParDefaut?: number;
  necessiteTeleAlarme?: boolean;
}

/**
 * Causes de panne administrables (section 26/17), utilisées en complément
 * de l'enum fermé OrigineDiagnostic quand celui-ci vaut AUTRE — même motif
 * que CategorieMaintenance.AUTRE + TypeMaintenanceRef.
 */
export interface CausePanneRef extends ReferentielItem {
  categorie: string;
}

/**
 * SUPPRIMÉS PAR RÉCONCILIATION (voir reconciliation-notes.md) :
 * - EquipementRef / ActionRef (contrats-admin) : trop peu structurés,
 *   remplacés par les référentiels en chaîne du module Rapports
 *   (EquipementReferentiel / EtatEquipementReferentiel /
 *   ActionDiagnosticReferentiel, section 4), qui portent déjà les FK de
 *   filtrage en cascade demandées par la section 26.
 * - DomaineStatut / StatutRef (contrats-admin) : rendraient StatutAppareil/
 *   StatutIntervention/StatutReserve/StatutValidationRapport administrables
 *   dynamiquement, ce qui contredit le reste du modèle (machines à états
 *   fermées, transitions codées en dur dans business-logic.ts). Les statuts
 *   restent des enums TypeScript fermés, pas des référentiels.
 */

/** Types de règles métier paramétrables — réduit aux règles non déjà couvertes par une entité dédiée. */
export enum TypeRegleMetier {
  VALIDATION_SIGNATURE_CLIENT = "validation_signature_client",
  AUTRE = "autre",
}

/**
 * Règle métier configurable générique — escape hatch pour les règles sans
 * entité dédiée. Les règles de seuil de durée (SlaContrat/Maintenance), de
 * photo obligatoire (RegleObligationPhotos) et d'alerte SLA
 * (ConfigurationNotification.delaiAvantAlerteMinutes) ont désormais leur
 * propre modèle structuré et ne passent plus par ce mécanisme générique —
 * voir reconciliation-notes.md.
 */
export interface RegleMetier {
  id: string;
  code: string;
  libelle: string;
  type: TypeRegleMetier;
  description: string;
  actif: boolean;
  parametres: Record<string, string | number | boolean>;
  modifiablePar: RoleUtilisateur[];
}

/**
 * Types de notifications (section 45). Version canonique (taches-carto-notif) ;
 * contrats-admin avait défini un doublon quasi identique (2 libellés
 * légèrement différents) — voir reconciliation-notes.md.
 */
export enum TypeNotification {
  NOUVELLE_INTERVENTION_URGENTE = "nouvelle_intervention_urgente",
  INTERVENTION_ASSIGNEE = "intervention_assignee",
  SLA_BIENTOT_DEPASSE = "sla_bientot_depasse",
  MAINTENANCE_EN_RETARD = "maintenance_en_retard",
  SYNCHRONISATION_API_ECHEC = "synchronisation_api_echec",
  EXPORT_TERMINE = "export_termine",
  RAPPORT_A_CORRIGER = "rapport_a_corriger",
  RESERVE_CTQ_AFFECTEE = "reserve_ctq_affectee",
}

export enum CanalNotification {
  IN_APP = "in_app",
  EMAIL = "email",
  PUSH_MOBILE = "push_mobile",
  SMS = "sms",
}

/** Configuration admin d'un type de notification : canaux actifs et rôles destinataires par défaut. */
export interface ConfigurationNotification {
  id: string;
  type: TypeNotification;
  libelle: string;
  canauxActifs: CanalNotification[];
  rolesDestinataires: RoleUtilisateur[];
  actif: boolean;
  delaiAvantAlerteMinutes?: number; // ex. alerte X min avant dépassement de SLA
}

// ============================================================================
// 8. MOBILE & SYNCHRONISATION
// ============================================================================

/** État de connexion réseau de l'application mobile (sections 18/19/36). */
export enum EtatConnexionMobile {
  EN_LIGNE = "en_ligne",
  HORS_LIGNE = "hors_ligne",
  SYNCHRONISATION_EN_COURS = "synchronisation_en_cours",
}

/**
 * Statut d'une session de travail technicien (section 37 : début/fin de
 * journée). Distinct de StatutPresenceTechnicien (section 9), qui décrit la
 * présence en temps réel pour la carte, pas le cycle jour de travail.
 */
export enum StatutSessionTechnicien {
  EN_COURS = "en_cours",
  TERMINEE = "terminee",
}

/** Type d'élément pouvant apparaître dans la file de synchronisation mobile (section 35). */
export enum TypeElementSynchronisation {
  RAPPORT = "rapport",
  PHOTO = "photo",
  INTERVENTION = "intervention",
  MAINTENANCE = "maintenance",
  MODIFICATION_FICHE_TECHNIQUE = "modification_fiche_technique",
  RESERVE_CTQ = "reserve_ctq",
  REATTRIBUTION_INTERVENTION = "reattribution_intervention",
}

/**
 * Statut de synchronisation d'un élément de la file (section 35). Version
 * canonique, avec BROUILLON ajouté pour couvrir la saisie non finalisée
 * (StatutSynchronisationRapport, module Rapports) et réutilisée aussi par
 * EntreeJournalModification et EntreeAudit — voir reconciliation-notes.md.
 */
export enum StatutSynchronisation {
  BROUILLON = "brouillon",
  EN_ATTENTE = "en_attente",
  ENVOI_EN_COURS = "envoi_en_cours",
  SYNCHRONISE = "synchronise",
  ECHEC = "echec",
}

/** Origine du téléchargement local d'un appareil pour l'usage hors ligne (sections 20/21/36). */
export enum OrigineTelechargementAppareil {
  TOURNEE = "tournee",
  RECHERCHE_PONCTUELLE = "recherche_ponctuelle",
}

/**
 * Deux options possibles pour le PTI/DATI (section 38). Chaque technicien
 * de démonstration porte son propre mode pour montrer les deux options.
 */
export enum ModePTI {
  INTEGRATION_SERVICE_TIERS = "integration_service_tiers", // Option A
  MODULE_INTERNE = "module_interne", // Option B
}

/**
 * États du module PTI/DATI (section 38, option B) ; pour l'option A,
 * simple miroir du statut renvoyé par le service externe. Volontairement
 * indépendant de StatutSynchronisation : la sécurité du technicien ne doit
 * jamais dépendre d'une file GMAO en échec ou d'un mode hors ligne.
 */
export enum EtatProtectionPTI {
  PROTECTION_ACTIVE = "protection_active",
  PRE_ALERTE = "pre_alerte",
  SOS_DECLENCHE = "sos_declenche",
  INHIBEE_TEMPORAIREMENT = "inhibee_temporairement",
  REACTIVATION_EN_COMPTE_A_REBOURS = "reactivation_en_compte_a_rebours",
}

/**
 * Session de travail d'un technicien sur mobile : début/fin de journée,
 * tournée du jour (pré-remplie depuis le planning, jamais ressaisie
 * manuellement) et état de connexion courant.
 */
export interface SessionTechnicien {
  id: string;
  technicienId: string;
  dateDebut: string; // horodatage réel, immuable
  dateFin?: string; // posé une seule fois à la clôture
  statut: StatutSessionTechnicien;
  tourneeId?: string; // tournée (secteur) du jour, connue du planning
  etatConnexion: EtatConnexionMobile;
  derniereSynchronisationReussie?: string;
}

/**
 * Vue agrégée de l'état de synchronisation d'un technicien : alimente
 * l'indicateur mobile ("Tout est synchronisé"/"3 éléments en attente") et
 * la colonne "Dernière synchronisation mobile" des écrans Web Techniciens.
 */
export interface EtatSynchronisationTechnicien {
  technicienId: string;
  sessionTechnicienId: string;
  etatConnexion: EtatConnexionMobile;
  nombreElementsEnAttente: number; // en_attente + envoi_en_cours
  nombreElementsEnEchec: number;
  derniereSynchronisationReussie?: string;
}

/**
 * Élément unitaire de la file de synchronisation mobile (section 35).
 * `horodatageEvenement` capture le moment réel de l'action terrain, posé
 * une seule fois, JAMAIS modifié par une nouvelle tentative d'envoi — seuls
 * dateDerniereTentative/nombreTentatives/messageErreur/statut évoluent.
 */
export interface ElementFileSynchronisation {
  id: string;
  type: TypeElementSynchronisation;
  entiteId: string; // id local de l'objet concerné (rapportId, photoId, interventionId...)
  libelleAffichage: string; // ex. "Rapport #12451"
  technicienId: string;
  sessionTechnicienId?: string;
  statut: StatutSynchronisation;

  horodatageEvenement: string; // IMMUABLE

  dateDerniereTentative?: string;
  dateSynchronisationReussie?: string;
  nombreTentatives: number;
  messageErreur?: string;
  peutReessayer: boolean; // true uniquement si statut = ECHEC

  tailleOctets?: number; // pertinent surtout pour les photos
}

/** Appareil conservé localement sur le mobile pour un accès hors ligne (sections 20/21/36). */
export interface AppareilTelechargeLocalement {
  appareilId: string;
  technicienId: string;
  dateTelechargement: string;
  origine: OrigineTelechargementAppareil;
}

/**
 * Configuration PTI/DATI d'un technicien pour la démo (section 38) : les
 * deux options du cahier sont représentées.
 */
export interface ConfigurationPTI {
  mode: ModePTI;
  fournisseurExterne?: string; // renseigné si mode = INTEGRATION_SERVICE_TIERS
  urlServiceExterne?: string;
}

/**
 * État de protection PTI/DATI courant d'un technicien en session.
 * Volontairement indépendant de la file de synchronisation GMAO.
 */
export interface EtatPTITechnicien {
  technicienId: string;
  sessionTechnicienId?: string;
  mode: ModePTI;
  etat: EtatProtectionPTI;
  dateDernierChangementEtat: string;
  /** Instant (ISO) où l'inhibition se termine — renseigné si etat = REACTIVATION_EN_COMPTE_A_REBOURS. */
  finCompteARebours?: string;
  dureeInhibitionSecondes?: number;
  identifiantAbonneExterne?: string; // pertinent uniquement pour mode = INTEGRATION_SERVICE_TIERS
}

// ============================================================================
// 9. TÂCHES ASYNCHRONES, CARTOGRAPHIE, NOTIFICATIONS & AUDIT
// ============================================================================

// ---------- Cartographie (section 13) ----------

export interface Coordonnees {
  latitude: number;
  longitude: number;
}

/**
 * Point de carte représentant un appareil. Vue projetée et volontairement
 * plate — un "read model" dédié au rendu carte, recalculé à partir des
 * entités sources. niveauUrgence réutilise PrioriteIntervention (section 3)
 * au lieu d'un enum dédié NiveauUrgenceIntervention — voir
 * reconciliation-notes.md.
 */
export interface PointCarteAppareil {
  appareilId: string;
  coordonnees: Coordonnees;
  statut: StatutAppareil;
  ville: string;
  clientId: string;
  contratId?: string;
  technicienAffecteId?: string;
  tourneeId?: string;
  interventionUrgenteId?: string; // renseigné si une intervention urgente est ouverte sur cet appareil
  niveauUrgence?: PrioriteIntervention; // renseigné si interventionUrgenteId est défini
}

/**
 * Présence en temps réel d'un technicien pour la carte de tracking.
 * Renommé depuis le `StatutSessionTechnicien` du module taches-carto-notif,
 * qui entrait en collision de nom avec le statut de session jour/nuit du
 * module Mobile (section 8) — voir reconciliation-notes.md.
 */
export enum StatutPresenceTechnicien {
  EN_LIGNE = "en_ligne",
  EN_PAUSE = "en_pause",
  HORS_LIGNE = "hors_ligne",
}

/**
 * Position géographique d'un technicien (dernier point de tracking mobile).
 * ACCÈS RESTREINT (section 13 : "réservée aux profils administratifs
 * autorisés") : à servir séparément de Technicien, jamais fusionnée dans la
 * fiche technicien standard, filtrée côté store/API selon le rôle de
 * l'appelant (ADMINISTRATEUR/SUPERVISEUR uniquement).
 */
export interface PositionTechnicien {
  technicienId: string;
  coordonnees: Coordonnees;
  horodatage: string; // ISO — dernier ping mobile connu
  statutPresence: StatutPresenceTechnicien;
  tourneeDuJourId?: string;
  precisionMetres?: number;
}

export enum TypeZoneGeographique {
  SECTEUR_TECHNICIEN = "secteur_technicien",
  ZONE_COMMERCIALE = "zone_commerciale",
}

/**
 * Zone/secteur géographique affiché sur la carte (contour simplifié,
 * suffisant pour une démo — pas un vrai référentiel SIG). Quand
 * type = SECTEUR_TECHNICIEN, secteurId relie le polygone à la définition
 * administrative correspondante (SecteurGeographique, section 1) : le
 * contour est la représentation cartographique, SecteurGeographique reste
 * la source de vérité des villes couvertes.
 */
export interface ZoneGeographique {
  id: string;
  nom: string; // ex: "Secteur Lyon Centre"
  type: TypeZoneGeographique;
  couleur: string; // ex: '#2563eb'
  contour: Coordonnees[]; // polygone simplifié (3+ points)
  technicienResponsableId?: string; // renseigné si type = SECTEUR_TECHNICIEN
  secteurId?: string; // renseigné si type = SECTEUR_TECHNICIEN, FK SecteurGeographique
}

export enum StatutEtapeTournee {
  A_VENIR = "a_venir",
  EN_COURS = "en_cours",
  TERMINEE = "terminee",
  MANQUEE = "manquee",
}

export interface EtapeTournee {
  ordre: number;
  appareilId: string;
  coordonnees: Coordonnees;
  heurePrevue?: string;
  heureReelle?: string; // renseigné une fois l'étape TERMINEE
  statut: StatutEtapeTournee;
}

/**
 * Instance datée d'une Tournee (section 5) pour le rendu carte : ses arrêts
 * concrets pour une date donnée. Renommé depuis le `Tournee` du module
 * taches-carto-notif, qui entrait en collision de nom avec la tournée
 * "secteur" long-lived du module Maintenances & Planning (section 5) — voir
 * reconciliation-notes.md. tourneeId relie l'instance du jour à son secteur
 * de rattachement ; technicienId est l'exécutant réel (peut différer du
 * titulaire du secteur en cas de remplacement pour absence).
 */
export interface TourneeDuJour {
  id: string;
  tourneeId?: string; // FK vers Tournee (secteur), section 5
  technicienId: string;
  date: string; // YYYY-MM-DD
  zoneId?: string;
  etapes: EtapeTournee[];
}

/** État des filtres du panneau de cartographie (section 13). */
export interface FiltresCarte {
  technicienId?: string;
  statutAppareil?: StatutAppareil;
  clientId?: string;
  interventionId?: string; // deep-link depuis le détail d'une intervention
  interventionsUrgentesUniquement?: boolean;
  maintenancesEnRetardUniquement?: boolean;
}

// ---------- Centre de tâches asynchrones (section 16) ----------

export enum TypeTacheAsynchrone {
  EXPORT_HISTORIQUE_CLIENT = "export_historique_client",
  EXPORT_DONNEES_PARC = "export_donnees_parc",
  GENERATION_RAPPORT_PERIODIQUE = "generation_rapport_periodique",
  GENERATION_PDF_UNITAIRE = "generation_pdf_unitaire",
  GENERATION_PDF_GROUPEE = "generation_pdf_groupee",
  SYNCHRONISATION_INTEGRATION = "synchronisation_integration",
  IMPORT_DONNEES = "import_donnees",
}

export enum StatutTacheAsynchrone {
  EN_ATTENTE = "en_attente",
  EN_COURS = "en_cours",
  TERMINE = "termine",
  ECHEC = "echec",
}

/** Section 43 (workers de l'architecture) — purement informatif. */
export enum WorkerTraitement {
  PDF = "worker_pdf",
  EXPORT = "worker_export",
  INTEGRATIONS = "worker_integrations",
  NOTIFICATIONS = "worker_notifications",
  MEDIAS = "worker_medias",
  PLANIFICATION = "worker_planification",
  STATISTIQUES = "worker_statistiques",
}

export enum FormatFichierExport {
  PDF = "pdf",
  CSV = "csv",
  XLSX = "xlsx",
  ZIP = "zip",
}

export interface ResultatTacheAsynchrone {
  urlTelechargement: string; // simulée pour la démo
  nomFichier: string;
  formatFichier: FormatFichierExport;
  tailleOctets: number;
}

/**
 * Tâche du centre de traitements asynchrones (section 16). L'utilisateur
 * peut quitter la page sans interrompre le traitement : la progression vit
 * dans le store serveur, pas dans un state React local.
 */
export interface TacheAsynchrone {
  id: string;
  type: TypeTacheAsynchrone;
  libelle: string; // ex: "Export historique client A"
  statut: StatutTacheAsynchrone;
  progression?: number; // 0-100 ; absent si statut = EN_ATTENTE
  nombreElementsTotal?: number;
  nombreElementsTraites?: number;
  demandeParUtilisateurId: string;
  worker?: WorkerTraitement;
  dateDemande: string; // ISO
  dateDebutTraitement?: string; // renseigné dès passage à EN_COURS
  dateFin?: string; // renseigné si TERMINE ou ECHEC
  resultat?: ResultatTacheAsynchrone; // renseigné si TERMINE
  messageErreur?: string; // renseigné si ECHEC
  nombreTentatives?: number;
}

// ---------- Centre de notifications (section 45) ----------

export enum GraviteNotification {
  INFO = "info",
  AVERTISSEMENT = "avertissement",
  CRITIQUE = "critique",
}

/**
 * Type générique de l'objet ciblé par "lien vers l'objet concerné" —
 * permet à Notification de pointer vers n'importe quelle entité sensible.
 */
export enum TypeObjetLie {
  APPAREIL = "appareil",
  INTERVENTION = "intervention",
  MAINTENANCE = "maintenance",
  RAPPORT = "rapport",
  TACHE_ASYNCHRONE = "tache_asynchrone",
  RESERVE_CTQ = "reserve_ctq",
  INTEGRATION_API = "integration_api",
}

export interface Notification {
  id: string;
  type: TypeNotification;
  gravite: GraviteNotification;
  titre: string;
  message: string;
  dateCreation: string; // ISO
  lu: boolean;
  dateLecture?: string; // renseigné si lu = true
  destinataireUtilisateurId?: string; // ciblage nominatif (ex: technicien assigné)
  destinataireRole?: RoleUtilisateur; // ciblage par rôle (ex: tous les administrateurs)
  objetLieType: TypeObjetLie;
  objetLieId: string;
}

// ---------- Audit transverse (section 46) ----------

/**
 * Type d'entité concernée par l'entrée d'audit. Fusionne les listes de
 * contrats-admin (7 valeurs) et taches-carto-notif (5 valeurs) — voir
 * reconciliation-notes.md.
 */
export enum TypeEntiteAuditee {
  APPAREIL = "appareil",
  PARC = "parc",
  CONTRAT = "contrat",
  UTILISATEUR = "utilisateur",
  INTERVENTION = "intervention",
  MAINTENANCE = "maintenance",
  RAPPORT = "rapport",
  RESERVE_CTQ = "reserve_ctq",
  INTEGRATION = "integration",
  REFERENTIEL = "referentiel",
}

/**
 * Entrée générique d'audit log, distincte de EntreeJournalModification (qui
 * reste dédiée à la fiche d'UN appareil, section 1) : EntreeAudit couvre
 * N'IMPORTE QUELLE entité sensible pour l'écran Administration > Audit logs
 * (ex. "Jean Dupont a modifié le digicode. 4521 → 8754" ou "Synchronisé
 * depuis Android."). Fusionne AuditLogEntry (contrats-admin) et EntreeAudit
 * (taches-carto-notif), qui modélisaient la même chose — voir
 * reconciliation-notes.md.
 */
export interface EntreeAudit {
  id: string;
  dateHeure: string; // ISO — horodatage réel de l'action, jamais réécrit lors d'un renvoi
  utilisateurId?: string; // absent si origine = SYSTEME
  utilisateurNom?: string; // dénormalisé pour affichage direct
  origine: OrigineAction;
  typeEntite: TypeEntiteAuditee;
  entiteId: string;
  champModifie?: string; // clé technique du champ, ex. "digicode" ; absent pour une entrée non-champ
  champLibelle?: string; // libellé humain affiché, ex. "Digicode"
  ancienneValeur?: string;
  nouvelleValeur?: string;
  description: string; // phrase prête à afficher, ex. "a modifié le digicode"
  /** Pertinent uniquement si origine = MOBILE (parcours hors ligne, sections 35/36). */
  statutSynchronisation?: StatutSynchronisation;
  dateSynchronisation?: string; // renseigné une fois la synchro confirmée serveur
}

// ============================================================================
// 10. TYPES DÉRIVÉS (calculés, jamais stockés)
// ============================================================================

/** Score de risque de panne (maintenance prédictive, domain/risk-scoring.ts). */
export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  explication: string;
}

/** Statistiques d'un parc, ventilées par StatutAppareil (remplace le décompte fonctionnel/en_panne/en_reparation). */
export interface StatistiquesParc {
  parcId: string;
  totalAscenseurs: number;
  nombreEnService: number;
  nombreEnPanne: number;
  nombreALArret: number;
  nombreModeDegrade: number;
  nombreArretTravaux: number;
}

/** Réponse API générique. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
