/**
 * Jointures et filtrage pour la liste des appareils (section 4.1).
 *
 * getAllAscenseurs() renvoie ~4 350 lignes : les jointures individuelles
 * (getMaintenancesByAscenseurId/getInterventionsByAscenseurId) sont
 * utilisées telles quelles sur la fiche appareil (un seul id), mais ici,
 * pour filtrer/trier sur l'ensemble du parc, on regroupe une seule fois les
 * ~31 000 maintenances et ~4 000 interventions par ascenseurId (une passe)
 * plutôt que de refaire un scan complet par appareil (qui coûterait
 * O(n_appareils × n_maintenances)). Le résultat est mis en cache pour la
 * durée d'une requête via `cache()` de React.
 */

import { cache } from 'react';
import {
  Ascenseur,
  Client,
  Contrat,
  Technicien,
  Tournee,
  SecteurGeographique,
  Maintenance,
  Intervention,
  StatutAppareil,
  CategorieMaintenance,
  LigneListeAppareil,
} from '@/domain/types';
import {
  getAllAscenseurs,
  getAllClients,
  getAllContrats,
  getAllTechniciens,
  getAllTournees,
  getAllSecteursGeographiques,
  getAllMaintenances,
  getAllInterventions,
} from '@/data/store';
import { calculerDisponibilitePourcent } from '@/lib/derived/disponibilite';
import { estMaintenanceEnRetard, trouverDerniereMaintenanceRealisee, trouverProchaineMaintenancePlanifiee } from '@/lib/derived/maintenances-appareil';
import { libellesEtagesConcernes } from '@/lib/derived/mode-degrade';

/** Ligne enrichie de la liste des appareils : LigneListeAppareil + les identifiants nécessaires au filtrage. */
export interface LigneAppareilListe extends LigneListeAppareil {
  clientId: string;
  contratId: string;
  technicienId?: string;
  tourneeId?: string;
  secteurId?: string;
  categoriesMaintenance: CategorieMaintenance[];
  etagesModeDegrade?: string;
  /** Champ de recherche pré-normalisé (code, adresse, ville, référence, numéro téléalarme). */
  referenceRecherche: string;
}

/** Filtres de la liste des appareils — un choix par filtre (l'UI reste volontairement simple). */
export interface FiltresAppareilsUI {
  statut?: StatutAppareil;
  clientId?: string;
  contratId?: string;
  technicienId?: string;
  tourneeId?: string;
  ville?: string;
  secteurId?: string;
  typeMaintenance?: CategorieMaintenance;
  enRetard?: boolean;
  modeDegrade?: boolean;
  recherche?: string;
}

interface JointuresAppareil {
  maintenances: Maintenance[];
  interventions: Intervention[];
}

/** Regroupe en une seule passe les maintenances/interventions par ascenseurId. */
const construireIndexJointures = cache((): Map<string, JointuresAppareil> => {
  const index = new Map<string, JointuresAppareil>();
  const entree = (ascenseurId: string): JointuresAppareil => {
    let e = index.get(ascenseurId);
    if (!e) {
      e = { maintenances: [], interventions: [] };
      index.set(ascenseurId, e);
    }
    return e;
  };
  for (const maintenance of getAllMaintenances()) entree(maintenance.ascenseurId).maintenances.push(maintenance);
  for (const intervention of getAllInterventions()) entree(intervention.ascenseurId).interventions.push(intervention);
  return index;
});

interface IndexReferentiels {
  clientsParId: Map<string, Client>;
  contratsParId: Map<string, Contrat>;
  techniciensParId: Map<string, Technicien>;
  tourneesParId: Map<string, Tournee>;
}

const construireIndexReferentiels = cache((): IndexReferentiels => ({
  clientsParId: new Map(getAllClients().map((c) => [c.id, c])),
  contratsParId: new Map(getAllContrats().map((c) => [c.id, c])),
  techniciensParId: new Map(getAllTechniciens().map((t) => [t.id, t])),
  tourneesParId: new Map(getAllTournees().map((t) => [t.id, t])),
}));

