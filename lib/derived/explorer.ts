/**
 * Grammaire d'exploration — le socle du parcours « du général au nucléaire ».
 *
 * Toute l'application partage une seule mécanique de descente : un chiffre
 * agrégé mène à sa décomposition par une *dimension* (parc, client, contrat,
 * technicien, tournée, secteur, ville), cette décomposition mène aux appareils
 * du groupe, et l'appareil mène à sa fiche. Le chemin
 * « tableau de bord → pannes → parcs → appareils » et le chemin
 * « planning → technicien → appareils » sont donc le même code, appelé avec
 * une dimension différente.
 *
 * Les critères de filtrage (statut, retard, mode dégradé…) voyagent dans
 * l'URL et traversent chaque palier : c'est ce qui rend les croisements
 * gratuits (`/explorer/technicien/tech-027?statut=en_panne`) et ce qui permet
 * de retirer un critère sans perdre le reste du parcours.
 *
 * Performance : `getAllAscenseurs()` renvoie ~4 350 lignes et l'agrégation par
 * dimension se fait en une seule passe (O(n)), jamais par un scan répété
 * groupe par groupe (qui coûterait O(n_groupes × n_appareils), soit 2 millions
 * d'itérations pour les 500 parcs). Le résultat est mémoïsé pour la durée de
 * la requête via `cache()` de React.
 */

import { cache as cacheReact } from 'react';
import { Ascenseur, StatutAppareil } from '@/domain/types';

/**
 * Mémoïsation par requête.
 *
 * `cache()` n'est fourni que par le React que Next.js résout côté serveur ; il
 * est absent du React que voit le lanceur de tests. Le repli rend le module
 * importable hors Next sans rien changer en production, où la déduplication
 * par requête reste indispensable : le store est mutable (Server Actions), un
 * cache global servirait des données périmées.
 */
const cache: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof cacheReact === 'function' ? cacheReact : (fn) => fn;
import {
  getAllAscenseurs,
  getAllClients,
  getAllContrats,
  getAllTechniciens,
  getAllTournees,
  getAllSecteursGeographiques,
  getAllParcs,
} from '@/data/store';

// ============================================================================
// Dimensions
// ============================================================================

/** Axe de décomposition d'un ensemble d'appareils. */
export type DimensionSlug = 'parc' | 'client' | 'contrat' | 'technicien' | 'tournee' | 'secteur' | 'ville';

export const DIMENSIONS: DimensionSlug[] = ['parc', 'client', 'contrat', 'technicien', 'tournee', 'secteur', 'ville'];

interface DefinitionDimension {
  slug: DimensionSlug;
  /** Libellé au singulier, tel qu'affiché dans un fil d'Ariane. */
  libelle: string;
  /** Libellé au pluriel, pour les titres de palier. */
  libellePluriel: string;
  /** Clé de regroupement portée par l'appareil ; `undefined` = non rattaché. */
  cle: (a: Ascenseur) => string | undefined;
  /** Intitulé du groupe et, éventuellement, une précision sous le titre. */
  intitule: (id: string) => { libelle: string; sousTitre?: string } | undefined;
}

function indexerParId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

const definitions = cache((): Record<DimensionSlug, DefinitionDimension> => {
  const parcs = indexerParId(getAllParcs());
  const clients = indexerParId(getAllClients());
  const contrats = indexerParId(getAllContrats());
  const techniciens = indexerParId(getAllTechniciens());
  const tournees = indexerParId(getAllTournees());
  const secteurs = indexerParId(getAllSecteursGeographiques());

  return {
    parc: {
      slug: 'parc',
      libelle: 'Site',
      libellePluriel: 'Sites',
      cle: (a) => a.parcId,
      intitule: (id) => {
        const parc = parcs.get(id);
        if (!parc) return undefined;
        const client = clients.get(parc.clientId);
        return { libelle: parc.nom, sousTitre: [parc.ville, client?.raisonSociale].filter(Boolean).join(' · ') };
      },
    },
    client: {
      slug: 'client',
      libelle: 'Client',
      libellePluriel: 'Clients',
      cle: (a) => a.clientId,
      intitule: (id) => {
        const client = clients.get(id);
        return client ? { libelle: client.raisonSociale, sousTitre: client.villeSiege } : undefined;
      },
    },
    contrat: {
      slug: 'contrat',
      libelle: 'Contrat',
      libellePluriel: 'Contrats',
      cle: (a) => a.contratId || undefined,
      intitule: (id) => {
        const contrat = contrats.get(id);
        if (!contrat) return undefined;
        const client = clients.get(contrat.clientId);
        return { libelle: contrat.numero, sousTitre: client?.raisonSociale };
      },
    },
    technicien: {
      slug: 'technicien',
      libelle: 'Technicien',
      libellePluriel: 'Techniciens',
      cle: (a) => a.technicienAffecteId,
      intitule: (id) => {
        const technicien = techniciens.get(id);
        if (!technicien) return undefined;
        return {
          libelle: technicien.nomComplet,
          sousTitre: technicien.actif ? technicien.specialite : 'Inactif',
        };
      },
    },
    tournee: {
      slug: 'tournee',
      libelle: 'Tournée',
      libellePluriel: 'Tournées',
      cle: (a) => a.tourneeId,
      intitule: (id) => {
        const tournee = tournees.get(id);
        if (!tournee) return undefined;
        const secteur = tournee.secteurId ? secteurs.get(tournee.secteurId) : undefined;
        return { libelle: tournee.nom, sousTitre: secteur?.nom };
      },
    },
    secteur: {
      slug: 'secteur',
      libelle: 'Secteur',
      libellePluriel: 'Secteurs',
      cle: (a) => a.secteurId,
      intitule: (id) => {
        const secteur = secteurs.get(id);
        return secteur ? { libelle: secteur.nom } : undefined;
      },
    },
    ville: {
      // La ville n'est pas une entité du modèle : la clé est le nom lui-même.
      slug: 'ville',
      libelle: 'Ville',
      libellePluriel: 'Villes',
      cle: (a) => a.ville,
      intitule: (id) => ({ libelle: id }),
    },
  };
});

