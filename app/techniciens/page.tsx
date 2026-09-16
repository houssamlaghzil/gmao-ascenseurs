/**
 * Liste des techniciens (section 12). Server Component : lecture directe du
 * store via lib/derived/techniciens-liste.ts, filtres pilotés par les query
 * params (?recherche=...&secteur=...&actif=...) — même convention que
 * app/parc/page.tsx.
 */

import { Users } from 'lucide-react';
import { getAllSecteursGeographiques } from '@/data/store';
import { filtrerLignesTechniciens, getLignesTechniciens, type FiltresTechniciensUI } from '@/lib/derived/techniciens-liste';
import FiltresTechniciensForm from './components/FiltresTechniciensForm';
import TableauTechniciens from './components/TableauTechniciens';

export const dynamic = 'force-dynamic';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface TechniciensPageProps {
  searchParams: SearchParamsRecord;
}

export default function TechniciensPage({ searchParams }: TechniciensPageProps) {
  const filtres: FiltresTechniciensUI = {
    recherche: param(searchParams, 'recherche'),
    secteurId: param(searchParams, 'secteur'),
    actif: param(searchParams, 'actif') === 'archives' ? false : param(searchParams, 'actif') === 'actifs' ? true : undefined,
  };

  const toutesLesLignes = getLignesTechniciens();
  const lignesFiltrees = filtrerLignesTechniciens(toutesLesLignes, filtres);
  const secteurs = [...getAllSecteursGeographiques()].sort((a, b) => a.nom.localeCompare(b.nom)).map((s) => ({ id: s.id, label: s.nom }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Techniciens
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {lignesFiltrees.length.toLocaleString('fr-FR')} technicien{lignesFiltrees.length > 1 ? 's' : ''}
          {lignesFiltrees.length !== toutesLesLignes.length ? ` sur ${toutesLesLignes.length.toLocaleString('fr-FR')} au total` : ' au total'}
        </p>
      </div>

      <FiltresTechniciensForm secteurs={secteurs} />

      <TableauTechniciens lignes={lignesFiltrees} />
    </div>
  );
}
