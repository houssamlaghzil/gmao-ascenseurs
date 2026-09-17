/**
 * Enrichissement des points carte (lib/derived/carte.ts) avec les VRAIES
 * coordonnées GPS de l'appareil.
 *
 * lib/derived/carte.ts reste inchangé (hors périmètre de cette tâche) : il
 * ne calcule qu'une projection en pourcentage (xPercent/yPercent) destinée à
 * l'ancien plan SVG, à partir d'une position jitterée autour du centre-ville
 * — pas d'une vraie latitude/longitude exploitable par Leaflet.
 *
 * `ficheTechnique.localisationGPS` est désormais renseigné pour la totalité
 * du parc (voir data/mockData.ts, `coordonneesAppareil`) : ce module relit
 * directement le store pour obtenir cette position réelle, appareil par
 * appareil, et l'associe aux points déjà filtrés/enrichis par
 * lib/derived/carte.ts (code, adresse, statut, intervention urgente...).
 */

import { cache } from 'react';
import { getAllAscenseurs } from '@/data/store';
import type { PointCarteAppareil } from '@/lib/derived/carte';

export interface PointCarteAvecCoordonnees extends PointCarteAppareil {
  latitude: number;
  longitude: number;
}

/** Index id d'appareil → coordonnées GPS réelles, construit une seule fois par requête. */
const getCoordonneesReellesParAppareilId = cache((): Map<string, { latitude: number; longitude: number }> => {
  const index = new Map<string, { latitude: number; longitude: number }>();
  for (const ascenseur of getAllAscenseurs()) {
    const gps = ascenseur.ficheTechnique.localisationGPS;
    if (gps) index.set(ascenseur.id, gps);
  }
  return index;
});

/**
 * Associe à chaque point sa vraie position GPS. Filet de sécurité si jamais
 * `localisationGPS` n'est pas renseigné pour un appareil donné : on retombe
 * sur la position approximative déjà calculée par lib/derived/carte.ts
 * plutôt que d'exclure le point de la carte.
 */
export function avecCoordonneesReelles(points: PointCarteAppareil[]): PointCarteAvecCoordonnees[] {
  const coordonnees = getCoordonneesReellesParAppareilId();
  return points.map((point) => {
    const gps = coordonnees.get(point.appareilId);
    return {
      ...point,
      latitude: gps?.latitude ?? point.coordonnees.latitude,
      longitude: gps?.longitude ?? point.coordonnees.longitude,
    };
  });
}
