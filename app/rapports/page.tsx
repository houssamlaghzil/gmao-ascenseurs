/**
 * Liste des rapports (section 9.1). Server Component : lecture directe du
 * store via lib/derived/rapports-liste.ts, filtres/pagination pilotés par
 * les query params (?type=...&page=...) — même convention que
 * app/interventions/page.tsx. getAllRapports() ne renvoie que l'échantillon
 * curé (~340 objets complets) : getRapportsAgregatGlobal() fournit le total
 * réellement cumulé sur l'ensemble du parc (constante de configuration, non
 * matérialisée en mémoire — voir domain/types.ts, RapportsAgregatGlobal).
 */

import Link from 'next/link';
import { FileBarChart, Sparkles } from 'lucide-react';
import { RattachementRapport, StatutValidationRapport, TypeRapport } from '@/domain/types';
import { getRapportsAgregatGlobal } from '@/data/store';
import {
  filtrerLignesRapports,
  getLignesRapports,
  getOptionsFiltresRapports,
  type FiltresRapportsUI,
} from '@/lib/derived/rapports-liste';
import { paginerLignes } from '@/lib/derived/parc-liste';
import FiltresRapportsForm from './components/FiltresRapportsForm';
import TableauRapports from './components/TableauRapports';
import PaginationRapports from './components/PaginationRapports';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE = 50;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface RapportsPageProps {
  searchParams: SearchParamsRecord;
}

export default function RapportsPage({ searchParams }: RapportsPageProps) {
  const filtres: FiltresRapportsUI = {
    type: param(searchParams, 'type') as TypeRapport | undefined,
    ascenseurId: param(searchParams, 'appareil'),
    technicienId: param(searchParams, 'technicien'),
    clientId: param(searchParams, 'client'),
    date: param(searchParams, 'date'),
    interventionId: param(searchParams, 'intervention'),
    statutValidation: param(searchParams, 'statut') as StatutValidationRapport | undefined,
    rattachement: param(searchParams, 'rattachement') as RattachementRapport | undefined,
  };
  const pageDemandee = Number(param(searchParams, 'page') ?? '1') || 1;

  const toutesLesLignes = getLignesRapports();
  const lignesFiltrees = filtrerLignesRapports(toutesLesLignes, filtres);
  const { lignesPage, pageActuelle, totalPages, total } = paginerLignes(lignesFiltrees, pageDemandee, TAILLE_PAGE);
  const options = getOptionsFiltresRapports();
  const agregat = getRapportsAgregatGlobal();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-600" />
            Rapports
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {total.toLocaleString('fr-FR')} rapport{total > 1 ? 's' : ''}
            {total !== toutesLesLignes.length ? ` sur ${toutesLesLignes.length.toLocaleString('fr-FR')} détaillés` : ' détaillés'}
            {' '}sur {agregat.totalCumule.toLocaleString('fr-FR')} rapports cumulés (historique complet du parc)
          </p>
        </div>

        <Link
          href="/rapports/journalier"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-medium rounded-md hover:from-primary-700 hover:to-purple-700 transition-all shadow-md shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          Générer le rapport journalier IA
        </Link>
      </div>

      <FiltresRapportsForm options={options} />

      <TableauRapports lignes={lignesPage} />

      <PaginationRapports searchParams={searchParams} pageActuelle={pageActuelle} totalPages={totalPages} />
    </div>
  );
}