export function estDimension(valeur: string): valeur is DimensionSlug {
  return (DIMENSIONS as string[]).includes(valeur);
}

export function definitionDimension(dimension: DimensionSlug): DefinitionDimension {
  return definitions()[dimension];
}

// ============================================================================
// Filtres
// ============================================================================

/**
 * Critères qui traversent les paliers. Ils sont lus depuis l'URL et
 * re-sérialisés tels quels dans chaque lien produit, ce qui conserve le
 * parcours d'un bout à l'autre de la descente.
 */
export interface FiltresExploration {
  statut?: StatutAppareil;
  /** Appareils en panne ou à l'arrêt — la lecture « qui pose problème ». */
  probleme?: boolean;
  modeDegrade?: boolean;
  recherche?: string;
}

const STATUTS_PROBLEME: StatutAppareil[] = [StatutAppareil.EN_PANNE, StatutAppareil.A_L_ARRET];

export function estStatutProbleme(statut: StatutAppareil): boolean {
  return STATUTS_PROBLEME.includes(statut);
}

type ParamsBruts = Record<string, string | string[] | undefined>;

function premier(params: ParamsBruts, cle: string): string | undefined {
  const valeur = params[cle];
  const texte = Array.isArray(valeur) ? valeur[0] : valeur;
  return texte && texte.length > 0 ? texte : undefined;
}

export function lireFiltres(params: ParamsBruts): FiltresExploration {
  const statutBrut = premier(params, 'statut');
  const statut = Object.values(StatutAppareil).find((s) => s === statutBrut);
  return {
    statut,
    probleme: premier(params, 'probleme') === '1',
    modeDegrade: premier(params, 'degrade') === '1',
    recherche: premier(params, 'q'),
  };
}

/** Sérialise les filtres en query string (préfixée par `?`, vide si aucun). */
export function serialiserFiltres(filtres: FiltresExploration): string {
  const params = new URLSearchParams();
  if (filtres.statut) params.set('statut', filtres.statut);
  if (filtres.probleme) params.set('probleme', '1');
  if (filtres.modeDegrade) params.set('degrade', '1');
  if (filtres.recherche) params.set('q', filtres.recherche);
  const texte = params.toString();
  return texte ? `?${texte}` : '';
}

/** Critère actif, affiché dans le fil d'Ariane avec le lien qui le retire. */
export interface CritereActif {
  cle: keyof FiltresExploration;
  libelle: string;
  /** Filtres restants une fois ce critère retiré. */
  sansCeCritere: FiltresExploration;
}

export function listerCriteresActifs(filtres: FiltresExploration, libelleStatut: (s: StatutAppareil) => string): CritereActif[] {
  const criteres: CritereActif[] = [];
  if (filtres.statut) {
    criteres.push({ cle: 'statut', libelle: libelleStatut(filtres.statut), sansCeCritere: { ...filtres, statut: undefined } });
  }
  if (filtres.probleme) {
    criteres.push({ cle: 'probleme', libelle: 'Pose problème', sansCeCritere: { ...filtres, probleme: false } });
  }
  if (filtres.modeDegrade) {
    criteres.push({ cle: 'modeDegrade', libelle: 'Mode dégradé', sansCeCritere: { ...filtres, modeDegrade: false } });
  }
  if (filtres.recherche) {
    criteres.push({ cle: 'recherche', libelle: `« ${filtres.recherche} »`, sansCeCritere: { ...filtres, recherche: undefined } });
  }
  return criteres;
}

function correspond(a: Ascenseur, filtres: FiltresExploration): boolean {
  if (filtres.statut && a.statutAppareil !== filtres.statut) return false;
  if (filtres.probleme && !estStatutProbleme(a.statutAppareil)) return false;
  if (filtres.modeDegrade && a.statutAppareil !== StatutAppareil.MODE_DEGRADE) return false;
  if (filtres.recherche) {
    const terme = filtres.recherche.toLowerCase();
    const cible = `${a.code} ${a.nom ?? ''} ${a.adresseComplete} ${a.ville}`.toLowerCase();
    if (!cible.includes(terme)) return false;
  }
  return true;
}

