'use client';

/**
 * Carte Leaflet proprement dite (tuiles OpenStreetMap + marqueurs appareils).
 * Rendue uniquement côté client, via l'import dynamique fait par
 * CarteInteractive.tsx (Leaflet touche `window`/`document` au chargement du
 * module et casse le rendu serveur de Next.js).
 *
 * Pas de marqueurs par défaut Leaflet (leurs icônes PNG ne se résolvent pas
 * correctement une fois passées par le bundler Next) : les appareils sont
 * des CircleMarker react-leaflet, colorés par statut.
 */

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import type { PointCarteAvecCoordonnees } from '../lib/points-gps';

export const COULEUR_STATUT: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_SERVICE]: '#10b981',
  [StatutAppareil.EN_PANNE]: '#f43f5e',
  [StatutAppareil.A_L_ARRET]: '#f97316',
  [StatutAppareil.MODE_DEGRADE]: '#f59e0b',
  [StatutAppareil.ARRET_TRAVAUX]: '#64748b',
};

const CENTRE_FRANCE: LatLngTuple = [46.6, 2.4];

interface CarteLeafletProps {
  points: PointCarteAvecCoordonnees[];
}

/** Recentre/recadre automatiquement la carte sur les points affichés à chaque changement de filtre. */
function CadrageAutomatique({ points }: { points: PointCarteAvecCoordonnees[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(CENTRE_FRANCE, 5);
      return;
    }
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
      return;
    }
    const bounds: LatLngBoundsExpression = points.map((p) => [p.latitude, p.longitude]);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [points, map]);

  return null;
}

export default function CarteLeaflet({ points }: CarteLeafletProps) {
  const centreInitial = useMemo<LatLngTuple>(
    () => (points.length > 0 ? [points[0].latitude, points[0].longitude] : CENTRE_FRANCE),
    [points]
  );

  return (
    <MapContainer center={centreInitial} zoom={6} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <CadrageAutomatique points={points} />

      {points.map((point) => (
        <CircleMarker
          key={point.appareilId}
          center={[point.latitude, point.longitude]}
          radius={point.interventionUrgenteId ? 8 : 6}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: COULEUR_STATUT[point.statut],
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div className="min-w-[180px] space-y-1 text-sm">
              <p className="font-semibold text-gray-900">{point.code}</p>
              <p className="text-gray-600">{point.adresse}</p>
              <p className="text-gray-600">
                {point.ville} · {LIBELLE_STATUT_APPAREIL[point.statut]}
              </p>
              {point.interventionUrgenteId && (
                <p className="font-medium text-rose-600">Intervention urgente ouverte</p>
              )}
              <Link
                href={`/appareils/${point.appareilId}`}
                className="inline-block pt-1 font-medium text-blue-600 hover:underline"
              >
                Voir la fiche appareil
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
