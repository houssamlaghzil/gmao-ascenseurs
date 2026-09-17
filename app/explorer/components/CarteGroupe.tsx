/**
 * Une carte du palier 1 : un groupe (un site, un client, un technicien…) et
 * l'état du parc qu'il porte.
 *
 * La carte entière est cliquable et mène au palier 2 en emportant les critères
 * courants. Volontairement aucun lien imbriqué : sur une grille de 50 cartes,
 * une cible unique et large vaut mieux que trois micro-liens à viser, et le
 * détail cliquable est offert une fois arrivé dans le groupe.
 *
 * Hiérarchie de lecture assumée : le nombre d'appareils qui posent problème
 * est le seul chiffre en gros, parce que c'est le seul sur lequel on décide
 * quelque chose. Le reste (total, répartition, part indisponible) l'explique.
 *
 * Server Component : aucun état, aucun handler.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  DimensionSlug,
  FiltresExploration,
  GroupeExploration,
  lienGroupe,
} from '@/lib/derived/explorer';
import { BarreRepartition, CompteursStatuts, nombre, pluriel } from './Repartition';

export default function CarteGroupe({
  dimension,
  groupe,
  filtres,
}: {
  dimension: DimensionSlug;
  groupe: GroupeExploration;
  filtres: FiltresExploration;
}) {
  const { repartition, repartitionTotale } = groupe;
  const masques = repartitionTotale.total - repartition.total;

  return (
    <Link
      href={lienGroupe(dimension, groupe.id, filtres)}
      className="group flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-gray-900 group-hover:text-indigo-700" title={groupe.libelle}>
            {groupe.libelle}
          </h3>
          {groupe.sousTitre && (
            <p className="truncate text-xs text-gray-500" title={groupe.sousTitre}>
              {groupe.sousTitre}
            </p>
          )}
        </div>
        <ArrowRight
          className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-indigo-500"
          aria-hidden
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        {repartition.problemes > 0 ? (
          <p className="leading-none">
            <span className="text-2xl font-semibold tabular-nums text-rose-600">{nombre(repartition.problemes)}</span>
            <span className="ml-1.5 text-xs text-rose-700">
              {pluriel(repartition.problemes, 'appareil')} en panne ou à l&apos;arrêt
            </span>
          </p>
        ) : (
          <p className="leading-none">
            <span className="text-2xl font-semibold tabular-nums text-gray-900">{nombre(repartition.total)}</span>
            <span className="ml-1.5 text-xs text-gray-500">{pluriel(repartition.total, 'appareil')}</span>
          </p>
        )}

        {/*
          Toujours la disponibilité du groupe ENTIER, jamais celle de la
          sélection filtrée : en filtrant sur « en panne », cette dernière vaut
          0 % par construction et laisserait croire qu'un site de 18 appareils
          dont 3 sont en panne est intégralement hors service.
        */}
        <p className="shrink-0 text-right text-xs leading-tight text-gray-500">
          <span className="font-medium tabular-nums text-gray-700">{repartitionTotale.disponibilitePourcent} %</span>
          <br />
          en service
        </p>
      </div>

      <div className="space-y-1.5">
        <BarreRepartition repartition={repartition} />
        <CompteursStatuts repartition={repartition} />
      </div>

      {masques > 0 && (
        <p className="border-t border-dashed border-gray-200 pt-2 text-xs text-gray-400">
          {nombre(repartition.total)} sur {nombre(repartitionTotale.total)} {pluriel(repartitionTotale.total, 'appareil')}{' '}
          — {nombre(masques)} {pluriel(masques, 'masqué')} par les critères
        </p>
      )}
    </Link>
  );
}
