/**
 * Conformité contractuelle — « 11 maintenances au lieu de 12 ».
 *
 * LE PROBLÈME MÉTIER
 * ------------------
 * Le grief numéro un du client contre son logiciel actuel : celui-ci ne
 * garde que la date de la dernière maintenance et calcule la suivante en
 * ajoutant un délai fixe. Un technicien qui prend deux mois de retard décale
 * d'autant toutes les visites suivantes, et « à la fin de l'année, tu n'as
 * pas tes 12 maintenances mais 11, parce qu'il y a eu un décalage de
 * quelques jours à chaque fois ». Le déficit se paie en pénalités et dégrade
 * les statistiques transmises au client.
 *
 * Le modèle, lui, est déjà correct : `Maintenance.datePrevue` est issue du
 * calendrier contractuel et n'est JAMAIS recalculée depuis une réalisation
 * précédente (voir domain/types.ts, règle capitale section 6.3). Ce qui
 * manquait n'était donc pas le moteur mais la MESURE : personne ne pouvait
 * voir qu'un appareil n'aurait que 11 visites sur les 12 dues. C'est l'objet
 * de ce module.
 *
 * LES QUATRE CHIFFRES
 * -------------------
 * Pour une année, un appareil et une catégorie d'opération :
 *   - DUES                  : le quota annuel engagé par le contrat ;
 *   - RÉALISÉES             : occurrences au statut REALISEE ;
 *   - PLANIFIÉES RESTANTES  : occurrences encore ouvertes (PLANIFIEE ou
 *                             EN_COURS_DE_REALISATION) inscrites dans
 *                             l'année — en retard ou non : tant que l'année
 *                             n'est pas close, elles peuvent être honorées ;
 *   - DÉFICIT PRÉVISIBLE    : dues − (réalisées + planifiées restantes),
 *                             borné à zéro.
 *
 * Un déficit > 0 signifie que, même en exécutant tout ce qui reste au
 * calendrier, le quota annuel ne sera pas atteint. C'est exactement le
 * « 11 au lieu de 12 », détecté en cours d'année plutôt qu'en janvier suivant.
 *
 * Le déficit se décompose en deux causes, qui n'appellent pas la même
 * réaction :
 *   - DÉFICIT CALENDRIER : dues − occurrences inscrites au calendrier. Des
 *     dates n'ont jamais été posées. C'est un défaut de planification
 *     annuelle — celui que le client décrit.
 *   - DÉFICIT EXÉCUTION  : occurrences inscrites puis annulées sans être
 *     replanifiées.
 *
 * HYPOTHÈSE DE CALCUL DU « DÛ » — À LIRE
 * -------------------------------------
 * Le quota annuel devrait être une donnée contractuelle explicite, catégorie
 * par catégorie. Le modèle `Contrat` n'en porte qu'une partie :
 *
 *   - PÉRIODIQUE : cadence typée et fiable — `Contrat.frequenceMaintenance`.
 *     Le quota est lu dans VISITES_PERIODIQUES_PAR_AN (mensuelle = 12,
 *     bimestrielle = 6, trimestrielle = 4, semestrielle = 2, annuelle = 1).
 *     C'est le quota à enjeu, celui qui porte les pénalités et la statistique
 *     transmise au client.
 *
 *   - CÂBLE et PARACHUTE : le contrat ne porte qu'un booléen d'inclusion
 *     (`maintenanceCableIncluse`, `maintenanceParachuteIncluse`), sans
 *     cadence. La cadence retenue est celle énoncée par le client en
 *     réunion : câble 2 fois par an, parachute 1 fois par an (constantes
 *     QUOTA_ANNUEL_CABLE / QUOTA_ANNUEL_PARACHUTE). Heuristique ASSUMÉE : le
 *     jour où `Contrat` portera une cadence par catégorie, ces deux
 *     constantes seront remplacées par une lecture du contrat, et rien
 *     d'autre ne bougera.
 *
 *   - NETTOYAGE et AUTRE : ni cadence typée dans le modèle, ni règle métier
 *     énoncée. Inventer un quota produirait un déficit arbitraire, ce qui
 *     serait pire que pas de mesure du tout. Le quota retenu est donc le
 *     calendrier lui-même : le nombre d'occurrences inscrites dans l'année
 *     pour cet appareil. Conséquence assumée et lisible à l'écran : sur ces
 *     deux catégories, seules les annulations non replanifiées ressortent en
 *     déficit, jamais un défaut de planification.
 *
 *   - Appareil sans contrat résolu : aucun engagement connu, donc même
 *     traitement que NETTOYAGE — le calendrier fait foi, déficit calendrier
 *     nul par construction.
 *
 * RÈGLE D'AGRÉGATION
 * ------------------
 * Le déficit est borné à zéro au niveau le plus fin (un appareil, une
 * catégorie) AVANT toute somme. Un appareil visité 13 fois au lieu de 12 ne
 * compense donc pas le voisin visité 11 fois : les pénalités s'appliquent
 * appareil par appareil, pas sur une moyenne de contrat.
 *
 * PERFORMANCE
 * -----------
 * ~31 700 maintenances et ~4 350 appareils. Les occurrences sont regroupées
 * par appareil et par catégorie en UNE seule passe O(n) — jamais un scan des
 * maintenances par appareil, qui coûterait 138 millions d'itérations. Tous
 * les points d'entrée sont mémoïsés pour la durée de la requête via `cache()`
 * de React (même motif que lib/derived/parc-liste.ts).
 */

