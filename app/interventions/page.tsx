/**
 * Liste des interventions (section 7.1). Server Component : lecture directe
 * du store via lib/derived/interventions-liste.ts, filtres/pagination
 * pilotés par les query params (?statut=...&page=...) — même convention que
 * app/parc/page.tsx.
 */

import { Wrench } from 'lucide-react';
import { EtatSLA, PrioriteIntervention, SourceTicket, StatutIntervention } from '@/domain/types';
import {
  filtrerLignesInterventions,
  getLignesInterventions,
  getOptionsTechniciensInterventions,
  type FiltresInterventionsUI,
} from '@/lib/derived/interventions-liste';
import { paginerLignes } from '@/lib/derived/parc-liste';
import FiltresInterventionsForm from './components/FiltresInterventionsForm';
import TableauInterventions from './components/TableauInterventions';
import PaginationInterventions from './components/PaginationInterventions';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE = 50;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface InterventionsPageProps {
  searchParams: SearchParamsRecord;
}

export default function InterventionsPage({ searchParams }: InterventionsPageProps) {
  const filtres: FiltresInterventionsUI = {
    statut: param(searchParams, 'statut') as StatutIntervention | undefined,
    priorite: param(searchParams, 'priorite') as PrioriteIntervention | undefined,
    technicienId: param(searchParams, 'technicien'),
    etatSLA: param(searchParams, 'sla') as EtatSLA | undefined,
    source: param(searchParams, 'source') as SourceTicket | undefined,
  };
  const pageDemandee = Number(param(searchParams, 'page') ?? '1') || 1;

  const toutesLesLignes = getLignesInterventions();
  const lignesFiltrees = filtrerLignesInterventions(toutesLesLignes, filtres);
  const { lignesPage, pageActuelle, totalPages, total } = paginerLignes(lignesFiltrees, pageDemandee, TAILLE_PAGE);
  const techniciens = getOptionsTechniciensInterventions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          Interventions
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {total.toLocaleString('fr-FR')} intervention{total > 1 ? 's' : ''}
          {total !== toutesLesLignes.length ? ` sur ${toutesLesLignes.length.toLocaleString('fr-FR')} au total` : ' au total'}
        </p>
      </div>

      <FiltresInterventionsForm techniciens={techniciens} />

      <TableauInterventions lignes={lignesPage} />

      <PaginationInterventions searchParams={searchParams} pageActuelle={pageActuelle} totalPages={totalPages} />
    </div>
  );
}