function construireLigne(ascenseur: Ascenseur, refs: IndexReferentiels, jointures: Map<string, JointuresAppareil>, maintenant: Date): LigneAppareilListe {
  const client = refs.clientsParId.get(ascenseur.clientId);
  const contrat = refs.contratsParId.get(ascenseur.contratId);
  const technicien = ascenseur.technicienAffecteId ? refs.techniciensParId.get(ascenseur.technicienAffecteId) : undefined;
  const tournee = ascenseur.tourneeId ? refs.tourneesParId.get(ascenseur.tourneeId) : undefined;
  const { maintenances, interventions } = jointures.get(ascenseur.id) ?? { maintenances: [], interventions: [] };

  const derniereRealisee = trouverDerniereMaintenanceRealisee(maintenances);
  const prochainePlanifiee = trouverProchaineMaintenancePlanifiee(maintenances, maintenant);
  const derniereIntervention = [...interventions].sort(
    (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  )[0];
  const enRetardMaintenance = maintenances.some((m) => estMaintenanceEnRetard(m, maintenant));
  const categoriesMaintenance = Array.from(new Set(maintenances.flatMap((m) => m.categories)));

  const referenceRecherche = [
    ascenseur.code,
    ascenseur.adresseComplete,
    ascenseur.ville,
    ascenseur.ficheTechnique.referenceConstructeur,
    ascenseur.ficheTechnique.numeroSerie,
    ascenseur.ficheTechnique.telealarme.numeroCarteLigne,
  ]
    .filter((v): v is string => Boolean(v))
    .join(' ')
    .toLowerCase();

  return {
    id: ascenseur.id,
    code: ascenseur.code,
    adresse: ascenseur.adresseComplete,
    ville: ascenseur.ville,
    clientNom: client?.raisonSociale ?? '—',
    contratNumero: contrat?.numero ?? '—',
    technicienNom: technicien?.nomComplet,
    tourneeNom: tournee?.nom,
    statut: ascenseur.statutAppareil,
    derniereMaintenance: derniereRealisee?.dateRealisee,
    prochaineMaintenance: prochainePlanifiee?.datePrevue,
    derniereIntervention: derniereIntervention?.dateCreation,
    disponibilitePourcent: calculerDisponibilitePourcent(ascenseur, interventions, maintenant),
    enRetardMaintenance,
    enModeDegrade: ascenseur.statutAppareil === StatutAppareil.MODE_DEGRADE,
    clientId: ascenseur.clientId,
    contratId: ascenseur.contratId,
    technicienId: ascenseur.technicienAffecteId,
    tourneeId: ascenseur.tourneeId,
    secteurId: ascenseur.secteurId,
    categoriesMaintenance,
    etagesModeDegrade: ascenseur.statutAppareil === StatutAppareil.MODE_DEGRADE ? libellesEtagesConcernes(ascenseur) : undefined,
    referenceRecherche,
  };
}

/** Toutes les lignes de la liste des appareils, triées par code. Mis en cache pour la durée de la requête. */
export const getLignesAppareils = cache((): LigneAppareilListe[] => {
  const refs = construireIndexReferentiels();
  const jointures = construireIndexJointures();
  const maintenant = new Date();
  return getAllAscenseurs()
    .map((ascenseur) => construireLigne(ascenseur, refs, jointures, maintenant))
    .sort((a, b) => a.code.localeCompare(b.code));
});

export function filtrerLignesAppareils(lignes: LigneAppareilListe[], filtres: FiltresAppareilsUI): LigneAppareilListe[] {
  const recherche = filtres.recherche?.trim().toLowerCase();
  return lignes.filter((ligne) => {
    if (filtres.statut && ligne.statut !== filtres.statut) return false;
    if (filtres.clientId && ligne.clientId !== filtres.clientId) return false;
    if (filtres.contratId && ligne.contratId !== filtres.contratId) return false;
    if (filtres.technicienId && ligne.technicienId !== filtres.technicienId) return false;
    if (filtres.tourneeId && ligne.tourneeId !== filtres.tourneeId) return false;
    if (filtres.ville && ligne.ville !== filtres.ville) return false;
    if (filtres.secteurId && ligne.secteurId !== filtres.secteurId) return false;
    if (filtres.typeMaintenance && !ligne.categoriesMaintenance.includes(filtres.typeMaintenance)) return false;
    if (filtres.enRetard && !ligne.enRetardMaintenance) return false;
    if (filtres.modeDegrade && !ligne.enModeDegrade) return false;
    if (recherche && !ligne.referenceRecherche.includes(recherche)) return false;
    return true;
  });
}

export interface PageLignes<T> {
  lignesPage: T[];
  pageActuelle: number;
  totalPages: number;
  total: number;
}

export function paginerLignes<T>(lignes: T[], page: number, taillePage: number): PageLignes<T> {
  const total = lignes.length;
  const totalPages = Math.max(1, Math.ceil(total / taillePage));
  const pageActuelle = Math.min(Math.max(1, page), totalPages);
  const debut = (pageActuelle - 1) * taillePage;
  return { lignesPage: lignes.slice(debut, debut + taillePage), pageActuelle, totalPages, total };
}

export interface OptionFiltre {
  id: string;
  label: string;
}

export interface OptionsFiltresAppareils {
  villes: string[];
  secteurs: OptionFiltre[];
  clients: OptionFiltre[];
  contrats: OptionFiltre[];
  techniciens: OptionFiltre[];
  tournees: OptionFiltre[];
}

/** Listes d'options pour les filtres (petites : quelques dizaines d'entrées chacune). */
export const getOptionsFiltresAppareils = cache((): OptionsFiltresAppareils => {
  const villes = Array.from(new Set(getAllAscenseurs().map((a) => a.ville))).sort((a, b) => a.localeCompare(b));
  const secteurs: SecteurGeographique[] = [...getAllSecteursGeographiques()].sort((a, b) => a.nom.localeCompare(b.nom));
  const clients: Client[] = [...getAllClients()].sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale));
  const contrats: Contrat[] = [...getAllContrats()].sort((a, b) => a.numero.localeCompare(b.numero));
  const techniciens: Technicien[] = [...getAllTechniciens()].filter((t) => t.actif).sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));
  const tournees: Tournee[] = [...getAllTournees()].filter((t) => t.actif).sort((a, b) => a.nom.localeCompare(b.nom));

  return {
    villes,
    secteurs: secteurs.map((s) => ({ id: s.id, label: s.nom })),
    clients: clients.map((c) => ({ id: c.id, label: c.raisonSociale })),
    contrats: contrats.map((c) => ({ id: c.id, label: c.numero })),
    techniciens: techniciens.map((t) => ({ id: t.id, label: t.nomComplet })),
    tournees: tournees.map((t) => ({ id: t.id, label: t.nom })),
  };
});
