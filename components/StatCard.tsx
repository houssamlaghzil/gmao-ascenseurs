/**
 * Carte pour afficher des statistiques
 */

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  colorClass?: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  colorClass = 'text-primary-600',
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className={`${colorClass} opacity-80`}>{icon}</div>}
      </div>
    </div>
  );
}