import { cache } from 'react';
import {
  Ascenseur,
  CategorieMaintenance,
  Contrat,
  FrequenceMaintenance,
  Maintenance,
  StatutAppareil,
  StatutContrat,
  StatutMaintenance,
} from '@/domain/types';
import { getAllAscenseurs, getAllClients, getAllContrats, getAllMaintenances } from '@/data/store';

// ============================================================================
// Quotas contractuels
// ============================================================================

/** Ordre d'affichage stable des catégories, de la plus engageante à la plus accessoire. */
export const CATEGORIES_CONFORMITE: readonly CategorieMaintenance[] = [
  CategorieMaintenance.PERIODIQUE,
  CategorieMaintenance.CABLE,
  CategorieMaintenance.PARACHUTE,
  CategorieMaintenance.NETTOYAGE,
  CategorieMaintenance.AUTRE,
];

/** Traduction de la cadence contractuelle en nombre de visites périodiques dues sur une année pleine. */
export const VISITES_PERIODIQUES_PAR_AN: Record<FrequenceMaintenance, number> = {
  [FrequenceMaintenance.MENSUELLE]: 12,
  [FrequenceMaintenance.BIMESTRIELLE]: 6,
  [FrequenceMaintenance.TRIMESTRIELLE]: 4,
  [FrequenceMaintenance.SEMESTRIELLE]: 2,
  [FrequenceMaintenance.ANNUELLE]: 1,
};

/** Règle métier Manei-Lift : le câble se contrôle deux fois par an quand il est au contrat. */
export const QUOTA_ANNUEL_CABLE = 2;

/** Règle métier Manei-Lift : le parachute se teste une fois par an quand il est au contrat. */
export const QUOTA_ANNUEL_PARACHUTE = 1;

/**
 * Quota annuel dû pour une catégorie donnée.
 *
 * `inscritesAuCalendrier` ne sert que de repli pour les catégories sans
 * engagement exprimable (nettoyage, autre, appareil sans contrat) : voir
 * l'hypothèse de calcul en tête de fichier.
 */
