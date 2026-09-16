/**
 * Tableau de la liste des rapports (section 9.1) — composant de
 * présentation pur, reçoit une page déjà filtrée/triée.
 */

import Link from 'next/link';
import { StatutValidationRapportBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { LIBELLE_RATTACHEMENT_RAPPORT } from '@/lib/derived/libelles-rapports';
import type { LigneRapportListe } from '@/lib/derived/rapports-liste';

export default function TableauRapports({ lignes }: { lignes: LigneRapportListe[] }) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        Aucun rapport ne correspond à ces critères.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Numéro', 'Type', 'Rattachement', 'Appareil', 'Client', 'Technicien', 'Date', 'Durée', 'Statut'].map((label) => (
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
                <Link href={`/rapports/${ligne.id}`} className="font-medium text-blue-600 hover:underline">
                  {ligne.numero}
                </Link>
                {!ligne.accesObtenu && <div className="text-xs text-rose-600 mt-0.5">Accès non obtenu</div>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{LIBELLE_TYPE_RAPPORT[ligne.typeRapport]}</td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                {LIBELLE_RATTACHEMENT_RAPPORT[ligne.rattachement]}
                {ligne.interventionNumero && <span className="text-xs text-gray-400 ml-1">({ligne.interventionNumero})</span>}
                {ligne.maintenanceNumero && <span className="text-xs text-gray-400 ml-1">({ligne.maintenanceNumero})</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.appareilCode}</td>
              <td className="px-4 py-3 max-w-[180px] truncate" title={ligne.clientNom}>
                {ligne.clientNom}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.technicienNom}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(ligne.dateHeureDebut))}</td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.dureeMinutes != null ? `${ligne.dureeMinutes} min` : '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatutValidationRapportBadge statut={ligne.statutValidation} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
