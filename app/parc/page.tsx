/**
 * Liste des appareils (section 4.1) — remplace app/parcs, app/ascenseurs,
 * app/board et app/gestion. Server Component : lecture directe du store,
 * filtres/pagination pilotés par les query params (?statut=...&page=...).
 */

import { Building2 } from 'lucide-react';
import { StatutAppareil, CategorieMaintenance } from '@/domain/types';
import {
  getLignesAppareils,
  filtrerLignesAppareils,
  paginerLignes,
  getOptionsFiltresAppareils,
  type FiltresAppareilsUI,
} from '@/lib/derived/parc-liste';
import FiltresAppareilsForm from './components/FiltresAppareilsForm';
import TableauAppareils from './components/TableauAppareils';
import PaginationAppareils from './components/PaginationAppareils';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE = 50;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface ParcPageProps {
  searchParams: SearchParamsRecord;
}

export default function ParcPage({ searchParams }: ParcPageProps) {
  const filtres: FiltresAppareilsUI = {
    statut: param(searchParams, 'statut') as StatutAppareil | undefined,
    clientId: param(searchParams, 'client'),
    contratId: param(searchParams, 'contrat'),
    technicienId: param(searchParams, 'technicien'),
    tourneeId: param(searchParams, 'tournee'),
    ville: param(searchParams, 'ville'),
    secteurId: param(searchParams, 'secteur'),
    typeMaintenance: param(searchParams, 'typeMaintenance') as CategorieMaintenance | undefined,
    enRetard: param(searchParams, 'retard') === '1',
    modeDegrade: param(searchParams, 'degrade') === '1',
    recherche: param(searchParams, 'q'),
  };
  const pageDemandee = Number(param(searchParams, 'page') ?? '1') || 1;

  const toutesLesLignes = getLignesAppareils();
  const lignesFiltrees = filtrerLignesAppareils(toutesLesLignes, filtres);
  const { lignesPage, pageActuelle, totalPages, total } = paginerLignes(lignesFiltrees, pageDemandee, TAILLE_PAGE);
  const options = getOptionsFiltresAppareils();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          Parc d&apos;appareils
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {total.toLocaleString('fr-FR')} appareil{total > 1 ? 's' : ''}
          {total !== toutesLesLignes.length ? ` sur ${toutesLesLignes.length.toLocaleString('fr-FR')} au total` : ' au total'}
        </p>
      </div>

      <FiltresAppareilsForm options={options} />

      <TableauAppareils lignes={lignesPage} />

      <PaginationAppareils searchParams={searchParams} pageActuelle={pageActuelle} totalPages={totalPages} />
    </div>
  );
}
