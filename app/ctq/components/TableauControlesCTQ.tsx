/**
 * Tableau de la liste des contrôles CTQ (section 10.1) — composant de
 * présentation pur, reçoit une page déjà filtrée/triée.
 */

import Link from 'next/link';
import { StatutControleCTQBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import type { LigneControleCTQListe } from '@/lib/derived/ctq-liste';

export default function TableauControlesCTQ({ lignes }: { lignes: LigneControleCTQListe[] }) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        Aucun contrôle CTQ ne correspond à ces critères.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Contrôle', 'Appareil', 'Client', 'Date de visite', "Bureau d'études", 'Réserves', 'Statut', 'Technicien'].map((label) => (
              <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lignes.map((ligne) => (
            <tr key={ligne.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <Link href={`/ctq/${ligne.id}`} className="font-medium text-blue-600 hover:underline">
                  {ligne.numero}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.appareilCode}</td>
              <td className="px-4 py-3 max-w-[200px] truncate" title={ligne.clientNom}>
                {ligne.clientNom}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(ligne.dateVisite))}</td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.bureauEtudesNom}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {ligne.nombreReserves === 0 ? '—' : `${ligne.nombreReservesSoldees} / ${ligne.nombreReserves}`}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatutControleCTQBadge statut={ligne.statut} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.technicienNom ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
