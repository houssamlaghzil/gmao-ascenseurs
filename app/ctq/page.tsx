/**
 * Liste des contrôles CTQ (section 10.1). Server Component : lecture directe
 * du store via lib/derived/ctq-liste.ts, filtres/pagination pilotés par les
 * query params (?statut=...&client=...&technicien=...&page=...) — même
 * convention que app/interventions/page.tsx.
 */

import { ShieldCheck } from 'lucide-react';
import { StatutControleCTQ } from '@/domain/types';
import {
  filtrerLignesControlesCTQ,
  getLignesControlesCTQ,
  getOptionsClientsTechniciensCTQ,
  type FiltresControlesCTQUI,
} from '@/lib/derived/ctq-liste';
import { paginerLignes } from '@/lib/derived/parc-liste';
import CtqNavTabs from './components/CtqNavTabs';
import FiltresControlesCTQForm from './components/FiltresControlesCTQForm';
import TableauControlesCTQ from './components/TableauControlesCTQ';
import PaginationCTQ from './components/PaginationCTQ';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE = 50;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface CtqPageProps {
  searchParams: SearchParamsRecord;
}

export default function CtqPage({ searchParams }: CtqPageProps) {
  const filtres: FiltresControlesCTQUI = {
    statut: param(searchParams, 'statut') as StatutControleCTQ | undefined,
    clientId: param(searchParams, 'client'),
    technicienId: param(searchParams, 'technicien'),
  };
  const pageDemandee = Number(param(searchParams, 'page') ?? '1') || 1;

  const toutesLesLignes = getLignesControlesCTQ();
  const lignesFiltrees = filtrerLignesControlesCTQ(toutesLesLignes, filtres);
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
          {total.toLocaleString('fr-FR')} contrôle{total > 1 ? 's' : ''} technique{total > 1 ? 's' : ''} quinquenna
          {total > 1 ? 'ux' : 'l'}
          {total !== toutesLesLignes.length ? ` sur ${toutesLesLignes.length.toLocaleString('fr-FR')} au total` : ' au total'}
        </p>
      </div>

      <CtqNavTabs actif="controles" />

      <FiltresControlesCTQForm clients={clients} techniciens={techniciens} />

      <TableauControlesCTQ lignes={lignesPage} />

      <PaginationCTQ basePath="/ctq" searchParams={searchParams} pageActuelle={pageActuelle} totalPages={totalPages} />
    </div>
  );
}
