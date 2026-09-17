/**
 * Onglet Rapports de la fiche technicien (section 12) : rapports récents
 * rédigés par ce technicien, tous appareils confondus.
 */

import Link from 'next/link';
import { Rapport } from '@/domain/types';
import { getAscenseurById } from '@/data/store';
import { StatutValidationRapportBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { LienAppareil } from '@/components/Liens';

export default function RapportsTechnicienTab({ rapports }: { rapports: Rapport[] }) {
  const lignes = [...rapports].sort((a, b) => new Date(b.dateHeureDebut).getTime() - new Date(a.dateHeureDebut).getTime());

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Numéro', 'Type', 'Appareil', 'Date', 'Validation'].map((label) => (
              <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lignes.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                Aucun rapport rédigé par ce technicien.
              </td>
            </tr>
          )}
          {lignes.map((rapport) => {
            const ascenseur = getAscenseurById(rapport.ascenseurId);
            return (
              <tr key={rapport.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/rapports/${rapport.id}`} className="font-medium text-blue-600 hover:underline">
                    {rapport.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{LIBELLE_TYPE_RAPPORT[rapport.typeRapport]}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {ascenseur ? (
                    <LienAppareil ascenseurId={ascenseur.id} ton="sobre">
                      {ascenseur.code}
                    </LienAppareil>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(rapport.dateHeureDebut))}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatutValidationRapportBadge statut={rapport.statutValidation} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
