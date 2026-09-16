/**
 * Tableau de la liste des techniciens (section 12) — composant serveur.
 */

import Link from 'next/link';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import type { LigneTechnicienListe } from '@/lib/derived/techniciens-liste';

interface TableauTechniciensProps {
  lignes: LigneTechnicienListe[];
}

function PastilleStatut({ actif, disponible }: { actif: boolean; disponible: boolean }) {
  if (!actif) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
        Archivé
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        disponible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
      }`}
    >
      {disponible ? 'Disponible' : 'Indisponible'}
    </span>
  );
}

export default function TableauTechniciens({ lignes }: TableauTechniciensProps) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
        Aucun technicien ne correspond à ces filtres.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournée</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session active</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interv. ouvertes</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Maint. en retard</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière synchro. mobile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lignes.map((ligne) => (
              <tr key={ligne.technicien.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/techniciens/${ligne.technicien.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                    {ligne.technicien.nomComplet}
                  </Link>
                  <p className="text-xs text-gray-500">{ligne.technicien.specialite}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PastilleStatut actif={ligne.technicien.actif} disponible={ligne.technicien.disponible} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{ligne.tourneeNom ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{ligne.secteurNom ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {ligne.sessionActive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <Wifi className="h-3.5 w-3.5" /> Oui
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <WifiOff className="h-3.5 w-3.5" /> Non
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {ligne.villeApprox ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" /> {ligne.villeApprox}
                    </span>
                  ) : (
                    <span className="text-gray-400">Non disponible</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  <span className={ligne.interventionsOuvertes > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                    {ligne.interventionsOuvertes}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  <span className={ligne.maintenancesEnRetard > 0 ? 'font-semibold text-rose-600' : 'text-gray-400'}>
                    {ligne.maintenancesEnRetard}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {ligne.derniereSynchronisation ? formatDistanceToNow(new Date(ligne.derniereSynchronisation)) : 'Jamais synchronisé'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
