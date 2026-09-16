/**
 * Réserves CTQ affectées au technicien connecté (section 32 — "missions
 * CTQ mobiles"). Chaque carte laisse assez de place pour lire la
 * description et l'action attendue en entier (pas de troncature), et
 * propose un bouton qui avance le statut de la réserve d'un cran, selon le
 * statut courant :
 *   A_TRAITER      → (aucune action mobile, en attente de planification)
 *   PLANIFIEE      → "Démarrer le traitement" (demarrerTraitementReserve)
 *   EN_COURS       → capture photo(s) + "Déclarer traitée" (declarerReserveTraitee,
 *                    exige au moins une photo "après traitement")
 *   TRAITEE        → "Soumettre pour contre-visite" (soumettreReservePourControle)
 *   A_CONTROLER / VALIDEE → lecture seule (suite du cycle hors mobile)
 *
 * Accepte un `?appareilId=` (venant de la fiche appareil mobile, bouton
 * "Voir les réserves") pour filtrer sur un seul appareil.
 */

import Link from 'next/link';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { EtatConnexionMobile, GraviteReserve, ReserveCTQ, StatutReserve } from '@/domain/types';
import {
  getAllPhotosRapport,
  getAscenseurById,
  getClientById,
  getPhotoRapportById,
  getReservesCTQByTechnicienId,
  getSessionActiveDuTechnicien,
} from '@/data/store';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import { libelleBlocReserve } from '@/lib/derived/libelles-ctq';
import { LIBELLE_CATEGORIE_PHOTO } from '@/lib/derived/libelles-rapports';
import { formatDate } from '@/lib/utils';
import { GraviteReserveBadge, StatutReserveBadge } from '@/components/StatusBadges';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import { demarrerTraitement, soumettrePourControle } from './actions';
import ReserveTraitementForm from './components/ReserveTraitementForm';

export const dynamic = 'force-dynamic';

const TAILLE_POOL_PHOTOS = 12;
const ORDRE_GRAVITE: Record<GraviteReserve, number> = {
  [GraviteReserve.CRITIQUE]: 0,
  [GraviteReserve.MAJEURE]: 1,
  [GraviteReserve.MINEURE]: 2,
};

interface CtqMobilePageProps {
  searchParams: { appareilId?: string };
}

function PhotosGrille({ ids, texteVide }: { ids: string[]; texteVide: string }) {
  const photos = ids.map((id) => getPhotoRapportById(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (photos.length === 0) return <p className="text-[11px] text-gray-400">{texteVide}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((photo) => (
        <div key={photo.id} className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={LIBELLE_CATEGORIE_PHOTO[photo.categorie]} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function CarteReserve({ reserve, poolPhotos }: { reserve: ReserveCTQ; poolPhotos: string[] }) {
  const ascenseur = getAscenseurById(reserve.appareilId);
  const client = getClientById(reserve.clientId);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">{ascenseur ? `${ascenseur.code} — ${ascenseur.ville}` : reserve.appareilId}</p>
          <p className="text-sm font-semibold text-gray-900">{reserve.numero}</p>
          {client && <p className="truncate text-xs text-gray-400">{client.raisonSociale}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <GraviteReserveBadge gravite={reserve.gravite} />
          <StatutReserveBadge statut={reserve.statut} />
        </div>
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">{libelleBlocReserve(reserve.libelleBloc)}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-800">{reserve.description}</p>

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500">Action attendue</p>
        <p className="text-sm leading-relaxed text-gray-800">{reserve.actionDemandee}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {reserve.localisation && (
          <div>
            <p className="text-gray-400">Localisation</p>
            <p className="text-gray-700">{reserve.localisation}</p>
          </div>
        )}
        {reserve.dateEcheance && (
          <div>
            <p className="text-gray-400">Échéance</p>
            <p className="text-gray-700">{formatDate(new Date(reserve.dateEcheance))}</p>
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs font-medium text-gray-500">Photo de constat</p>
        <PhotosGrille ids={reserve.photosConstatIds} texteVide="Aucune photo de constat." />
      </div>

      {reserve.commentaireTechnicien && (
        <p className="mt-3 rounded-md bg-gray-50 px-2.5 py-2 text-xs italic text-gray-600">« {reserve.commentaireTechnicien} »</p>
      )}

      <div className="mt-3">
        {reserve.statut === StatutReserve.A_TRAITER && (
          <p className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            En attente de planification par le bureau d&apos;études.
          </p>
        )}

        {reserve.statut === StatutReserve.PLANIFIEE && (
          <form action={demarrerTraitement}>
            <input type="hidden" name="reserveId" value={reserve.id} />
            <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700">
              Démarrer le traitement
            </button>
          </form>
        )}

        {reserve.statut === StatutReserve.EN_COURS && <ReserveTraitementForm reserveId={reserve.id} poolPhotos={poolPhotos} />}

        {reserve.statut === StatutReserve.TRAITEE && (
          <>
            <p className="mb-2 text-xs font-medium text-gray-500">Photo(s) après traitement</p>
            <PhotosGrille ids={reserve.photosTraitementIds} texteVide="Aucune photo." />
            <form action={soumettrePourControle} className="mt-2">
              <input type="hidden" name="reserveId" value={reserve.id} />
              <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white active:bg-indigo-700">
                Soumettre pour contre-visite
              </button>
            </form>
          </>
        )}

        {reserve.statut === StatutReserve.A_CONTROLER && (
          <p className="flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-2 text-xs text-purple-700">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            En attente de la contre-visite du bureau d&apos;études.
          </p>
        )}

        {reserve.statut === StatutReserve.VALIDEE && (
          <p className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Réserve validée.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CtqMobilePage({ searchParams }: CtqMobilePageProps) {
  const technicienId = getTechnicienConnecteId();
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;
  const appareilId = searchParams.appareilId;

  let reserves = getReservesCTQByTechnicienId(technicienId);
  if (appareilId) reserves = reserves.filter((r) => r.appareilId === appareilId);

  reserves = [...reserves].sort((a, b) => {
    const gravite = ORDRE_GRAVITE[a.gravite] - ORDRE_GRAVITE[b.gravite];
    if (gravite !== 0) return gravite;
    if (a.dateEcheance && b.dateEcheance) return new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime();
    if (a.dateEcheance) return -1;
    if (b.dateEcheance) return 1;
    return 0;
  });

  const poolPhotos = Array.from(new Set(getAllPhotosRapport().map((p) => p.url))).slice(0, TAILLE_POOL_PHOTOS);
  const ascenseurFiltre = appareilId ? getAscenseurById(appareilId) : undefined;

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <h1 className="text-lg font-semibold text-gray-900">Réserves CTQ</h1>
        <p className="text-xs text-gray-500">{reserves.length} réserve{reserves.length > 1 ? 's' : ''} affectée{reserves.length > 1 ? 's' : ''}</p>
      </div>

      {appareilId && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="truncate text-xs font-medium text-blue-700">Filtré sur {ascenseurFiltre?.code ?? appareilId}</p>
          <Link href="/mobile/ctq" className="shrink-0 text-[11px] font-medium text-blue-700 underline underline-offset-2">
            Tout afficher
          </Link>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
        {reserves.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <ShieldCheck className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-500">
              {appareilId ? 'Aucune réserve CTQ affectée sur cet appareil.' : 'Aucune réserve CTQ affectée pour le moment.'}
            </p>
          </div>
        ) : (
          reserves.map((reserve) => <CarteReserve key={reserve.id} reserve={reserve} poolPhotos={poolPhotos} />)
        )}
      </div>
    </div>
  );
}
