/**
 * Tableau de la liste des réserves CTQ (section 10.3) — composant de
 * présentation pur, reçoit une page déjà filtrée/triée. Chaque ligne pointe
 * vers le contrôle parent (/ctq/{controleId}#reserve-{id}) pour retrouver le
 * contexte complet (bloc, point de contrôle) sans dupliquer une page détail.
 */

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { GraviteReserveBadge, StatutReserveBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import type { LigneReserveCTQListe } from '@/lib/derived/reserves-ctq-liste';

export default function TableauReservesCTQ({ lignes }: { lignes: LigneReserveCTQListe[] }) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        Aucune réserve CTQ ne correspond à ces critères.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Réserve', 'Appareil', 'Client', 'Bloc', 'Description', 'Gravité', 'Statut', 'Constatée le', 'Échéance', 'Technicien'].map((label) => (
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
                <Link href={`/ctq/${ligne.controleId}#reserve-${ligne.id}`} className="font-medium text-blue-600 hover:underline">
                  {ligne.numero}
                </Link>
                <div className="text-xs text-gray-400 mt-0.5">{ligne.controleNumero}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.appareilCode}</td>
              <td className="px-4 py-3 max-w-[160px] truncate" title={ligne.clientNom}>
                {ligne.clientNom}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.libelleBloc}</td>
              <td className="px-4 py-3 max-w-[280px] truncate" title={ligne.description}>
                {ligne.description}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <GraviteReserveBadge gravite={ligne.gravite} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatutReserveBadge statut={ligne.statut} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(ligne.dateConstat))}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {ligne.dateEcheance ? (
                  <span className={ligne.enRetard ? 'inline-flex items-center gap-1 text-rose-700 font-medium' : ''}>
                    {ligne.enRetard && <AlertTriangle className="h-3.5 w-3.5" />}
                    {formatDate(new Date(ligne.dateEcheance))}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.technicienNom ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