// ============================================================================
// Agrégation
// ============================================================================

/** Décompte par statut d'un ensemble d'appareils. */
export interface RepartitionStatuts {
  total: number;
  parStatut: Record<StatutAppareil, number>;
  /** En panne + à l'arrêt. */
  problemes: number;
  /** Part d'appareils en service, arrondie à l'entier. */
  disponibilitePourcent: number;
}

function repartitionVide(): Record<StatutAppareil, number> {
  return {
    [StatutAppareil.EN_SERVICE]: 0,
    [StatutAppareil.EN_PANNE]: 0,
    [StatutAppareil.A_L_ARRET]: 0,
    [StatutAppareil.MODE_DEGRADE]: 0,
    [StatutAppareil.ARRET_TRAVAUX]: 0,
  };
}

export function calculerRepartition(appareils: Ascenseur[]): RepartitionStatuts {
  const parStatut = repartitionVide();
  for (const a of appareils) parStatut[a.statutAppareil]++;
  const total = appareils.length;
  const problemes = parStatut[StatutAppareil.EN_PANNE] + parStatut[StatutAppareil.A_L_ARRET];
  return {
    total,
    parStatut,
    problemes,
    disponibilitePourcent: total === 0 ? 0 : Math.round((parStatut[StatutAppareil.EN_SERVICE] / total) * 100),
  };
}

/** Un groupe du palier de décomposition (un site, un technicien, une ville…). */
export interface GroupeExploration {
  id: string;
  libelle: string;
  sousTitre?: string;
  /** Répartition des appareils retenus par les filtres. */
  repartition: RepartitionStatuts;
  /** Répartition de tous les appareils du groupe, filtres ignorés. */
  repartitionTotale: RepartitionStatuts;
}

/**
 * Décompose l'ensemble du parc selon une dimension.
 *
 * Les groupes sont triés par gravité décroissante (problèmes, puis taille) :
 * sur 143 sites touchés par une panne, l'ordre alphabétique n'aiderait
 * personne — ce qui compte est de voir d'abord où ça fait mal.
 */
export const listerGroupes = cache((dimension: DimensionSlug, filtres: FiltresExploration): GroupeExploration[] => {
  const definition = definitionDimension(dimension);
  const retenus = new Map<string, Ascenseur[]>();
  const totaux = new Map<string, Ascenseur[]>();

  for (const appareil of getAllAscenseurs()) {
    const cle = definition.cle(appareil);
    if (!cle) continue;
    const tous = totaux.get(cle);
    if (tous) tous.push(appareil);
    else totaux.set(cle, [appareil]);

    if (!correspond(appareil, filtres)) continue;
    const liste = retenus.get(cle);
    if (liste) liste.push(appareil);
    else retenus.set(cle, [appareil]);
  }

  const groupes: GroupeExploration[] = [];
  for (const [cle, appareils] of retenus) {
    const intitule = definition.intitule(cle);
    if (!intitule) continue;
    groupes.push({
      id: cle,
      libelle: intitule.libelle,
      sousTitre: intitule.sousTitre,
      repartition: calculerRepartition(appareils),
      repartitionTotale: calculerRepartition(totaux.get(cle) ?? appareils),
    });
  }

  groupes.sort((a, b) => {
    if (b.repartition.problemes !== a.repartition.problemes) return b.repartition.problemes - a.repartition.problemes;
    if (b.repartition.total !== a.repartition.total) return b.repartition.total - a.repartition.total;
    return a.libelle.localeCompare(b.libelle, 'fr');
  });
  return groupes;
});

/** Appareils d'un groupe donné, filtres appliqués. */
export const listerAppareilsDuGroupe = cache(
  (dimension: DimensionSlug, valeur: string, filtres: FiltresExploration): Ascenseur[] => {
    const definition = definitionDimension(dimension);
    return getAllAscenseurs()
      .filter((a) => definition.cle(a) === valeur && correspond(a, filtres))
      .sort((a, b) => a.code.localeCompare(b.code, 'fr'));
  },
);

/** Tous les appareils d'un groupe, filtres ignorés — sert aux compteurs de contexte. */
export const listerTousAppareilsDuGroupe = cache((dimension: DimensionSlug, valeur: string): Ascenseur[] => {
  const definition = definitionDimension(dimension);
  return getAllAscenseurs().filter((a) => definition.cle(a) === valeur);
});

// ============================================================================
// Construction des liens
// ============================================================================

/** Palier 1 — décomposition du parc selon une dimension. */
export function lienDimension(dimension: DimensionSlug, filtres: FiltresExploration = {}): string {
  return `/explorer/${dimension}${serialiserFiltres(filtres)}`;
}

/** Palier 2 — appareils d'un groupe. */
export function lienGroupe(dimension: DimensionSlug, valeur: string, filtres: FiltresExploration = {}): string {
  return `/explorer/${dimension}/${encodeURIComponent(valeur)}${serialiserFiltres(filtres)}`;
}

/** Palier 3 — fiche appareil. */
export function lienAppareil(ascenseurId: string): string {
  return `/appareils/${ascenseurId}`;
}