export function quotaAnnuelDu(
  contrat: Contrat | undefined,
  categorie: CategorieMaintenance,
  inscritesAuCalendrier: number,
): number {
  if (!contrat) return inscritesAuCalendrier;
  switch (categorie) {
    case CategorieMaintenance.PERIODIQUE:
      return VISITES_PERIODIQUES_PAR_AN[contrat.frequenceMaintenance];
    case CategorieMaintenance.CABLE:
      return contrat.maintenanceCableIncluse ? QUOTA_ANNUEL_CABLE : 0;
    case CategorieMaintenance.PARACHUTE:
      return contrat.maintenanceParachuteIncluse ? QUOTA_ANNUEL_PARACHUTE : 0;
    default:
      return inscritesAuCalendrier;
  }
}

// ============================================================================
// Compteurs
// ============================================================================

/** Occurrences constatées au calendrier, avant confrontation au quota. */
export interface OccurrencesConstatees {
  realisees: number;
  /** Ouvertes (PLANIFIEE ou EN_COURS_DE_REALISATION), en retard ou non. */
  planifieesRestantes: number;
  /** Sous-ensemble des planifiées restantes dont la date prévue est dépassée. */
  enRetard: number;
  annulees: number;
}

/** Le bilan complet d'une maille (un appareil, un contrat, un client…) pour une catégorie ou toutes. */
export interface Compteurs extends OccurrencesConstatees {
  /** Quota annuel engagé. */
  dues: number;
  /** Dates effectivement posées au calendrier annuel : réalisées + restantes + annulées. */
  inscritesAuCalendrier: number;
  /** dues − (réalisées + planifiées restantes), borné à zéro. */
  deficit: number;
  /** Part du déficit due à des dates jamais inscrites au calendrier. */
  deficitCalendrier: number;
  /** Part du déficit due à des occurrences inscrites puis annulées. */
  deficitExecution: number;
}

export interface CompteursCategorie extends Compteurs {
  categorie: CategorieMaintenance;
}

function occurrencesVides(): OccurrencesConstatees {
  return { realisees: 0, planifieesRestantes: 0, enRetard: 0, annulees: 0 };
}

export function compteursVides(): Compteurs {
  return {
    ...occurrencesVides(),
    dues: 0,
    inscritesAuCalendrier: 0,
    deficit: 0,
    deficitCalendrier: 0,
    deficitExecution: 0,
  };
}

type OccurrencesParCategorie = Record<CategorieMaintenance, OccurrencesConstatees>;

function occurrencesParCategorieVides(): OccurrencesParCategorie {
  return {
    [CategorieMaintenance.PERIODIQUE]: occurrencesVides(),
    [CategorieMaintenance.CABLE]: occurrencesVides(),
    [CategorieMaintenance.PARACHUTE]: occurrencesVides(),
    [CategorieMaintenance.NETTOYAGE]: occurrencesVides(),
    [CategorieMaintenance.AUTRE]: occurrencesVides(),
  };
}

/** Une maintenance porte plusieurs catégories quand le passage est combiné : elle compte pour chacune. */
function accumulerMaintenance(cible: OccurrencesParCategorie, maintenance: Maintenance, maintenantMs: number): void {
  const enRetard = new Date(maintenance.datePrevue).getTime() < maintenantMs;
  for (const categorie of maintenance.categories) {
    const compteur = cible[categorie];
    if (!compteur) continue; // catégorie hors modèle : ignorée plutôt que de fausser un total
    switch (maintenance.statut) {
      case StatutMaintenance.REALISEE:
        compteur.realisees += 1;
        break;
      case StatutMaintenance.PLANIFIEE:
      case StatutMaintenance.EN_COURS_DE_REALISATION:
        compteur.planifieesRestantes += 1;
        if (enRetard) compteur.enRetard += 1;
        break;
      case StatutMaintenance.ANNULEE:
        compteur.annulees += 1;
        break;
    }
  }
}

/** Une occurrence appartient à l'année de sa date PRÉVUE : le calendrier contractuel fait foi, pas la réalisation. */
export function appartientALAnnee(maintenance: Maintenance, annee: number): boolean {
  return maintenance.datePrevue.startsWith(String(annee));
}

