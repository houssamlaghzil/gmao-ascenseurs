/**
 * Cartographie schématique (section 13) — projection lat/long → position en
 * pourcentage sur un plan SVG stylisé (pas de tuiles réseau, pas de clé API :
 * Leaflet/Mapbox/Google Maps ne sont pas installés dans ce projet et ne
 * doivent pas l'être).
 *
 * `ficheTechnique.localisationGPS` n'est jamais renseigné dans les données
 * générées (voir domain/types.ts) : une position approximative est dérivée
 * ici de la ville du Parc, par jitter ±0,01 à ±0,05° autour du centre-ville
 * (même principe que `jitterCoordonnees` dans data/mockData.ts, mais rejoué
 * de façon déterministe à partir de l'id de l'appareil pour que le point ne
 * "saute" pas d'un rendu à l'autre). Les Techniciens/Zones/Tournées du jour
 * portent déjà de vraies Coordonnees dans le modèle gelé : ils sont
 * simplement projetés, jamais jitterés ici.
 *
 * Fichier neuf sous lib/derived/ : domain/types.ts, domain/business-logic.ts
 * et data/store.ts restent inchangés.
 */

import { cache } from 'react';
import {
  Coordonnees,
  StatutAppareil,
  StatutIntervention,
  PrioriteIntervention,
  NiveauUrgence,
  TypeZoneGeographique,
  StatutPresenceTechnicien,
  StatutEtapeTournee,
  FiltresCarte,
  PointCarteAppareil as PointCarteAppareilBase,
} from '@/domain/types';
import {
  getAllAscenseurs,
  getParcById,
  getAllInterventions,
  getInterventionById,
  getAllMaintenances,
  getAllTechniciens,
  getAllClients,
  getAllPositionsTechnicien,
  getAllZonesGeographiques,
  getAllTourneesDuJour,
  getTourneeById,
} from '@/data/store';
import { estMaintenanceEnRetard } from '@/lib/derived/maintenances-appareil';
import type { OptionFiltre } from '@/lib/derived/parc-liste';

// ============================================================================
// RÉFÉRENTIEL GÉOGRAPHIQUE — mêmes villes que data/mockData.ts (centre-ville,
// degrés décimaux). Dupliqué volontairement : mockData.ts est gelé et sa
// table interne n'est pas exportée.
// ============================================================================

const COORDONNEES_VILLES: Record<string, Coordonnees> = {
  Paris: { latitude: 48.8566, longitude: 2.3522 },
  Courbevoie: { latitude: 48.897, longitude: 2.254 },
  Lyon: { latitude: 45.764, longitude: 4.8357 },
  Villeurbanne: { latitude: 45.7667, longitude: 4.8794 },
  Marseille: { latitude: 43.2965, longitude: 5.3698 },
  Toulouse: { latitude: 43.6047, longitude: 1.4442 },
  Nice: { latitude: 43.7102, longitude: 7.262 },
  Nantes: { latitude: 47.2184, longitude: -1.5536 },
  Strasbourg: { latitude: 48.5734, longitude: 7.7521 },
  Montpellier: { latitude: 43.6108, longitude: 3.8767 },
  Bordeaux: { latitude: 44.8378, longitude: -0.5792 },
  Lille: { latitude: 50.6292, longitude: 3.0573 },
  Rennes: { latitude: 48.1173, longitude: -1.6778 },
  Reims: { latitude: 49.2583, longitude: 4.0317 },
  'Le Havre': { latitude: 49.4944, longitude: 0.1079 },
  'Saint-Étienne': { latitude: 45.4397, longitude: 4.3872 },
  Toulon: { latitude: 43.1242, longitude: 5.928 },
  Grenoble: { latitude: 45.1885, longitude: 5.7245 },
  Dijon: { latitude: 47.322, longitude: 5.0415 },
  Angers: { latitude: 47.4784, longitude: -0.5632 },
};

const VILLE_PAR_DEFAUT: Coordonnees = COORDONNEES_VILLES.Paris;

function coordonneesVille(ville: string): Coordonnees {
  return COORDONNEES_VILLES[ville] ?? VILLE_PAR_DEFAUT;
}

// ----------------------------------------------------------------------------
// Jitter déterministe (±0,01 à ±0,05°) : dérivé de l'id de l'appareil pour
// rester stable d'un rendu à l'autre (pas de Math.random() direct).
// ----------------------------------------------------------------------------

