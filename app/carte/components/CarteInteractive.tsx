'use client';

/**
 * Carte interactive Leaflet + tuiles OpenStreetMap (remplace l'ancien plan
 * schématique SVG, section 13). Composant client "intermédiaire" : Leaflet
 * accède à `window`/`document` dès son import, ce qui casse le rendu
 * serveur Next.js — la carte proprement dite (CarteLeaflet.tsx) est donc
 * chargée via `next/dynamic` avec `ssr: false`, option qui n'est permise
 * que depuis un composant client (un Server Component ne peut pas la
 * passer).
 */

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import { COULEUR_STATUT } from './CarteLeaflet';
import type { PointCarteAvecCoordonnees } from '../lib/points-gps';

const CarteLeafletSansSSR = dynamic(() => import('./CarteLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
      Chargement de la carte…
    </div>
  ),
});

interface CarteInteractiveProps {
  points: PointCarteAvecCoordonnees[];
}

export default function CarteInteractive({ points }: CarteInteractiveProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="relative h-[420px] w-full overflow-hidden rounded-md border border-gray-200 sm:h-[520px] lg:h-[620px]">
        <CarteLeafletSansSSR points={points} />

        {points.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 text-sm text-gray-400">
            Aucun point à afficher pour ces filtres.
          </div>
        )}
      </div>

      <Legende />
    </div>
  );
}

function Legende() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
      <span className="font-medium text-gray-500">Appareil :</span>
      {Object.values(StatutAppareil).map((statut) => (
        <span key={statut} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COULEUR_STATUT[statut] }} />
          {LIBELLE_STATUT_APPAREIL[statut]}
        </span>
      ))}
      <span className="mx-1 hidden h-4 w-px bg-gray-200 sm:inline-block" />
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full border-2 border-white bg-rose-500 shadow" />
        Point plus grand : intervention urgente ouverte
      </span>
    </div>
  );
}