/** Confronte les occurrences constatées au quota et produit le bilan, déficit borné à zéro. */
export function construireCompteurs(dues: number, occurrences: OccurrencesConstatees): Compteurs {
  const inscritesAuCalendrier = occurrences.realisees + occurrences.planifieesRestantes + occurrences.annulees;
  const deficit = Math.max(0, dues - (occurrences.realisees + occurrences.planifieesRestantes));
  const deficitCalendrier = Math.max(0, dues - inscritesAuCalendrier);
  return {
    ...occurrences,
    dues,
    inscritesAuCalendrier,
    deficit,
    deficitCalendrier,
    deficitExecution: deficit - deficitCalendrier,
  };
}

/**
 * Somme deux bilans. Les champs `deficit*` sont déjà bornés à zéro à la
 * maille appareil × catégorie : les additionner préserve la règle « un
 * excédent ne compense pas un déficit voisin ».
 */
export function additionnerCompteurs(cible: Compteurs, ajout: Compteurs): void {
  cible.dues += ajout.dues;
  cible.realisees += ajout.realisees;
  cible.planifieesRestantes += ajout.planifieesRestantes;
  cible.enRetard += ajout.enRetard;
  cible.annulees += ajout.annulees;
  cible.inscritesAuCalendrier += ajout.inscritesAuCalendrier;
  cible.deficit += ajout.deficit;
  cible.deficitCalendrier += ajout.deficitCalendrier;
  cible.deficitExecution += ajout.deficitExecution;
}

/** Part du quota qui sera tenue, en pourcentage entier. 100 % quand rien n'est dû. */
export function tauxConformitePourcent(compteurs: Compteurs): number {
  if (compteurs.dues <= 0) return 100;
  return Math.round(((compteurs.dues - compteurs.deficit) / compteurs.dues) * 100);
}

/** Une catégorie n'est affichée que si elle est engagée ou présente au calendrier. */
export function categorieConcernee(compteurs: CompteursCategorie): boolean {
  return compteurs.dues > 0 || compteurs.inscritesAuCalendrier > 0;
}

// ============================================================================
// Maille appareil
// ============================================================================

export interface ConformiteAppareil {
  ascenseurId: string;
  code: string;
  adresse: string;
  ville: string;
  statutAppareil: StatutAppareil;
  clientId: string;
  contratId: string;
  parcId: string;
  annee: number;
  /** Uniquement les catégories concernées, dans l'ordre de CATEGORIES_CONFORMITE. */
  parCategorie: CompteursCategorie[];
  total: Compteurs;
  tauxConformitePourcent: number;
}

function assemblerAppareil(
  ascenseur: Ascenseur,
  contrat: Contrat | undefined,
  occurrences: OccurrencesParCategorie,
  annee: number,
): ConformiteAppareil {
  const parCategorie: CompteursCategorie[] = [];
  const total = compteursVides();

  for (const categorie of CATEGORIES_CONFORMITE) {
    const brut = occurrences[categorie];
    const inscrites = brut.realisees + brut.planifieesRestantes + brut.annulees;
    const compteurs: CompteursCategorie = {
      categorie,
      ...construireCompteurs(quotaAnnuelDu(contrat, categorie, inscrites), brut),
    };
    additionnerCompteurs(total, compteurs);
    if (categorieConcernee(compteurs)) parCategorie.push(compteurs);
  }

  return {
    ascenseurId: ascenseur.id,
    code: ascenseur.code,
    adresse: ascenseur.adresseComplete,
    ville: ascenseur.ville,
    statutAppareil: ascenseur.statutAppareil,
    clientId: ascenseur.clientId,
    contratId: ascenseur.contratId,
    parcId: ascenseur.parcId,
    annee,
    parCategorie,
    total,
    tauxConformitePourcent: tauxConformitePourcent(total),
  };
}

