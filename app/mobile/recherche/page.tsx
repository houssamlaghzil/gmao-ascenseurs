/**
 * Recherche d'appareil mobile (section 21) : par code, adresse ou ville.
 * Un appareil trouvé hors de la tournée habituelle du technicien reste
 * consultable ("récupérer ponctuellement un appareil qui n'appartient pas à
 * la tournée") — signalé visuellement, sans persistance offline réelle.
 * Ne liste jamais tout le parc (~4 350 appareils) sans recherche saisie :
 * même esprit que app/api/recherche/route.ts côté web, mais rendu ici en
 * Server Component (formulaire GET natif, pas de JS nécessaire).
 */

import Link from 'next/link';
import { ChevronRight, MapPin, Search } from 'lucide-react';
import { getAllAscenseurs, getSessionActiveDuTechnicien } from '@/data/store';
import { EtatConnexionMobile } from '@/domain/types';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import { getAscenseursTourneeHabituelle } from '@/lib/derived/tournee-mobile';
import BandeauConnexion from '../components/BandeauConnexion';
import StatusBadge from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

const LONGUEUR_MIN_RECHERCHE = 2;
const NOMBRE_MAX_RESULTATS = 30;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

interface RecherchePageProps {
  searchParams: SearchParamsRecord;
}

export default function RecherchePage({ searchParams }: RecherchePageProps) {
  const technicienId = getTechnicienConnecteId();
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;

  const qParam = searchParams.q;
  const q = (Array.isArray(qParam) ? qParam[0] : qParam ?? '').trim();
  const qNormalise = q.toLowerCase();
  const rechercheLancee = qNormalise.length >= LONGUEUR_MIN_RECHERCHE;

  const ascenseursHabituels = getAscenseursTourneeHabituelle(technicienId);

  const resultatsComplets = rechercheLancee
    ? getAllAscenseurs().filter(
        (a) =>
          a.code.toLowerCase().includes(qNormalise) ||
          a.adresseComplete.toLowerCase().includes(qNormalise) ||
          a.ville.toLowerCase().includes(qNormalise)
      )
    : [];
  const resultats = resultatsComplets.slice(0, NOMBRE_MAX_RESULTATS);

  return (
    <div className="flex flex-col min-h-full">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Recherche
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Retrouver un appareil par code, adresse ou ville — y compris hors de votre tournée.</p>
      </div>

      <div className="px-4 pb-3">
        <form action="/mobile/recherche" method="GET" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Code, adresse, ville…"
            autoFocus
            className="w-full pl-9 pr-20 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md">
            Rechercher
          </button>
        </form>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-2.5">
        {!rechercheLancee && (
          <p className="text-sm text-gray-500 text-center py-10">
            Saisissez au moins {LONGUEUR_MIN_RECHERCHE} caractères pour lancer la recherche.
          </p>
        )}

        {rechercheLancee && resultats.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">Aucun appareil trouvé pour « {q} ».</p>
        )}

        {resultats.map((ascenseur) => {
          const dansTournee = ascenseursHabituels.has(ascenseur.id);
          return (
            <Link
              key={ascenseur.id}
              href={`/mobile/appareils/${ascenseur.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-3 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{ascenseur.code}</p>
                  <p className="text-xs text-gray-500 truncate">{ascenseur.adresseComplete}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" /> {ascenseur.ville}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge statut={ascenseur.statutAppareil} />
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>

              {!dansTournee && (
                <p className="mt-2 text-[11px] text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-2 py-1">
                  Hors de votre tournée habituelle — conservé localement pour le mode hors ligne.
                </p>
              )}
            </Link>
          );
        })}

        {rechercheLancee && resultatsComplets.length > resultats.length && (
          <p className="text-xs text-gray-400 text-center pt-1">
            {resultatsComplets.length - resultats.length} autre{resultatsComplets.length - resultats.length > 1 ? 's' : ''} résultat
            {resultatsComplets.length - resultats.length > 1 ? 's' : ''} — affinez votre recherche.
          </p>
        )}
      </div>
    </div>
  );
}
