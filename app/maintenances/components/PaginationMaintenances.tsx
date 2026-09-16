/**
 * Pagination d'un des 3 groupes de la vue prioritaire (section 6.2) —
 * composant serveur : de simples liens préservant les filtres actifs et la
 * pagination des 2 AUTRES groupes. `pageParam` distingue quel groupe est
 * paginé (pageRetard / pageSemaine / pageAVenir), les 3 étant indépendants.
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function hrefPourPage(searchParams: SearchParamsRecord, pageParam: string, page: number): string {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(searchParams)) {
    if (cle === pageParam || valeur === undefined) continue;
    const v = Array.isArray(valeur) ? valeur[0] : valeur;
    if (v) params.set(cle, v);
  }
  params.set('onglet', 'prioritaire');
  if (page > 1) params.set(pageParam, String(page));
  const qs = params.toString();
  return qs ? `/maintenances?${qs}` : '/maintenances';
}

interface PaginationMaintenancesProps {
  searchParams: SearchParamsRecord;
  pageParam: string;
  pageActuelle: number;
  totalPages: number;
}

export default function PaginationMaintenances({ searchParams, pageParam, pageActuelle, totalPages }: PaginationMaintenancesProps) {
  if (totalPages <= 1) return null;

  const estPremiere = pageActuelle <= 1;
  const estDerniere = pageActuelle >= totalPages;

  return (
    <div className="flex items-center justify-between pt-2">
      {estPremiere ? (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" /> Précédent
        </span>
      ) : (
        <Link
          href={hrefPourPage(searchParams, pageParam, pageActuelle - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </Link>
      )}

      <span className="text-sm text-gray-500">
        Page {pageActuelle} / {totalPages}
      </span>

      {estDerniere ? (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed">
          Suivant <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={hrefPourPage(searchParams, pageParam, pageActuelle + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
