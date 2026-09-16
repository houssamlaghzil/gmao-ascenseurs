/**
 * Tableau de la liste des interventions (section 7.1) — composant de
 * présentation pur, reçoit une page déjà filtrée/triée (50 lignes max).
 */

import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { EtatSLABadge, PrioriteInterventionBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { LIBELLE_SOURCE_TICKET } from '@/lib/derived/libelles-interventions';
import type { LigneInterventionListe } from '@/lib/derived/interventions-liste';

function celluleDate(iso?: string): string {
  return iso ? formatDate(new Date(iso)) : '—';
}

export default function TableauInterventions({ lignes }: { lignes: LigneInterventionListe[] }) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        Aucune intervention ne correspond à ces critères.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Numéro',
              'Appareil',
              'Client',
              'Motif',
              'Source',
              'Priorité',
              'SLA',
              'Technicien',
              'Statut',
              'Ouverture',
              'Prise en charge',
              'Durée',
              'État appareil',
            ].map((label) => (
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
                <Link href={`/interventions/${ligne.id}`} className="font-medium text-blue-600 hover:underline">
                  {ligne.numero}
                </Link>
                {ligne.nombreTickets > 1 && (
                  <div className="text-xs text-gray-400 mt-0.5">{ligne.nombreTickets} signalements</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.appareilCode}</td>
              <td className="px-4 py-3 max-w-[180px] truncate" title={ligne.clientNom}>
                {ligne.clientNom}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{LIBELLE_MOTIF_INTERVENTION[ligne.motif]}</td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                {ligne.source ? LIBELLE_SOURCE_TICKET[ligne.source] : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <PrioriteInterventionBadge priorite={ligne.priorite} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <EtatSLABadge etat={ligne.sla.etat} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.technicienNom ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatutInterventionBadge statut={ligne.statut} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{celluleDate(ligne.dateCreation)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{celluleDate(ligne.datePriseEnCharge)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {ligne.dureeInterventionMinutes != null ? `${ligne.dureeInterventionMinutes} min` : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {ligne.etatAppareilInitial ? <StatusBadge statut={ligne.etatAppareilInitial} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
