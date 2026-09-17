/**
 * Palier 2 — les appareils d'un groupe.
 *
 * Dernier palier avant la fiche : la liste nominative des appareils du site,
 * du client, du technicien… Chaque ligne mène à `/appareils/<id>` — route
 * construite ailleurs, jamais fabriquée à la main ici : `lienAppareil()`.
 *
 * L'en-tête montre la répartition *totale* du groupe, filtres ignorés. Ce
 * choix est délibéré : avec le critère « en panne » actif, une barre sur les
 * seuls appareils retenus serait rouge à 100 % et ne dirait rien. Ce qu'on
 * veut savoir en arrivant sur un site, c'est l'état du site — « 3 en panne
 * sur 24 » — pas que les 3 sélectionnés sont bien en panne. La liste en
 * dessous, elle, respecte les critères, et le décalage entre les deux est
 * annoncé explicitement avec le lien qui lève le filtrage.
 *
 * Server Component : lecture directe du store via lib/derived/explorer.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import { LienAppareil, LienVille, PastilleStatut } from '@/components/Liens';
import {
  DimensionSlug,
  calculerRepartition,
  definitionDimension,
  estDimension,
  lienGroupe,
  lireFiltres,
  listerAppareilsDuGroupe,
  listerTousAppareilsDuGroupe,
} from '@/lib/derived/explorer';
import FilAriane from '../../components/FilAriane';
import {
  BarreRepartition,
  ChiffreCle,
  CompteursStatuts,
  nombre,
  pluriel,
} from '../../components/Repartition';

export const dynamic = 'force-dynamic';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

/**
 * Next.js décode déjà les segments dynamiques, mais la clé « ville » est un
 * nom propre accentué (`Saint-%C3%89tienne`) : on vérifie que la valeur
 * désigne bien un groupe peuplé, et on retente une fois décodée si besoin.
 * C'est aussi ce test qui distingue un groupe vide d'un identifiant inexistant.
 */
function resoudreValeur(dimension: DimensionSlug, brut: string): string | undefined {
  const candidats = [brut];
  try {
    const decode = decodeURIComponent(brut);
    if (decode !== brut) candidats.push(decode);
  } catch {
    // Séquence d'échappement invalide : on s'en tient à la valeur brute.
  }
  return candidats.find((candidat) => listerTousAppareilsDuGroupe(dimension, candidat).length > 0);
}

export default function PalierGroupePage({
  params,
  searchParams,
}: {
  params: { dimension: string; valeur: string };
  searchParams: SearchParamsRecord;
}) {
  if (!estDimension(params.dimension)) notFound();

  const dimension = params.dimension;
  const definition = definitionDimension(dimension);
  const filtres = lireFiltres(searchParams);

  const valeur = resoudreValeur(dimension, params.valeur);
  if (!valeur) notFound();

  const intitule = definition.intitule(valeur);
  if (!intitule) notFound();

  const appareils = listerAppareilsDuGroupe(dimension, valeur, filtres);
  const tous = listerTousAppareilsDuGroupe(dimension, valeur);
  const repartitionTotale = calculerRepartition(tous);
  const masques = tous.length - appareils.length;

  /**
   * Compteur de l'en-tête → sous-ensemble de ce groupe pour ce statut. Les
   * critères « pose problème » et « mode dégradé » sont levés au passage :
   * les croiser avec un statut explicite produirait des écrans vides
   * (« en panne » ET « en service »), ce qui n'est jamais l'intention du clic.
   */
  const lienStatutDuGroupe = (statut: StatutAppareil) =>
    lienGroupe(dimension, valeur, { ...filtres, statut, probleme: false, modeDegrade: false });

  return (
    <div className="space-y-6">
      <FilAriane
        dimension={dimension}
        groupe={{ valeur, libelle: intitule.libelle }}
        filtres={filtres}
      />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{definition.libelle}</p>
        <h1 className="text-2xl font-bold text-gray-900">{intitule.libelle}</h1>
        {intitule.sousTitre && <p className="mt-0.5 text-sm text-gray-600">{intitule.sousTitre}</p>}
      </div>

      {/* État réel du groupe, critères ignorés — voir l'en-tête de fichier. */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <ChiffreCle
            valeur={nombre(repartitionTotale.total)}
            libelle={`${pluriel(repartitionTotale.total, 'appareil')} ${pluriel(repartitionTotale.total, 'rattaché')}`}
          />
          <ChiffreCle
            valeur={nombre(repartitionTotale.problemes)}
            libelle="En panne ou à l'arrêt"
            ton={repartitionTotale.problemes > 0 ? 'alerte' : 'bon'}
          />
          <ChiffreCle valeur={`${repartitionTotale.disponibilitePourcent} %`} libelle="Disponibilité" ton="bon" />
        </div>

        <div className="mt-5 space-y-2">
          <BarreRepartition repartition={repartitionTotale} hauteur="h-2.5" />
          <CompteursStatuts repartition={repartitionTotale} lienStatut={lienStatutDuGroupe} taille="text-sm" />
        </div>
      </section>

      {/* Décalage entre l'état du groupe et ce que la liste montre. */}
      {masques > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">
            Les critères actifs masquent{' '}
            <span className="font-semibold tabular-nums">{nombre(masques)}</span>{' '}
            {pluriel(masques, 'appareil')} de ce {definition.libelle.toLowerCase()}.
          </p>
          <Link
            href={lienGroupe(dimension, valeur)}
            className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Voir les {nombre(tous.length)} {pluriel(tous.length, 'appareil')} du {definition.libelle.toLowerCase()}
          </Link>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">Appareils</h2>
          <p className="text-sm text-gray-500">
            {nombre(appareils.length)} {pluriel(appareils.length, 'appareil')}
            {masques > 0 && ` sur ${nombre(tous.length)}`}
          </p>
        </div>

        {appareils.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-sm font-medium text-gray-700">Aucun appareil ne correspond aux critères actifs.</p>
            <p className="mt-1 text-sm text-gray-500">
              Retirez un critère dans le fil d&apos;Ariane pour élargir la sélection.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-4 py-2.5">Code</th>
                  <th scope="col" className="px-4 py-2.5">Appareil</th>
                  <th scope="col" className="px-4 py-2.5">Adresse</th>
                  <th scope="col" className="px-4 py-2.5">Ville</th>
                  <th scope="col" className="px-4 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appareils.map((appareil) => (
                  <tr key={appareil.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <LienAppareil ascenseurId={appareil.id} className="font-mono text-xs font-medium">
                        {appareil.code}
                      </LienAppareil>
                    </td>
                    <td className="px-4 py-2.5">
                      {appareil.nom ? (
                        <LienAppareil ascenseurId={appareil.id} ton="sobre">
                          {appareil.nom}
                        </LienAppareil>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{appareil.adresseComplete}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {dimension === 'ville' ? (
                        <span className="text-gray-600">{appareil.ville}</span>
                      ) : (
                        <LienVille id={appareil.ville} filtres={filtres} ton="sobre">
                          {appareil.ville}
                        </LienVille>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Link
                        href={lienGroupe(dimension, valeur, { ...filtres, statut: appareil.statutAppareil })}
                        className="inline-flex items-center gap-1.5 rounded text-gray-700 underline-offset-2 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <PastilleStatut statut={appareil.statutAppareil} />
                        {LIBELLE_STATUT_APPAREIL[appareil.statutAppareil]}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
