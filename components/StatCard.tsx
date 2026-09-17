/**
 * Carte pour afficher des statistiques.
 *
 * `href` est optionnel : sans lui, le rendu est celui d'origine (une simple
 * carte). Avec lui, toute la carte devient cliquable — c'est le cas du
 * tableau de bord, où chaque KPI mène à sa décomposition (voir
 * lib/derived/explorer.ts) — avec un état de survol net et un chevron
 * discret qui signale l'affordance sans surcharger la carte.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  colorClass?: string;
  subtitle?: string;
  href?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  colorClass = 'text-primary-600',
  subtitle,
  href,
}: StatCardProps) {
  const contenu = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {icon && <div className={`${colorClass} opacity-80`}>{icon}</div>}
    </div>
  );

  if (!href) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        {contenu}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group relative block bg-white rounded-lg border border-gray-200 p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      {contenu}
      <ChevronRight
        className="absolute bottom-3 right-3 h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-indigo-400"
        aria-hidden
      />
    </Link>
  );
}
