/**
 * Pagination du palier de décomposition.
 *
 * Décomposer 4 348 appareils par site donne 500 groupes : la page doit être
 * découpée, mais le tri par gravité fourni par `listerGroupes` fait que la
 * première page contient déjà tout ce qui brûle. La pagination est donc un
 * filet de sécurité pour l'exhaustivité, pas le mode de lecture principal —
 * d'où sa discrétion en bas d'écran.
 *
 * Les liens repassent par `serialiserFiltres`, donc changer de page ne perd
 * aucun critère.
 *
 * Server Component : de simples liens, aucun état.
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FiltresExploration, serialiserFiltres } from '@/lib/derived/explorer';

export const TAILLE_PAGE = 50;

/** `page=1` est omis : l'URL canonique d'un palier reste sans numéro de page. */
export function lienPage(base: string, filtres: FiltresExploration, page: number): string {
  const query = serialiserFiltres(filtres);
  if (page <= 1) return `${base}${query}`;
  return `${base}${query ? `${query}&` : '?'}page=${page}`;
}

/** Ramène une page demandée dans les bornes réelles du jeu de résultats. */
export function normaliserPage(brut: string | undefined, totalPages: number): number {
  const demandee = Number(brut ?? '1');
  if (!Number.isFinite(demandee)) return 1;
  return Math.min(Math.max(Math.trunc(demandee), 1), Math.max(totalPages, 1));
}

/**
 * Fenêtre de numéros : première, dernière, et les voisines immédiates de la
 * page courante ; `null` marque une coupure (rendue « … »).
 */
function fenetre(pageActuelle: number, totalPages: number): (number | null)[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = pageActuelle - 1; p <= pageActuelle + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const triees = Array.from(pages).sort((a, b) => a - b);

  const avecCoupures: (number | null)[] = [];
  let precedente = 0;
  for (const page of triees) {
    if (precedente && page - precedente > 1) avecCoupures.push(null);
    avecCoupures.push(page);
    precedente = page;
  }
  return avecCoupures;
}

const STYLE_BOUTON =
  'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
const STYLE_INACTIF = 'inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-gray-300';

export default function PaginationExploration({
  base,
  filtres,
  pageActuelle,
  totalPages,
  legende,
}: {
  base: string;
  filtres: FiltresExploration;
  pageActuelle: number;
  totalPages: number;
  /** Rappel du volume total, affiché même quand il n'y a qu'une page. */
  legende: string;
}) {
  if (totalPages <= 1) {
    return <p className="text-sm text-gray-500">{legende}</p>;
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4" aria-label="Pagination">
      <p className="text-sm text-gray-500">{legende}</p>

      <div className="flex items-center gap-1">
        {pageActuelle > 1 ? (
          <Link href={lienPage(base, filtres, pageActuelle - 1)} className={STYLE_BOUTON} rel="prev">
            <ChevronLeft className="h-4 w-4" aria-hidden /> Précédent
          </Link>
        ) : (
          <span className={STYLE_INACTIF}>
            <ChevronLeft className="h-4 w-4" aria-hidden /> Précédent
          </span>
        )}

        {fenetre(pageActuelle, totalPages).map((page, index) =>
          page === null ? (
            <span key={`coupure-${index}`} className="px-1 text-sm text-gray-300" aria-hidden>
              …
            </span>
          ) : page === pageActuelle ? (
            <span
              key={page}
              aria-current="page"
              className="inline-flex min-w-[2rem] justify-center rounded-md bg-gray-900 px-2 py-1.5 text-sm font-medium tabular-nums text-white"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={lienPage(base, filtres, page)}
              className="inline-flex min-w-[2rem] justify-center rounded-md px-2 py-1.5 text-sm tabular-nums text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {page}
            </Link>
          ),
        )}

        {pageActuelle < totalPages ? (
          <Link href={lienPage(base, filtres, pageActuelle + 1)} className={STYLE_BOUTON} rel="next">
            Suivant <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className={STYLE_INACTIF}>
            Suivant <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
