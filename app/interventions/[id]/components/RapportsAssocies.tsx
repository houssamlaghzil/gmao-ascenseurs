/**
 * Rapports associés à l'intervention (section 8) — liens vers la fiche
 * détaillée du rapport (module Rapports, section 9).
 */

import Link from 'next/link';
import { Rapport } from '@/domain/types';
import { formatDate } from '@/lib/utils';
import { LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { StatutValidationRapportBadge } from '@/components/StatusBadges';

export default function RapportsAssocies({ rapports }: { rapports: Rapport[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Rapports associés</h2>
      {rapports.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun rapport déposé pour cette intervention.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rapports.map((rapport, idx) => (
            <li key={rapport.id} className="py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Link href={`/rapports/${rapport.id}`} className="font-medium text-blue-600 hover:underline">
                  {rapport.numero}
                </Link>
                <span className="text-xs text-gray-400 ml-2">Passage n°{rapport.numeroPassageIntervention ?? idx + 1}</span>
                <p className="text-sm text-gray-500 mt-0.5">
                  {LIBELLE_TYPE_RAPPORT[rapport.typeRapport]} · {formatDate(new Date(rapport.dateHeureFin ?? rapport.dateHeureDebut))}
                </p>
              </div>
              <StatutValidationRapportBadge statut={rapport.statutValidation} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
