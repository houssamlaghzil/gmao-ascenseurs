/**
 * Squelette de chargement de la fiche appareil (`app/appareils/[id]/page.tsx`).
 *
 * Reprend le bandeau d'en-tête, puis la grille contenu + sidebar de contexte
 * (`lg:grid-cols-[minmax(0,1fr)_20rem]`), qui passe sous le contenu en
 * dessous de `lg` — exactement comme la page réelle.
 */

import { Ligne, OngletsPlaceholder, Panneau, StatutChargement } from '@/components/skeletons/BlocsSquelette';

export default function Loading() {
  return (
    <>
      <StatutChargement texte="Chargement de la fiche appareil en cours" />

      <div className="space-y-6 cascade-squelette">
        <Ligne className="h-4 w-40" />

        {/* Bandeau d'en-tête */}
        <div aria-hidden className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <Ligne className="h-7 w-32" />
                <Ligne className="h-5 w-20 rounded-full" />
              </div>
              <Ligne className="h-4 w-64" />
              <Ligne className="h-4 w-48" />
            </div>
            <div className="space-y-2 text-right">
              <Ligne className="ml-auto h-4 w-40" />
              <Ligne className="ml-auto h-4 w-28" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Contenu principal : onglets + historique des états */}
          <div className="min-w-0 space-y-6">
            <div>
              <OngletsPlaceholder count={7} />
              <div aria-hidden className="mt-6 space-y-3">
                <Ligne className="h-24 w-full" />
                <Ligne className="h-24 w-full" />
                <Ligne className="h-24 w-full" />
              </div>
            </div>

            <Panneau avecEntete largeurTitre="w-44">
              <div aria-hidden className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Ligne key={i} className="h-10 w-full" />
                ))}
              </div>
            </Panneau>
          </div>

          {/* Sidebar contextuelle de site */}
          <div aria-hidden className="space-y-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <Ligne className="h-3 w-12" />
              <Ligne className="mt-2 h-4 w-32" />
              <Ligne className="mt-3 h-3 w-full" />
              <Ligne className="mt-1.5 h-3 w-2/3" />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <Ligne className="h-3 w-20" />
              <Ligne className="mt-2 h-6 w-16" />
              <Ligne className="mt-3 h-2 w-full rounded-full" />
              <div className="mt-3 space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ligne key={i} className="h-3 w-full" />
                ))}
              </div>
            </div>
            <Ligne className="h-16 w-full rounded-lg" />
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <Ligne className="h-3 w-28" />
              <Ligne className="mt-2 h-4 w-20" />
              <Ligne className="mt-1.5 h-3 w-40" />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <Ligne className="h-3 w-16" />
              <Ligne className="mt-2 h-3 w-32" />
              <Ligne className="mt-2 h-3 w-28" />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <Ligne className="h-3 w-28" />
              </div>
              <div className="space-y-1.5 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Ligne key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
