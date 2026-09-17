/**
 * Palier 1 — décomposition du parc selon une dimension.
 *
 * Une carte par groupe, triées par gravité décroissante (tri fourni par
 * `listerGroupes` et scrupuleusement préservé ici) : sur 500 sites, l'ordre
 * alphabétique obligerait à parcourir l'écran pour trouver ce qui ne va pas.
 * Ici la première carte est le pire cas, et la première page suffit presque
 * toujours à décider.
 *
 * Le sélecteur d'axe, en tête, rejoue la même décomposition sur un autre axe
 * sans rien perdre des critères : c'est le croisement de données attendu.
 *
 * Pagination à 50 groupes : décomposer 4 348 appareils par site en produit
 * 500, par ville une soixantaine — l'écran doit tenir dans les deux cas.
 *
 * Server Component : lecture directe du store via lib/derived/explorer.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  definitionDimension,
  estDimension,
  lienDimension,
  lireFiltres,
  listerGroupes,
} from '@/lib/derived/explorer';
import FilAriane from '../components/FilAriane';
import SelecteurDimension from '../components/SelecteurDimension';
import CarteGroupe from '../components/CarteGroupe';
import PaginationExploration, { TAILLE_PAGE, normaliserPage } from '../components/PaginationExploration';
import {
  BarreRepartition,
  ChiffreCle,
  CompteursStatuts,
  cumulerRepartitions,
  nombre,
  pluriel,
} from '../components/Repartition';

export const dynamic = 'force-dynamic';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const valeur = searchParams[cle];
  return Array.isArray(valeur) ? valeur[0] : valeur;
}

export default function PalierDimensionPage({
  params,
  searchParams,
}: {
  params: { dimension: string };
  searchParams: SearchParamsRecord;
}) {
  if (!estDimension(params.dimension)) notFound();

  const dimension = params.dimension;
  const definition = definitionDimension(dimension);
  const filtres = lireFiltres(searchParams);

  const groupes = listerGroupes(dimension, filtres);
  const ensemble = cumulerRepartitions(groupes.map((groupe) => groupe.repartition));
  const groupesTouches = groupes.filter((groupe) => groupe.repartition.problemes > 0).length;

  const totalPages = Math.max(Math.ceil(groupes.length / TAILLE_PAGE), 1);
  const pageActuelle = normaliserPage(param(searchParams, 'page'), totalPages);
  const debut = (pageActuelle - 1) * TAILLE_PAGE;
  const groupesPage = groupes.slice(debut, debut + TAILLE_PAGE);

  const legende =
    groupes.length === 0
      ? 'Aucun groupe'
      : `${nombre(groupes.length)} ${definition.libellePluriel.toLowerCase()} · ${nombre(debut + 1)} à ${nombre(
          debut + groupesPage.length,
        )} affichés`;

  return (
    <div className="space-y-6">
      <FilAriane dimension={dimension} filtres={filtres} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parc par {definition.libelle.toLowerCase()}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {nombre(groupes.length)} {definition.libellePluriel.toLowerCase()} · {nombre(ensemble.total)}{' '}
          {pluriel(ensemble.total, 'appareil')}
          {groupesTouches > 0 && (
            <>
              {' · '}
              <span className="font-medium text-rose-700">
                {nombre(groupesTouches)} {groupesTouches > 1 ? 'touchés' : 'touché'} par une panne ou un arrêt
              </span>
            </>
          )}
        </p>
      </div>

      <SelecteurDimension active={dimension} filtres={filtres} />

      {/* Synthèse de l'ensemble décomposé — l'état avant découpage, pour référence. */}
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
          {/*
            La disponibilité n'a de sens que sur un ensemble non filtré par
            statut : filtrer sur « en panne » la fige à 0 % par construction,
            ce qui n'apprend rien et se lit à tort comme un parc effondré.
          */}
          {!filtres.statut && !filtres.probleme && !filtres.modeDegrade && (
            <ChiffreCle valeur={`${ensemble.disponibilitePourcent} %`} libelle="Disponibilité" ton="bon" />
          )}
          <ChiffreCle
            valeur={nombre(groupes.length)}
            libelle={definition.libellePluriel.toLowerCase()}
          />
        </div>

        <div className="mt-5 space-y-2">
          <BarreRepartition repartition={ensemble} hauteur="h-2.5" />
          <CompteursStatuts repartition={ensemble} taille="text-sm" />
        </div>
      </section>

      {groupes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-sm font-medium text-gray-700">
            Aucun {definition.libelle.toLowerCase()} ne correspond aux critères actifs.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Retirez un critère dans le fil d&apos;Ariane, ou repartez de la décomposition complète.
          </p>
          <Link
            href={lienDimension(dimension)}
            className="mt-4 inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Voir tous les {definition.libellePluriel.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groupesPage.map((groupe) => (
              <CarteGroupe key={groupe.id} dimension={dimension} groupe={groupe} filtres={filtres} />
            ))}
          </div>

          <PaginationExploration
            base={`/explorer/${dimension}`}
            filtres={filtres}
            pageActuelle={pageActuelle}
            totalPages={totalPages}
            legende={legende}
          />
        </>
      )}
    </div>
  );
}
