/**
 * Onglet Interventions de la fiche appareil (section 4.2) : historique des
 * interventions avec motif, priorité, statut, technicien, dates et rapports
 * associés.
 */

import Link from 'next/link';
import { Intervention } from '@/domain/types';
import { getTechnicienById, getRapportsByInterventionId } from '@/data/store';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { PrioriteInterventionBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';

export default function InterventionsTab({ interventions }: { interventions: Intervention[] }) {
  const lignes = [...interventions].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Numéro', 'Motif', 'Priorité', 'Statut', 'Technicien', "Date d'ouverture", 'Prise en charge', 'Durée', 'Rapports'].map((label) => (
              <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lignes.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                Aucune intervention enregistrée pour cet appareil.
              </td>
            </tr>
          )}
          {lignes.map((intervention) => {
            const technicien = intervention.technicienId ? getTechnicienById(intervention.technicienId) : undefined;
            const nombreRapports = getRapportsByInterventionId(intervention.id).length;
            return (
              <tr key={intervention.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/interventions/${intervention.id}`} className="font-medium text-blue-600 hover:underline">
                    {intervention.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {LIBELLE_MOTIF_INTERVENTION[intervention.motif]}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PrioriteInterventionBadge priorite={intervention.priorite} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatutInterventionBadge statut={intervention.statut} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{technicien?.nomComplet ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(intervention.dateCreation))}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {intervention.datePriseEnCharge ? formatDate(new Date(intervention.datePriseEnCharge)) : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {intervention.dureeInterventionMinutes != null ? `${intervention.dureeInterventionMinutes} min` : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {nombreRapports > 0 ? `${nombreRapports} rapport${nombreRapports > 1 ? 's' : ''}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
