/**
 * Squelette de chargement de la liste des appareils (`app/parc/page.tsx`).
 *
 * Reprend l'en-tête, le panneau de filtres (recherche + 8 sélecteurs +
 * options) puis le tableau des 12 colonnes de `TableauAppareils`.
 */

import {
  ChampFiltrePlaceholder,
  EnTeteSquelette,
  Ligne,
  StatutChargement,
  TableauSquelette,
} from '@/components/skeletons/BlocsSquelette';

export default function Loading() {
  return (
    <>
      <StatutChargement texte="Chargement de la liste des appareils en cours" />

      <div className="space-y-6 cascade-squelette">
        <EnTeteSquelette avecIcone largeurTitre="w-56" lignesSousTitre={1} />

        {/* Filtres */}
        <div aria-hidden className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <Ligne className="h-9 flex-1 rounded-md" />
            <Ligne className="h-9 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ChampFiltrePlaceholder key={i} />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Ligne className="h-4 w-44" />
            <Ligne className="h-4 w-32" />
          </div>
        </div>

        <TableauSquelette colonnes={12} lignes={10} />

        {/* Pagination */}
        <div aria-hidden className="flex items-center justify-between">
          <Ligne className="h-4 w-40" />
          <Ligne className="h-8 w-56 rounded-md" />
        </div>
      </div>
    </>
  );
}
