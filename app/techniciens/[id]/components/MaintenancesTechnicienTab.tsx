/**
 * Onglet Maintenances de la fiche technicien (section 12) : un technicien
 * titulaire d'une grande tournée peut porter plusieurs milliers de passages
 * sur l'année — paginé (contrairement à l'onglet Maintenances d'une fiche
 * appareil, dont le volume par appareil reste faible).
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Maintenance } from '@/domain/types';
import { getAscenseurById } from '@/data/store';
import { CategorieMaintenanceBadge, StatutMaintenanceBadge, PrioriteAffichageMaintenanceBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';

interface MaintenancesTechnicienTabProps {
  technicienId: string;
  maintenances: Maintenance[];
  pageActuelle: number;
  totalPages: number;
  total: number;
}

export default function MaintenancesTechnicienTab({
  technicienId,
  maintenances,
  pageActuelle,
  totalPages,
  total,
}: MaintenancesTechnicienTabProps) {
  const lignes = maintenances.map((m) => enrichirMaintenance(m));
  const hrefPourPage = (page: number) => `/techniciens/${technicienId}?onglet=maintenances&pageMaintenances=${page}`;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Appareil', 'Catégories', 'Date prévue', 'Date réalisée', 'Statut', 'Priorité', 'Rapport'].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lignes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Aucune maintenance affectée à ce technicien.
                </td>
              </tr>
            )}
            {lignes.map((maintenance) => {
              const ascenseur = getAscenseurById(maintenance.ascenseurId);
              return (
                <tr key={maintenance.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {ascenseur ? (
                      <Link href={`/appareils/${ascenseur.id}`} className="text-blue-600 hover:underline">
                        {ascenseur.code}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
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
                        {maintenance.retardJours > 0 && <span className="text-xs text-rose-600">{maintenance.retardJours} j</span>}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {maintenance.rapportId ? (
                      <Link href={`/rapports/${maintenance.rapportId}`} className="text-blue-600 hover:underline">
                        Voir
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          {pageActuelle <= 1 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </span>
          ) : (
            <Link href={hrefPourPage(pageActuelle - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {pageActuelle} / {totalPages} — {total.toLocaleString('fr-FR')} maintenances
          </span>
          {pageActuelle >= totalPages ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed">
              Suivant <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <Link href={hrefPourPage(pageActuelle + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50">
              Suivant <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
