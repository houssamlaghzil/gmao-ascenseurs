/**
 * Accueil de l'exploration — le choix de l'axe de décomposition.
 *
 * L'écran ne répond pas à une question : il propose les sept manières de
 * poser la même. Un parc de 4 348 appareils n'a pas de « bonne » lecture
 * unique — l'exploitant regarde par site, le commerce par client, le
 * planificateur par technicien ou par tournée. Chaque axe est donc une porte
 * d'entrée équivalente vers le même jeu d'appareils.
 *
 * Les critères reçus en query (statut, problème, mode dégradé, recherche)
 * s'appliquent avant décomposition : arriver ici depuis « 174 pannes » du
 * tableau de bord montre bien, sur chaque axe, le nombre de groupes que ces
 * 174 pannes touchent — 143 sites, mais beaucoup moins de clients.
 *
 * Server Component : lecture directe du store via lib/derived/explorer.
 */

import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  Map,
  MapPin,
  Route,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  DIMENSIONS,
  DimensionSlug,
  definitionDimension,
  lienDimension,
  lireFiltres,
  listerGroupes,
} from '@/lib/derived/explorer';
import FilAriane from './components/FilAriane';
import {
  BarreRepartition,
  ChiffreCle,
  CompteursStatuts,
  cumulerRepartitions,
  nombre,
  pluriel,
} from './components/Repartition';

export const dynamic = 'force-dynamic';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Une icône par axe : le repère visuel évite de relire sept titres proches. */
const ICONE: Record<DimensionSlug, LucideIcon> = {
  parc: Building2,
  client: Briefcase,
  contrat: FileText,
  technicien: Wrench,
  tournee: Route,
  secteur: Map,
  ville: MapPin,
};

/** La question à laquelle chaque axe répond — ce qui aide vraiment à choisir. */
const QUESTION: Record<DimensionSlug, string> = {
  parc: 'Quels sites concentrent les appareils immobilisés',
  client: 'Quels clients sont impactés, et à quel point',
  contrat: 'Quels contrats portent le risque contractuel',
  technicien: 'Comment la charge se répartit entre les titulaires',
  tournee: 'Quelles tournées sont les plus chargées',
  secteur: 'Quels secteurs géographiques décrochent',
  ville: 'Où se concentrent les appareils sur le territoire',
};

export default function ExplorerPage({ searchParams }: { searchParams: SearchParamsRecord }) {
  const filtres = lireFiltres(searchParams);

  // Tout appareil porte un `parcId` : cet axe couvre donc l'ensemble retenu et
  // sert de base au bandeau de synthèse.
  const groupesParSite = listerGroupes('parc', filtres);
  const ensemble = cumulerRepartitions(groupesParSite.map((groupe) => groupe.repartition));

  const axes = DIMENSIONS.map((dimension) => {
    const groupes = dimension === 'parc' ? groupesParSite : listerGroupes(dimension, filtres);
    return {
      dimension,
      definition: definitionDimension(dimension),
      nombreGroupes: groupes.length,
      groupesTouches: groupes.filter((groupe) => groupe.repartition.problemes > 0).length,
    };
  });

  return (
    <div className="space-y-6">
      <FilAriane filtres={filtres} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Explorer le parc</h1>
        <p className="mt-1 text-sm text-gray-600">
          Choisissez l&apos;axe de décomposition, puis descendez jusqu&apos;à l&apos;appareil. Les critères actifs sont
          conservés d&apos;un palier à l&apos;autre et restent retirables à tout moment.
        </p>
      </div>

      {/* Bandeau de synthèse : ce que représente l'ensemble avant découpage. */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <ChiffreCle
            valeur={nombre(ensemble.total)}
            libelle={`${pluriel(ensemble.total, 'appareil')} ${pluriel(ensemble.total, 'retenu')}`}
          />
          <ChiffreCle
            valeur={nombre(ensemble.problemes)}
            libelle="En panne ou à l'arrêt"
            ton={ensemble.problemes > 0 ? 'alerte' : 'bon'}
          />
          <ChiffreCle valeur={`${ensemble.disponibilitePourcent} %`} libelle="Disponibilité" ton="bon" />
          <ChiffreCle valeur={nombre(groupesParSite.length)} libelle={pluriel(groupesParSite.length, 'site concerné', 'sites concernés')} />
        </div>

        <div className="mt-5 space-y-2">
          <BarreRepartition repartition={ensemble} hauteur="h-2.5" />
          <CompteursStatuts repartition={ensemble} taille="text-sm" />
        </div>
      </section>

      {/* Les sept portes d'entrée. */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Axes de décomposition</h2>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {axes.map(({ dimension, definition, nombreGroupes, groupesTouches }) => {
            const Icone = ICONE[dimension];
            return (
              <Link
                key={dimension}
                href={lienDimension(dimension, filtres)}
                className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <span className="mt-0.5 rounded-md bg-gray-100 p-2 text-gray-500 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                  <Icone className="h-4 w-4" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-700">{definition.libellePluriel}</h3>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                      {nombre(nombreGroupes)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs leading-snug text-gray-500">{QUESTION[dimension]} ?</p>

                  <p className="mt-2 text-xs">
                    {groupesTouches > 0 ? (
                      <span className="text-rose-700">
                        <span className="font-semibold tabular-nums">{nombre(groupesTouches)}</span> avec au moins un
                        appareil en panne ou à l&apos;arrêt
                      </span>
                    ) : (
                      <span className="text-emerald-700">Aucun appareil en panne ni à l&apos;arrêt</span>
                    )}
                  </p>
                </div>

                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-indigo-500"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
