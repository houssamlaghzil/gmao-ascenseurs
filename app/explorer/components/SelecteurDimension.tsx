/**
 * Sélecteur d'axe de décomposition — le croisement de données demandé.
 *
 * L'ensemble filtré ne change pas d'un onglet à l'autre : seul l'axe qui le
 * découpe change. Les 174 pannes du parc sont les mêmes qu'on les regarde par
 * site, par client, par technicien ou par ville — mais la question qu'on pose
 * n'est pas la même : « quel site est le plus touché », « quel client va
 * appeler », « quel technicien est débordé », « faut-il envoyer une équipe sur
 * une ville ». Basculer d'axe répond à la question suivante sans refaire le
 * filtrage.
 *
 * Le nombre de groupes est affiché sur chaque axe : c'est l'information qui
 * guide le choix (« 143 sites, mais seulement 31 clients » dit tout de suite
 * lequel des deux écrans sera lisible).
 *
 * Server Component : de simples liens, aucun état.
 */

import Link from 'next/link';
import {
  DIMENSIONS,
  DimensionSlug,
  FiltresExploration,
  definitionDimension,
  lienDimension,
  listerGroupes,
} from '@/lib/derived/explorer';

export default function SelecteurDimension({
  active,
  filtres,
}: {
  active: DimensionSlug;
  filtres: FiltresExploration;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-gray-400">Décomposer par</span>

      {DIMENSIONS.map((dimension) => {
        const definition = definitionDimension(dimension);
        // `listerGroupes` est mémoïsé pour la requête : les 7 appels coûtent
        // 7 passes sur le parc, pas 7 recalculs par carte affichée.
        const nombreGroupes = listerGroupes(dimension, filtres).length;
        const estActive = dimension === active;

        if (estActive) {
          return (
            <span
              key={dimension}
              aria-current="true"
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1 text-sm font-medium text-white"
            >
              {definition.libellePluriel}
              <span className="rounded bg-white/15 px-1.5 text-xs font-semibold tabular-nums">{nombreGroupes}</span>
            </span>
          );
        }

        return (
          <Link
            key={dimension}
            href={lienDimension(dimension, filtres)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {definition.libellePluriel}
            <span className="rounded bg-gray-100 px-1.5 text-xs font-semibold tabular-nums text-gray-500">
              {nombreGroupes}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