function hashChaine(valeur: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < valeur.length; i++) {
    h ^= valeur.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Suite pseudo-aléatoire stable [0,1) dérivée d'une graine (mulberry32). */
function pseudoAleatoires(graine: string, n: number): number[] {
  let a = hashChaine(graine) || 1;
  const suite: number[] = [];
  for (let i = 0; i < n; i++) {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    suite.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
  }
  return suite;
}

/** ±0,01 à ±0,05°, signe aléatoire — magnitude répartie uniformément sur l'intervalle. */
function decalageJitter(r: number): number {
  const signe = r < 0.5 ? -1 : 1;
  const magnitude = (r < 0.5 ? r * 2 : (r - 0.5) * 2) * 0.04 + 0.01;
  return signe * magnitude;
}

/** Position approximative d'un appareil : jitter stable autour du centre-ville de son Parc. */
function jitterCoordonneesAppareil(ville: string, graine: string): Coordonnees {
  const base = coordonneesVille(ville);
  const [r1, r2] = pseudoAleatoires(graine, 2);
  return {
    latitude: base.latitude + decalageJitter(r1),
    longitude: base.longitude + decalageJitter(r2),
  };
}

// ----------------------------------------------------------------------------
// Projection linéaire bornée aux min/max du référentiel de villes (pas une
// vraie projection cartographique — suffisant pour un plan schématique).
// ----------------------------------------------------------------------------

const MARGE_DEGRES = 0.35; // marge autour des villes extrêmes + jitter max (0,05°)
const LATITUDES = Object.values(COORDONNEES_VILLES).map((c) => c.latitude);
const LONGITUDES = Object.values(COORDONNEES_VILLES).map((c) => c.longitude);
const LAT_MIN = Math.min(...LATITUDES) - MARGE_DEGRES;
const LAT_MAX = Math.max(...LATITUDES) + MARGE_DEGRES;
const LON_MIN = Math.min(...LONGITUDES) - MARGE_DEGRES;
const LON_MAX = Math.max(...LONGITUDES) + MARGE_DEGRES;

function clamp(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}

export interface PositionProjetee {
  xPercent: number;
  yPercent: number;
}

/** Projette une coordonnée lat/long sur un plan 0-100 % (aligné avec le viewBox SVG "0 0 100 100"). */
export function projeterCoordonnees(coord: Coordonnees): PositionProjetee {
  return {
    xPercent: clamp(((coord.longitude - LON_MIN) / (LON_MAX - LON_MIN)) * 100, 0, 100),
    yPercent: clamp(((LAT_MAX - coord.latitude) / (LAT_MAX - LAT_MIN)) * 100, 0, 100),
  };
}

// ============================================================================
// APPAREILS
// ============================================================================

/**
 * Étend le type gelé `PointCarteAppareil` (domain/types.ts) des champs
 * d'affichage (code, adresse, noms dénormalisés) et de la projection carte.
 */
export interface PointCarteAppareil extends PointCarteAppareilBase {
  code: string;
  adresse: string;
  clientNom: string;
  technicienNom?: string;
  anormal: boolean; // statutAppareil !== EN_SERVICE
  enRetardMaintenance: boolean;
  position: PositionProjetee;
}

/** Filtres du panneau de cartographie (section 13) — étend le type gelé FiltresCarte. */
export interface FiltresCarteUI extends FiltresCarte {
  /** Bypass explicite du filtre de volume par défaut (section 13 : "afficher tous les appareils de la zone visible"). */
  afficherTousLesAppareils?: boolean;
}

interface UrgenceParAppareil {
  interventionId: string;
  niveauUrgence: PrioriteIntervention;
}

/** Une intervention est "urgente" au sens carte si priorité CRITIQUE ou niveau d'urgence "personne bloquée". */
function estInterventionUrgenteOuverte(niveauUrgence: NiveauUrgence, priorite: PrioriteIntervention): boolean {
  return priorite === PrioriteIntervention.CRITIQUE || niveauUrgence === NiveauUrgence.PERSONNE_BLOQUEE;
}

/** Intervention urgente ouverte la plus prioritaire par appareil (une intervention CLOTURE n'est plus "ouverte"). */
const construireIndexInterventionsUrgentes = cache((): Map<string, UrgenceParAppareil> => {
  const index = new Map<string, UrgenceParAppareil>();
  for (const intervention of getAllInterventions()) {
    if (intervention.statut === StatutIntervention.CLOTURE) continue;
    if (!estInterventionUrgenteOuverte(intervention.niveauUrgence, intervention.priorite)) continue;
    const existante = index.get(intervention.ascenseurId);
    if (!existante || (existante.niveauUrgence !== PrioriteIntervention.CRITIQUE && intervention.priorite === PrioriteIntervention.CRITIQUE)) {
      index.set(intervention.ascenseurId, { interventionId: intervention.id, niveauUrgence: intervention.priorite });
    }
  }
  return index;
});

const construireIndexMaintenancesEnRetard = cache((): Set<string> => {
  const set = new Set<string>();
  const maintenant = new Date();
  for (const maintenance of getAllMaintenances()) {
    if (estMaintenanceEnRetard(maintenance, maintenant)) set.add(maintenance.ascenseurId);
  }
  return set;
});

/**
 * Tous les appareils projetés sur la carte (~4 350), enrichis de l'intervention
 * urgente éventuellement ouverte et du retard de maintenance. Mis en cache
 * pour la durée de la requête ; le filtrage (volume par défaut + filtres
 * explicites) est appliqué séparément par `filtrerPointsCarteAppareils`.
 */
export const getPointsCarteAppareils = cache((): PointCarteAppareil[] => {
  const urgences = construireIndexInterventionsUrgentes();
  const maintenancesEnRetard = construireIndexMaintenancesEnRetard();
  const clientsParId = new Map(getAllClients().map((c) => [c.id, c]));
  const techniciensParId = new Map(getAllTechniciens().map((t) => [t.id, t]));

  return getAllAscenseurs().map((ascenseur) => {
    const parc = getParcById(ascenseur.parcId);
    const ville = parc?.ville ?? ascenseur.ville;
    const client = clientsParId.get(ascenseur.clientId);
    const technicien = ascenseur.technicienAffecteId ? techniciensParId.get(ascenseur.technicienAffecteId) : undefined;
    const urgence = urgences.get(ascenseur.id);
    const coordonnees = jitterCoordonneesAppareil(ville, ascenseur.id);

    return {
      appareilId: ascenseur.id,
      coordonnees,
      code: ascenseur.code,
      adresse: ascenseur.adresseComplete,
      ville,
      statut: ascenseur.statutAppareil,
      clientId: ascenseur.clientId,
      clientNom: client?.raisonSociale ?? '—',
      contratId: ascenseur.contratId,
      technicienAffecteId: ascenseur.technicienAffecteId,
      technicienNom: technicien?.nomComplet,
      tourneeId: ascenseur.tourneeId,
      interventionUrgenteId: urgence?.interventionId,
      niveauUrgence: urgence?.niveauUrgence,
      anormal: ascenseur.statutAppareil !== StatutAppareil.EN_SERVICE,
      enRetardMaintenance: maintenancesEnRetard.has(ascenseur.id),
      position: projeterCoordonnees(coordonnees),
    };
  });
});

/**
 * Filtre le volume par défaut (section 13 : vu le nombre d'appareils,
 * n'affiche que les anomalies/urgences par défaut) puis les filtres
 * explicites du panneau (technicien, statut, client, intervention urgente,
 * maintenance en retard). Un deep-link `interventionId` force l'inclusion de
 * l'appareil visé même s'il ne matcherait pas le filtre de volume.
 */
export function filtrerPointsCarteAppareils(points: PointCarteAppareil[], filtres: FiltresCarteUI): PointCarteAppareil[] {
  const appareilCible = filtres.interventionId ? getInterventionById(filtres.interventionId)?.ascenseurId : undefined;

  return points.filter((point) => {
    const estCible = appareilCible === point.appareilId;
    const visibleParDefaut =
      Boolean(filtres.afficherTousLesAppareils) ||
      filtres.statutAppareil !== undefined ||
      point.anormal ||
      Boolean(point.interventionUrgenteId) ||
      estCible;
    if (!visibleParDefaut) return false;

    if (filtres.statutAppareil && point.statut !== filtres.statutAppareil) return false;
    if (filtres.clientId && point.clientId !== filtres.clientId) return false;
    if (filtres.technicienId && point.technicienAffecteId !== filtres.technicienId) return false;
    if (filtres.interventionsUrgentesUniquement && !point.interventionUrgenteId) return false;
    if (filtres.maintenancesEnRetardUniquement && !point.enRetardMaintenance) return false;
    return true;
  });
}

// ============================================================================
// TECHNICIENS — ACCÈS RÉSERVÉ AUX PROFILS ADMINISTRATIFS AUTORISÉS (section 13 :
// "réservée aux profils administratifs autorisés", cf. domain/types.ts sur
// PositionTechnicien). Aucune vraie vérification d'auth ici (maquette) : la
// restriction est seulement rappelée à l'affichage (voir FiltresCarteForm).
// ============================================================================

export interface PointCarteTechnicien {
  technicienId: string;
  nomComplet: string;
  specialite: string;
  statutPresence: StatutPresenceTechnicien;
  horodatage: string;
  precisionMetres?: number;
  tourneeDuJourId?: string;
  position: PositionProjetee;
}

export const getPointsCarteTechniciens = cache((): PointCarteTechnicien[] => {
  const techniciensParId = new Map(getAllTechniciens().map((t) => [t.id, t]));
  return getAllPositionsTechnicien().map((position) => {
    const technicien = techniciensParId.get(position.technicienId);
    return {
      technicienId: position.technicienId,
      nomComplet: technicien?.nomComplet ?? 'Technicien inconnu',
      specialite: technicien?.specialite ?? '',
      statutPresence: position.statutPresence,
      horodatage: position.horodatage,
      precisionMetres: position.precisionMetres,
      tourneeDuJourId: position.tourneeDuJourId,
      position: projeterCoordonnees(position.coordonnees),
    };
  });
});

// ============================================================================
// ZONES GÉOGRAPHIQUES
// ============================================================================

export interface ZoneCarte {
  id: string;
  nom: string;
  type: TypeZoneGeographique;
  couleur: string;
  contour: PositionProjetee[];
}

export const getZonesCarte = cache((): ZoneCarte[] => {
  return getAllZonesGeographiques().map((zone) => ({
    id: zone.id,
    nom: zone.nom,
    type: zone.type,
    couleur: zone.couleur,
    contour: zone.contour.map(projeterCoordonnees),
  }));
});

// ============================================================================
// TOURNÉES DU JOUR — tracé reliant les étapes (ordre croissant)
// ============================================================================

const PALETTE_TOURNEES_SECOURS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777', '#0891b2'];

export interface EtapeTourneeCarte extends PositionProjetee {
  ordre: number;
  appareilId: string;
  statut: StatutEtapeTournee;
  heurePrevue?: string;
  heureReelle?: string;
}

export interface TourneeDuJourCarte {
  id: string;
  technicienId: string;
  technicienNom: string;
  couleur: string;
  etapes: EtapeTourneeCarte[];
}

export const getTourneesDuJourCarte = cache((): TourneeDuJourCarte[] => {
  const techniciensParId = new Map(getAllTechniciens().map((t) => [t.id, t]));
  return getAllTourneesDuJour().map((tournee, index) => {
    const technicien = techniciensParId.get(tournee.technicienId);
    const secteur = tournee.tourneeId ? getTourneeById(tournee.tourneeId) : undefined;
    const etapes = [...tournee.etapes].sort((a, b) => a.ordre - b.ordre);
    return {
      id: tournee.id,
      technicienId: tournee.technicienId,
      technicienNom: technicien?.nomComplet ?? 'Technicien inconnu',
      couleur: secteur?.couleur ?? PALETTE_TOURNEES_SECOURS[index % PALETTE_TOURNEES_SECOURS.length],
      etapes: etapes.map((etape) => ({
        ...projeterCoordonnees(etape.coordonnees),
        ordre: etape.ordre,
        appareilId: etape.appareilId,
        statut: etape.statut,
        heurePrevue: etape.heurePrevue,
        heureReelle: etape.heureReelle,
      })),
    };
  });
});

// ============================================================================
// OPTIONS DE FILTRES
// ============================================================================

export interface OptionsFiltresCarte {
  techniciens: OptionFiltre[];
  clients: OptionFiltre[];
}

export const getOptionsFiltresCarte = cache((): OptionsFiltresCarte => {
  const techniciens = [...getAllTechniciens()].filter((t) => t.actif).sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));
  const clients = [...getAllClients()].sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale));
  return {
    techniciens: techniciens.map((t) => ({ id: t.id, label: t.nomComplet })),
    clients: clients.map((c) => ({ id: c.id, label: c.raisonSociale })),
  };
});
