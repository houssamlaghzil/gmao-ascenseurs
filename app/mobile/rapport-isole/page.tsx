/**
 * Rapport isolé (section 33) : créer un rapport pour un appareil hors
 * tournée, sans intervention ni maintenance préexistante — ex. appareil
 * croisé au fil d'une autre visite. Recherche d'appareil identique dans
 * l'esprit à app/mobile/recherche (mais rendue ici en Server Component
 * autonome pour ne pas dépendre d'une route qu'un autre agent construit),
 * ou résolution directe via ?appareilId= pour un lien entrant déjà résolu
 * (ex. depuis la fiche appareil).
 */

import Link from 'next/link';
import { Search } from 'lucide-react';
import { EtatConnexionMobile } from '@/domain/types';
import { getAllAscenseurs, getAllPhotosRapport, getAscenseurById, getReglesObligationPhotos, getSessionActiveDuTechnicien } from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import StatusBadge from '@/components/StatusBadge';
import RapportIsoleWizard from './RapportIsoleWizard';

export const dynamic = 'force-dynamic';

const LONGUEUR_MIN_RECHERCHE = 2;
const NOMBRE_MAX_RESULTATS = 20;
const TAILLE_POOL_PHOTOS = 12;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

interface RapportIsolePageProps {
  searchParams: SearchParamsRecord;
}

function premierParam(valeur: string | string[] | undefined): string {
  return (Array.isArray(valeur) ? valeur[0] : valeur ?? '').trim();
}

export default function RapportIsolePage({ searchParams }: RapportIsolePageProps) {
  const technicien = getTechnicienConnecte();
  const etatConnexion = getSessionActiveDuTechnicien(technicien.id)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;

  const appareilId = premierParam(searchParams.appareilId);
  const ascenseur = appareilId ? getAscenseurById(appareilId) : undefined;

  if (!ascenseur) {
    const q = premierParam(searchParams.q);
    const qNormalise = q.toLowerCase();
    const rechercheLancee = qNormalise.length >= LONGUEUR_MIN_RECHERCHE;
    const resultats = rechercheLancee
      ? getAllAscenseurs()
          .filter(
            (a) =>
              a.code.toLowerCase().includes(qNormalise) ||
              a.adresseComplete.toLowerCase().includes(qNormalise) ||
              a.ville.toLowerCase().includes(qNormalise)
          )
          .slice(0, NOMBRE_MAX_RESULTATS)
      : [];

    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />

        <div className="px-4 pb-2 pt-4">
          <h1 className="text-lg font-semibold text-gray-900">Rapport isolé</h1>
          <p className="mt-0.5 text-xs text-gray-500">Créez un rapport pour un appareil visité hors tournée.</p>
        </div>

        <div className="px-4 pb-3">
          <form action="/mobile/rapport-isole" method="GET" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Code, adresse, ville…"
              autoFocus
              className="w-full rounded-md border border-gray-300 py-2.5 pl-9 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
              Rechercher
            </button>
          </form>
        </div>

        <div className="flex-1 space-y-2.5 px-4 pb-6">
          {!rechercheLancee && (
            <p className="py-10 text-center text-sm text-gray-500">
              Saisissez au moins {LONGUEUR_MIN_RECHERCHE} caractères pour rechercher un appareil.
            </p>
          )}
          {rechercheLancee && resultats.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">Aucun appareil trouvé pour « {q} ».</p>
          )}
          {resultats.map((a) => (
            <Link
              key={a.id}
              href={`/mobile/rapport-isole?appareilId=${a.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{a.code}</p>
                  <p className="truncate text-xs text-gray-500">{a.adresseComplete}</p>
                  <p className="text-xs text-gray-500">{a.ville}</p>
                </div>
                <StatusBadge statut={a.statutAppareil} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const poolPhotos = Array.from(new Set(getAllPhotosRapport().map((p) => p.url))).slice(0, TAILLE_POOL_PHOTOS);
  const regles = getReglesObligationPhotos();

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">
            {ascenseur.adresseComplete} — {ascenseur.ville}
          </p>
          <h1 className="text-lg font-semibold text-gray-900">{ascenseur.code}</h1>
        </div>
        <Link href="/mobile/rapport-isole" className="mt-1 shrink-0 text-[11px] text-gray-400 underline underline-offset-2">
          Changer d&apos;appareil
        </Link>
      </div>

      <RapportIsoleWizard
        ascenseurId={ascenseur.id}
        technicienNom={technicien.nomComplet}
        poolPhotos={poolPhotos}
        regles={regles}
        etatConnexion={etatConnexion}
      />
    </div>
  );
}
