/**
 * Onglet CTQ / Réserves de la fiche appareil (section 4.2).
 */

import { ControleCTQ, ReserveCTQ } from '@/domain/types';
import { getBureauEtudesById } from '@/data/store';
import { StatutControleCTQBadge, StatutReserveBadge, GraviteReserveBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';

interface CtqTabProps {
  controles: ControleCTQ[];
  reserves: ReserveCTQ[];
}

export default function CtqTab({ controles, reserves }: CtqTabProps) {
  const controlesTries = [...controles].sort((a, b) => new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime());
  const reservesTriees = [...reserves].sort((a, b) => new Date(b.dateConstat).getTime() - new Date(a.dateConstat).getTime());

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Contrôles techniques quinquennaux</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Numéro', 'Date de visite', 'Prochain contrôle', "Bureau d'études", 'Statut', 'Réserves'].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {controlesTries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucun contrôle CTQ enregistré pour cet appareil.
                </td>
              </tr>
            )}
            {controlesTries.map((controle) => (
              <tr key={controle.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{controle.numero}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(controle.dateVisite))}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(controle.dateProchainControle))}</td>
                <td className="px-4 py-3 whitespace-nowrap">{getBureauEtudesById(controle.bureauEtudesId)?.nom ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatutControleCTQBadge statut={controle.statut} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {controle.nombreReservesSoldees} / {controle.nombreReserves}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Réserves</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Numéro', 'Description', 'Gravité', 'Statut', 'Constatée le', 'Échéance'].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reservesTriees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucune réserve CTQ en cours pour cet appareil.
                </td>
              </tr>
            )}
            {reservesTriees.map((reserve) => (
              <tr key={reserve.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{reserve.numero}</td>
                <td className="px-4 py-3 max-w-[320px] truncate" title={reserve.description}>
                  {reserve.description}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <GraviteReserveBadge gravite={reserve.gravite} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatutReserveBadge statut={reserve.statut} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(reserve.dateConstat))}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {reserve.dateEcheance ? formatDate(new Date(reserve.dateEcheance)) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
