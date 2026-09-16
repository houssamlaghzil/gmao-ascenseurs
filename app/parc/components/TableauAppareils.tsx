/**
 * Tableau de la liste des appareils (section 4.1) — composant de
 * présentation pur, reçoit une page déjà filtrée/triée (50 lignes max).
 */

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { classeCouleurDisponibilite } from '@/lib/derived/disponibilite';
import type { LigneAppareilListe } from '@/lib/derived/parc-liste';

function celluleDate(iso?: string): string {
  return iso ? formatDate(new Date(iso)) : '—';
}

export default function TableauAppareils({ lignes }: { lignes: LigneAppareilListe[] }) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        Aucun appareil ne correspond à ces critères.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Code appareil',
              'Adresse',
              'Ville',
              'Client',
              'Contrat',
              'Technicien',
              'Tournée',
              'Statut',
              'Dernière maintenance',
              'Prochaine maintenance',
              'Dernière intervention',
              'Disponibilité',
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
                <Link href={`/parc/${ligne.id}`} className="font-medium text-blue-600 hover:underline">
                  {ligne.code}
                </Link>
              </td>
              <td className="px-4 py-3 max-w-[220px] truncate" title={ligne.adresse}>
                {ligne.adresse}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.ville}</td>
              <td className="px-4 py-3 max-w-[180px] truncate" title={ligne.clientNom}>
                {ligne.clientNom}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.contratNumero}</td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.technicienNom ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{ligne.tourneeNom ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge statut={ligne.statut} />
                {ligne.etagesModeDegrade && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Étages : {ligne.etagesModeDegrade}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {celluleDate(ligne.derniereMaintenance)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={ligne.enRetardMaintenance ? 'text-rose-600 font-medium' : ''}>
                  {celluleDate(ligne.prochaineMaintenance)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{celluleDate(ligne.derniereIntervention)}</td>
              <td className={`px-4 py-3 whitespace-nowrap font-medium ${classeCouleurDisponibilite(ligne.disponibilitePourcent)}`}>
                {ligne.disponibilitePourcent} %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