/**
 * Bilan d'un appareil à partir de SES maintenances — point d'entrée pur,
 * sans accès au store : c'est cette fonction que vérifient les tests
 * unitaires et que réutilise le calcul global ci-dessous.
 */
export function calculerConformiteAppareil(
  ascenseur: Ascenseur,
  contrat: Contrat | undefined,
  maintenances: Maintenance[],
  annee: number,
  maintenant: Date = new Date(),
): ConformiteAppareil {
  const occurrences = occurrencesParCategorieVides();
  const maintenantMs = maintenant.getTime();
  for (const maintenance of maintenances) {
    if (!appartientALAnnee(maintenance, annee)) continue;
    accumulerMaintenance(occurrences, maintenance, maintenantMs);
  }
  return assemblerAppareil(ascenseur, contrat, occurrences, annee);
}

/** Année de référence par défaut : l'année civile en cours, celle du calendrier contractuel courant. */
export function anneeConformiteCourante(): number {
  return new Date().getUTCFullYear();
}

/**
 * Bilan de TOUS les appareils du parc pour une année — la passe unique.
 * Ordre stable par code d'appareil.
 */
export const getConformiteAppareils = cache((annee: number): ConformiteAppareil[] => {
  const contratsParId = new Map(getAllContrats().map((c) => [c.id, c]));
  const maintenantMs = Date.now();

  // Passe unique sur les ~31 700 maintenances.
  const occurrencesParAppareil = new Map<string, OccurrencesParCategorie>();
  for (const maintenance of getAllMaintenances()) {
    if (!appartientALAnnee(maintenance, annee)) continue;
    let occurrences = occurrencesParAppareil.get(maintenance.ascenseurId);
    if (!occurrences) {
      occurrences = occurrencesParCategorieVides();
      occurrencesParAppareil.set(maintenance.ascenseurId, occurrences);
    }
    accumulerMaintenance(occurrences, maintenance, maintenantMs);
  }

  // Un appareil sans aucune occurrence reste dans le bilan : c'est le cas le
  // plus grave (aucune date posée), il ne doit surtout pas disparaître.
  return getAllAscenseurs()
    .map((ascenseur) =>
      assemblerAppareil(
        ascenseur,
        contratsParId.get(ascenseur.contratId),
        occurrencesParAppareil.get(ascenseur.id) ?? occurrencesParCategorieVides(),
        annee,
      ),
    )
    .sort((a, b) => a.code.localeCompare(b.code, 'fr'));
});

// ============================================================================
// Maille contrat — le niveau où se calculent les pénalités
// ============================================================================

export interface ConformiteContrat {
  contratId: string;
  numero: string;
  clientId: string;
  clientNom: string;
  statutContrat: StatutContrat;
  frequenceMaintenance: FrequenceMaintenance;
  nombreAppareils: number;
  nombreAppareilsEnDeficit: number;
  parCategorie: CompteursCategorie[];
  total: Compteurs;
  tauxConformitePourcent: number;
}

function agregerParCategorie(appareils: ConformiteAppareil[]): CompteursCategorie[] {
  const parCategorie = new Map<CategorieMaintenance, CompteursCategorie>(
    CATEGORIES_CONFORMITE.map((categorie) => [categorie, { categorie, ...compteursVides() }]),
  );
  for (const appareil of appareils) {
    for (const compteurs of appareil.parCategorie) {
      additionnerCompteurs(parCategorie.get(compteurs.categorie)!, compteurs);
    }
  }
  return CATEGORIES_CONFORMITE.map((categorie) => parCategorie.get(categorie)!).filter(categorieConcernee);
}

function agregerTotal(appareils: ConformiteAppareil[]): Compteurs {
  const total = compteursVides();
  for (const appareil of appareils) additionnerCompteurs(total, appareil.total);
  return total;
}

