/**
 * Onglet Maintenances de la fiche appareil (section 4.2) : calendrier
 * annuel (périodique/câble/parachute/nettoyage), dates prévues/réalisées,
 * retards et rapports associés.
 */

import Link from 'next/link';
import { Maintenance } from '@/domain/types';
import type { HistoriqueMaintenanceAgregat } from '@/data/store';
import { CategorieMaintenanceBadge, StatutMaintenanceBadge, PrioriteAffichageMaintenanceBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';

interface MaintenancesTabProps {
  maintenances: Maintenance[];
  historique?: HistoriqueMaintenanceAgregat;
}

export default function MaintenancesTab({ maintenances, historique }: MaintenancesTabProps) {
  const lignes = [...maintenances]
    .map((m) => enrichirMaintenance(m))
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime());

  return (
    <div className="space-y-6">
      {historique && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Historique — années couvertes</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{historique.anneesCouvertes}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Maintenances réalisées (années précédentes)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{historique.totalRealisees}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Maintenances annulées (années précédentes)</p>
            <p className="mt-1 text-2xl font-bold text-gray-500">{historique.totalAnnulees}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Catégories', 'Date prévue', 'Date réalisée', 'Statut', 'Planning', 'Rapport'].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lignes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucune maintenance planifiée cette année pour cet appareil.
                </td>
              </tr>
            )}
            {lignes.map((maintenance) => (
              <tr key={maintenance.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {maintenance.categories.map((categorie) => (
                      <CategorieMaintenanceBadge key={categorie} categorie={categorie} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(maintenance.datePrevue))}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {maintenance.dateRealisee ? formatDate(new Date(maintenance.dateRealisee)) : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatutMaintenanceBadge statut={maintenance.statut} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {maintenance.prioriteAffichage ? (
                    <span className="inline-flex items-center gap-2">
                      <PrioriteAffichageMaintenanceBadge priorite={maintenance.prioriteAffichage} />
                      {maintenance.retardJours > 0 && (
                        <span className="text-xs text-rose-600">
                          {maintenance.retardJours} j
                        </span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {maintenance.rapportId ? (
                    <Link href={`/rapports/${maintenance.rapportId}`} className="text-blue-600 hover:underline">
                      Voir le rapport
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
