/**
 * Squelette de chargement de l'exploration (`app/explorer/**`).
 *
 * Segment partagé par les trois paliers : `/explorer`, `/explorer/[dimension]`
 * et `/explorer/[dimension]/[valeur]` — aucun de ces trois dossiers ne porte
 * son propre `loading.tsx`, celui-ci s'applique donc par héritage aux trois.
 * La forme retenue (fil d'Ariane, titre, sélecteur d'axe, bandeau de chiffres
 * clés, grille de cartes de groupes) est celle du palier intermédiaire
 * (`[dimension]/page.tsx`), qui est la plus représentative des trois — le
 * palier `/explorer` remplace juste le sélecteur par les mêmes cartes
 * (les sept axes), et le palier `[valeur]` remplace la grille par un tableau,
 * déjà couvert par `TableauSquelette` ailleurs dans l'app.
 */

import {
  BarrePlaceholder,
  CarteGroupePlaceholder,
  ChiffreClePlaceholder,
  FilArianePlaceholder,
  Ligne,
  PastillesPlaceholder,
  StatutChargement,
} from '@/components/skeletons/BlocsSquelette';

export default function Loading() {
  return (
    <>
      <StatutChargement texte="Chargement de l'exploration du parc en cours" />

      <div className="space-y-6 cascade-squelette">
        <FilArianePlaceholder />

        <div aria-hidden>
          <Ligne className="h-7 w-72" />
          <Ligne className="mt-1.5 h-4 w-96" />
        </div>

        <PastillesPlaceholder count={7} />

        {/* Bandeau de chiffres clés */}
        <section aria-hidden className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ChiffreClePlaceholder key={i} />
            ))}
          </div>
          <div className="mt-5 space-y-2">
            <BarrePlaceholder hauteur="h-2.5" />
            <div className="flex flex-wrap items-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Ligne key={i} className="h-3 w-20" />
              ))}
            </div>
          </div>
        </section>

        {/* Grille de cartes de groupes, deux colonnes à partir de sm */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CarteGroupePlaceholder key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