/** Regroupe les bilans d'appareils par contrat. Clé = contratId. */
const grouperAppareilsParContrat = cache((annee: number): Map<string, ConformiteAppareil[]> => {
  const groupes = new Map<string, ConformiteAppareil[]>();
  for (const appareil of getConformiteAppareils(annee)) {
    const groupe = groupes.get(appareil.contratId);
    if (groupe) groupe.push(appareil);
    else groupes.set(appareil.contratId, [appareil]);
  }
  return groupes;
});

/**
 * Bilan par contrat, trié par déficit décroissant puis par taux de
 * conformité croissant : ce qui coûte le plus cher en pénalités arrive en
 * tête, et à déficit égal le contrat le plus dégradé passe devant.
 */
export const getConformiteParContrat = cache((annee: number): ConformiteContrat[] => {
  const contratsParId = new Map(getAllContrats().map((c) => [c.id, c]));
  const clientsParId = new Map(getAllClients().map((c) => [c.id, c]));

  const lignes: ConformiteContrat[] = [];
  for (const [contratId, appareils] of grouperAppareilsParContrat(annee)) {
    const contrat = contratsParId.get(contratId);
    const clientId = contrat?.clientId ?? appareils[0].clientId;
    const total = agregerTotal(appareils);
    lignes.push({
      contratId,
      numero: contrat?.numero ?? 'Contrat inconnu',
      clientId,
      clientNom: clientsParId.get(clientId)?.raisonSociale ?? 'Client inconnu',
      statutContrat: contrat?.statut ?? StatutContrat.EXPIRE,
      frequenceMaintenance: contrat?.frequenceMaintenance ?? FrequenceMaintenance.TRIMESTRIELLE,
      nombreAppareils: appareils.length,
      nombreAppareilsEnDeficit: appareils.filter((a) => a.total.deficit > 0).length,
      parCategorie: agregerParCategorie(appareils),
      total,
      tauxConformitePourcent: tauxConformitePourcent(total),
    });
  }

  return lignes.sort(
    (a, b) =>
      b.total.deficit - a.total.deficit ||
      a.tauxConformitePourcent - b.tauxConformitePourcent ||
      a.numero.localeCompare(b.numero, 'fr'),
  );
});

export interface DetailConformiteContrat extends ConformiteContrat {
  contrat?: Contrat;
  /** Appareils du contrat, les plus déficitaires d'abord. */
  appareils: ConformiteAppareil[];
}

/** Bilan détaillé d'un contrat, appareil par appareil. `undefined` si le contrat ne porte aucun appareil. */
export const getConformiteDetailContrat = cache(
  (contratId: string, annee: number): DetailConformiteContrat | undefined => {
    const ligne = getConformiteParContrat(annee).find((l) => l.contratId === contratId);
    if (!ligne) return undefined;
    const appareils = [...(grouperAppareilsParContrat(annee).get(contratId) ?? [])].sort(
      (a, b) =>
        b.total.deficit - a.total.deficit ||
        a.tauxConformitePourcent - b.tauxConformitePourcent ||
        a.code.localeCompare(b.code, 'fr'),
    );
    return { ...ligne, contrat: getAllContrats().find((c) => c.id === contratId), appareils };
  },
);

// ============================================================================
// Maille client — l'autre niveau où se paient les pénalités
// ============================================================================

export interface ConformiteClient {
  clientId: string;
  clientNom: string;
  nombreContrats: number;
  nombreContratsEnDeficit: number;
  nombreAppareils: number;
  nombreAppareilsEnDeficit: number;
  parCategorie: CompteursCategorie[];
  total: Compteurs;
  tauxConformitePourcent: number;
}

