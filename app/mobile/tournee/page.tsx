/**
 * Ma tournée (section 20) — liste des appareils assignés au technicien
 * connecté aujourd'hui : ceux dont il est titulaire, ceux de sa tournée, et
 * ceux portant une intervention/maintenance qui lui a été assignée même
 * hors de son périmètre habituel (réaffectation ponctuelle, section 34).
 * Server Component : lecture directe du store, filtres/pagination pilotés
 * par les query params (?filtre=...&page=...), comme app/parc/page.tsx.
 */

import Link from 'next/link';
import { AlertTriangle, ChevronRight, ListChecks, MapPin, Wrench } from 'lucide-react';
import { getSessionActiveDuTechnicien, getTechnicienById } from '@/data/store';
import { EtatConnexionMobile } from '@/domain/types';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import {
  FILTRES_TOURNEE_MOBILE,
  filtrerArretsTournee,
  getArretsTourneeTechnicien,
  type ArretTourneeMobile,
  type FiltreTourneeMobile,
} from '@/lib/derived/tournee-mobile';
import { paginerLignes } from '@/lib/derived/parc-liste';
import BandeauConnexion from '../components/BandeauConnexion';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE = 20;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

function estFiltreValide(v: string | undefined): v is FiltreTourneeMobile {
  return FILTRES_TOURNEE_MOBILE.some((f) => f.value === v);
}

interface TourneePageProps {
  searchParams: SearchParamsRecord;
}

export default function TourneePage({ searchParams }: TourneePageProps) {
  const technicienId = getTechnicienConnecteId();
  const technicien = getTechnicienById(technicienId);
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;

  const filtreParam = param(searchParams, 'filtre');
  const filtreActif: FiltreTourneeMobile = estFiltreValide(filtreParam) ? filtreParam : 'aujourdhui';
  const page = Number(param(searchParams, 'page') ?? '1') || 1;

  const tousLesArrets = getArretsTourneeTechnicien(technicienId);
  const arretsFiltres = filtrerArretsTournee(tousLesArrets, filtreActif);
  const { lignesPage, pageActuelle, totalPages, total } = paginerLignes(arretsFiltres, page, TAILLE_PAGE);

  return (
    <div className="flex flex-col min-h-full">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-blue-600" />
          Ma tournée
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {technicien?.nomComplet ?? 'Technicien'} · {tousLesArrets.length} appareil{tousLesArrets.length > 1 ? 's' : ''} au total
        </p>
      </div>

      <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto">
        {FILTRES_TOURNEE_MOBILE.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'aujourdhui' ? '/mobile/tournee' : `/mobile/tournee?filtre=${f.value}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtreActif === f.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 px-4 pb-4 space-y-2.5">
        {total === 0 && <p className="text-sm text-gray-500 text-center py-10">Aucun appareil pour ce filtre.</p>}

        {lignesPage.map((arret) => (
          <CarteArret key={arret.ascenseur.id} arret={arret} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="px-4 pb-4 flex items-center justify-between text-xs text-gray-500">
          <PaginationLien filtre={filtreActif} page={pageActuelle - 1} disabled={pageActuelle <= 1} label="◀ Précédent" />
          <span>
            Page {pageActuelle} / {totalPages}
          </span>
          <PaginationLien filtre={filtreActif} page={pageActuelle + 1} disabled={pageActuelle >= totalPages} label="Suivant ▶" />
        </div>
      )}
    </div>
  );
}

function PaginationLien({ filtre, page, disabled, label }: { filtre: FiltreTourneeMobile; page: number; disabled: boolean; label: string }) {
  if (disabled) return <span className="text-gray-300">{label}</span>;
  const params = new URLSearchParams();
  if (filtre !== 'aujourdhui') params.set('filtre', filtre);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return (
    <Link href={qs ? `/mobile/tournee?${qs}` : '/mobile/tournee'} className="font-medium text-blue-600">
      {label}
    </Link>
  );
}

function CarteArret({ arret }: { arret: ArretTourneeMobile }) {
  const { ascenseur } = arret;
  return (
    <Link href={`/mobile/appareils/${ascenseur.id}`} className="block bg-white rounded-lg border border-gray-200 p-3 active:bg-gray-50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{ascenseur.code}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{ascenseur.ville}</span>
            {arret.horsTourneeHabituelle && (
              <span className="ml-1 shrink-0 rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[10px] font-medium">
                Hors tournée
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge statut={ascenseur.statutAppareil} />
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>
      </div>

      {arret.interventionOuverte && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-xs rounded-md px-2 py-1 ${
            arret.interventionEnRetard ? 'bg-rose-50 text-rose-700' : 'bg-cyan-50 text-cyan-700'
          }`}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Intervention : {arret.interventionLibelle}
            {arret.interventionEnRetard ? ' — SLA dépassé' : ''}
          </span>
        </div>
      )}

      {arret.maintenancePrevue && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-xs rounded-md px-2 py-1 ${
            arret.maintenanceEnRetard ? 'bg-rose-50 text-rose-700' : arret.maintenanceCetteSemaine ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
          }`}
        >
          <Wrench className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Maintenance : {arret.maintenanceLibelle} — {formatDate(new Date(arret.maintenancePrevue.datePrevue))}
          </span>
        </div>
      )}
    </Link>
  );
}
