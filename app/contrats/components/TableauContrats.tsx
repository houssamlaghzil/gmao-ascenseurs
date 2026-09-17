/**
 * Tableau de la liste des contrats (section 14) — composant serveur.
 */

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Contrat } from '@/domain/types';
import { StatutContratBadge } from '@/components/StatusBadges';
import { LIBELLE_FREQUENCE_MAINTENANCE, LIBELLE_NIVEAU_SLA } from '@/lib/derived/libelles-contrats';
import { LienClient } from '@/components/Liens';

export interface LigneContrat {
  contrat: Contrat;
  clientNom: string;
  nombreAppareilsReel: number;
}

interface TableauContratsProps {
  lignes: LigneContrat[];
}

function formatDateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TableauContrats({ lignes }: TableauContratsProps) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
        Aucun contrat ne correspond à ces filtres.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Appareils</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fréquence maintenance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Durée min. intervention</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lignes.map(({ contrat, clientNom, nombreAppareilsReel }) => {
              const ecart = nombreAppareilsReel !== contrat.nombreAppareilsCouverts;
              return (
                <tr key={contrat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/contrats/${contrat.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                      {contrat.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <LienClient id={contrat.clientId} ton="sobre">
                      {clientNom}
                    </LienClient>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    <span className="text-gray-900">{contrat.nombreAppareilsCouverts}</span>
                    {ecart && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-amber-600" title="Écart avec le décompte réel">
                        <AlertTriangle className="h-3 w-3" />
                        réel : {nombreAppareilsReel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {formatDateCourte(contrat.dateDebut)} — {formatDateCourte(contrat.dateFin)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {LIBELLE_FREQUENCE_MAINTENANCE[contrat.frequenceMaintenance]}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{LIBELLE_NIVEAU_SLA[contrat.niveauSla]}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {contrat.seuils.dureeMinimaleInterventionMinutes} min
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatutContratBadge statut={contrat.statut} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