/** Bilan par client, même tri que les contrats. */
export const getConformiteParClient = cache((annee: number): ConformiteClient[] => {
  const clientsParId = new Map(getAllClients().map((c) => [c.id, c]));
  const contratsParClient = new Map<string, { tous: Set<string>; deficitaires: Set<string> }>();

  for (const ligne of getConformiteParContrat(annee)) {
    let compteur = contratsParClient.get(ligne.clientId);
    if (!compteur) {
      compteur = { tous: new Set(), deficitaires: new Set() };
      contratsParClient.set(ligne.clientId, compteur);
    }
    compteur.tous.add(ligne.contratId);
    if (ligne.total.deficit > 0) compteur.deficitaires.add(ligne.contratId);
  }

  const groupes = new Map<string, ConformiteAppareil[]>();
  for (const appareil of getConformiteAppareils(annee)) {
    const groupe = groupes.get(appareil.clientId);
    if (groupe) groupe.push(appareil);
    else groupes.set(appareil.clientId, [appareil]);
  }

  const lignes: ConformiteClient[] = [];
  for (const [clientId, appareils] of groupes) {
    const total = agregerTotal(appareils);
    lignes.push({
      clientId,
      clientNom: clientsParId.get(clientId)?.raisonSociale ?? 'Client inconnu',
      nombreContrats: contratsParClient.get(clientId)?.tous.size ?? 0,
      nombreContratsEnDeficit: contratsParClient.get(clientId)?.deficitaires.size ?? 0,
      nombreAppareils: appareils.length,
      nombreAppareilsEnDeficit: appareils.filter((a) => a.total.deficit > 0).length,
      parCategorie: agregerParCategorie(appareils),
      total,
      tauxConformitePourcent: tauxConformitePourcent(total),
    });
  }

  return lignes.sort(
    (a, b) =>
      b.total.deficit - a.total.deficit ||
      a.tauxConformitePourcent - b.tauxConformitePourcent ||
      a.clientNom.localeCompare(b.clientNom, 'fr'),
  );
});

// ============================================================================
// Synthèse parc
// ============================================================================

export interface SyntheseConformite {
  annee: number;
  nombreContrats: number;
  nombreContratsEnDeficit: number;
  nombreClients: number;
  nombreClientsEnDeficit: number;
  nombreAppareils: number;
  nombreAppareilsEnDeficit: number;
  parCategorie: CompteursCategorie[];
  total: Compteurs;
  tauxConformitePourcent: number;
}

/** Les chiffres de tête de l'écran : le déficit du parc entier pour l'année. */
export const getSyntheseConformite = cache((annee: number): SyntheseConformite => {
  const appareils = getConformiteAppareils(annee);
  const contrats = getConformiteParContrat(annee);
  const clients = getConformiteParClient(annee);
  const total = agregerTotal(appareils);

  return {
    annee,
    nombreContrats: contrats.length,
    nombreContratsEnDeficit: contrats.filter((c) => c.total.deficit > 0).length,
    nombreClients: clients.length,
    nombreClientsEnDeficit: clients.filter((c) => c.total.deficit > 0).length,
    nombreAppareils: appareils.length,
    nombreAppareilsEnDeficit: appareils.filter((a) => a.total.deficit > 0).length,
    parCategorie: agregerParCategorie(appareils),
    total,
    tauxConformitePourcent: tauxConformitePourcent(total),
  };
});

// ============================================================================
// Paramètres d'URL et liens
// ============================================================================

/** Lit `?annee=` en retombant sur l'année courante si le paramètre est absent ou illisible. */
export function lireAnnee(valeur: string | string[] | undefined): number {
  const texte = Array.isArray(valeur) ? valeur[0] : valeur;
  const annee = Number(texte);
  if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) return anneeConformiteCourante();
  return annee;
}

/** Destination du détail de conformité d'un contrat. */
export function lienConformiteContrat(contratId: string, annee?: number): string {
  const suffixe = annee !== undefined && annee !== anneeConformiteCourante() ? `?annee=${annee}` : '';
  return `/conformite/${encodeURIComponent(contratId)}${suffixe}`;
}
