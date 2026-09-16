/**
 * Liste des réserves CTQ (section 10.3), consultable indépendamment des
 * contrôles. Server Component : lecture directe du store via
 * lib/derived/reserves-ctq-liste.ts, filtres/pagination pilotés par les
 * query params (?statut=...&gravite=...&client=...&technicien=...&retard=1&page=...).
 */

import { ShieldCheck } from 'lucide-react';
import { GraviteReserve, StatutReserve } from '@/domain/types';
import {
  filtrerLignesReservesCTQ,
  getLignesReservesCTQ,
  type FiltresReservesCTQUI,
} from '@/lib/derived/reserves-ctq-liste';
import { getOptionsClientsTechniciensCTQ } from '@/lib/derived/ctq-liste';
import { paginerLignes } from '@/lib/derived/parc-liste';
import CtqNavTabs from '../components/CtqNavTabs';
import PaginationCTQ from '../components/PaginationCTQ';
import FiltresReservesCTQForm from './components/FiltresReservesCTQForm';
import TableauReservesCTQ from './components/TableauReservesCTQ';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE = 50;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface ReservesCtqPageProps {
  searchParams: SearchParamsRecord;
}

export default function ReservesCtqPage({ searchParams }: ReservesCtqPageProps) {
  const filtres: FiltresReservesCTQUI = {
    statut: param(searchParams, 'statut') as StatutReserve | undefined,
    gravite: param(searchParams, 'gravite') as GraviteReserve | undefined,
    clientId: param(searchParams, 'client'),
    technicienId: param(searchParams, 'technicien'),
    enRetard: param(searchParams, 'retard') === '1',
  };
  const pageDemandee = Number(param(searchParams, 'page') ?? '1') || 1;

  const toutesLesLignes = getLignesReservesCTQ();
  const lignesFiltrees = filtrerLignesReservesCTQ(toutesLesLignes, filtres);
  const { lignesPage, pageActuelle, totalPages, total } = paginerLignes(lignesFiltrees, pageDemandee, TAILLE_PAGE);
  const { clients, techniciens } = getOptionsClientsTechniciensCTQ();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          CTQ / Réserves
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {total.toLocaleString('fr-FR')} réserve{total > 1 ? 's' : ''}
          {total !== toutesLesLignes.length ? ` sur ${toutesLesLignes.length.toLocaleString('fr-FR')} au total` : ' au total'}
        </p>
      </div>

      <CtqNavTabs actif="reserves" />

      <FiltresReservesCTQForm clients={clients} techniciens={techniciens} />

      <TableauReservesCTQ lignes={lignesPage} />

      <PaginationCTQ basePath="/ctq/reserves" searchParams={searchParams} pageActuelle={pageActuelle} totalPages={totalPages} />
    </div>
  );
}
