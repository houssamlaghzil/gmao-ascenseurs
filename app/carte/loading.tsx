/**
 * Squelette de chargement de la carte (`app/carte/page.tsx`).
 *
 * Reprend les 4 tuiles KPI, le bloc de filtres (3 sélecteurs + options) puis
 * le grand cadre de carte à hauteur responsive identique
 * (`h-[420px] sm:h-[520px] lg:h-[620px]`), pour qu'aucun redimensionnement
 * ne soit visible à l'arrivée de Leaflet.
 */

import {
  ChampFiltrePlaceholder,
  EnTeteSquelette,
  Ligne,
  StatutChargement,
  TuileStat,
} from '@/components/skeletons/BlocsSquelette';

export default function Loading() {
  return (
    <>
      <StatutChargement texte="Chargement de la carte en cours" />

      <div className="space-y-6 cascade-squelette">
        <EnTeteSquelette avecIcone largeurTitre="w-32" lignesSousTitre={1} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TuileStat key={i} />
          ))}
        </div>

        {/* Filtres */}
        <div aria-hidden className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ChampFiltrePlaceholder key={i} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Ligne className="h-4 w-56" />
            <Ligne className="h-4 w-48" />
            <Ligne className="h-4 w-64" />
          </div>
          <Ligne className="h-3 w-80" />
        </div>

        {/* Carte */}
        <div aria-hidden className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <Ligne className="h-[420px] w-full rounded-md sm:h-[520px] lg:h-[620px]" />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Ligne key={i} className="h-3 w-24" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
