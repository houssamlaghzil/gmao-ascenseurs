/**
 * Onglet Interventions de la fiche technicien (section 12) : interventions
 * affectées à ce technicien, avec appareil, priorité, statut et état SLA.
 */

import Link from 'next/link';
import { Intervention } from '@/domain/types';
import { getAscenseurById } from '@/data/store';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { EtatSLABadge, PrioriteInterventionBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { calculerEtatSLA } from '@/lib/derived/sla';

export default function InterventionsTechnicienTab({ interventions }: { interventions: Intervention[] }) {
  const lignes = [...interventions].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Numéro', 'Appareil', 'Motif', 'Priorité', 'Statut', 'SLA', "Date d'ouverture"].map((label) => (
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
                Aucune intervention affectée à ce technicien.
              </td>
            </tr>
          )}
          {lignes.map((intervention) => {
            const ascenseur = getAscenseurById(intervention.ascenseurId);
            const sla = calculerEtatSLA(intervention);
            return (
              <tr key={intervention.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/interventions/${intervention.id}`} className="font-medium text-blue-600 hover:underline">
                    {intervention.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {ascenseur ? (
                    <Link href={`/parc/${ascenseur.id}`} className="text-gray-700 hover:underline">
                      {ascenseur.code}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{LIBELLE_MOTIF_INTERVENTION[intervention.motif]}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PrioriteInterventionBadge priorite={intervention.priorite} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatutInterventionBadge statut={intervention.statut} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <EtatSLABadge etat={sla.etat} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(intervention.dateCreation))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
