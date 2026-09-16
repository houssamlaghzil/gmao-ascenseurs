/**
 * Pagination partagée par les deux listes CTQ (/ctq et /ctq/reserves) — de
 * simples liens préservant les filtres actifs dans la query string. Même
 * convention que app/interventions/components/PaginationInterventions.tsx,
 * paramétrée par `basePath` puisqu'elle est réutilisée sur deux routes.
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function hrefPourPage(basePath: string, searchParams: SearchParamsRecord, page: number): string {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(searchParams)) {
    if (cle === 'page' || valeur === undefined) continue;
    const v = Array.isArray(valeur) ? valeur[0] : valeur;
    if (v) params.set(cle, v);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

interface PaginationCTQProps {
  basePath: string;
  searchParams: SearchParamsRecord;
  pageActuelle: number;
  totalPages: number;
}

export default function PaginationCTQ({ basePath, searchParams, pageActuelle, totalPages }: PaginationCTQProps) {
  if (totalPages <= 1) return null;

  const estPremiere = pageActuelle <= 1;
  const estDerniere = pageActuelle >= totalPages;

  return (
    <div className="flex items-center justify-between">
      {estPremiere ? (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" /> Précédent
        </span>
      ) : (
        <Link
          href={hrefPourPage(basePath, searchParams, pageActuelle - 1)}
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
          href={hrefPourPage(basePath, searchParams, pageActuelle + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
