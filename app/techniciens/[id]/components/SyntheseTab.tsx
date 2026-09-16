/**
 * Onglet Synthèse de la fiche technicien (section 12) : identité, tournée(s)
 * et indicateurs rapides (interventions ouvertes, maintenances en retard,
 * session mobile).
 */

import { Wifi, WifiOff, MapPin, AlertTriangle } from 'lucide-react';
import { Tournee } from '@/domain/types';
import StatCard from '@/components/StatCard';
import { formatDistanceToNow } from '@/lib/utils';
import type { LigneTechnicienListe } from '@/lib/derived/techniciens-liste';

interface SyntheseTabProps {
  ligne: LigneTechnicienListe;
  tournees: Tournee[];
  nombreAppareilsCouverts: number;
  absencesActives: number;
}

function Pastille({ actif, disponible }: { actif: boolean; disponible: boolean }) {
  if (!actif) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
        Compte archivé
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

export default function SyntheseTab({ ligne, tournees, nombreAppareilsCouverts, absencesActives }: SyntheseTabProps) {
  const { technicien } = ligne;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Interventions ouvertes" value={ligne.interventionsOuvertes} colorClass={ligne.interventionsOuvertes > 0 ? 'text-orange-600' : 'text-gray-400'} />
        <StatCard title="Maintenances en retard" value={ligne.maintenancesEnRetard} colorClass={ligne.maintenancesEnRetard > 0 ? 'text-rose-600' : 'text-gray-400'} />
        <StatCard
          title="Session mobile"
          value={ligne.sessionActive ? 'Active' : 'Inactive'}
          colorClass={ligne.sessionActive ? 'text-emerald-600' : 'text-gray-400'}
          icon={ligne.sessionActive ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
        />
        <StatCard
          title="Dernière synchro. mobile"
          value={ligne.derniereSynchronisation ? formatDistanceToNow(new Date(ligne.derniereSynchronisation)) : 'Jamais'}
          colorClass="text-gray-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Identité</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Statut</dt>
              <dd>
                <Pastille actif={technicien.actif} disponible={technicien.disponible} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Spécialité</dt>
              <dd className="text-gray-900">{technicien.specialite}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Téléphone</dt>
              <dd className="text-gray-900">{technicien.telephone ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">E-mail</dt>
              <dd className="text-gray-900">{technicien.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Secteur</dt>
              <dd className="text-gray-900">{ligne.secteurNom ?? '—'}</dd>
            </div>
            {absencesActives > 0 && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {absencesActives} absence{absencesActives > 1 ? 's' : ''} planifiée{absencesActives > 1 ? 's' : ''} ou en cours
                </span>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Tournée(s)</h2>
          {tournees.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune tournée titulaire rattachée à ce technicien.</p>
          ) : (
            <ul className="space-y-3">
              {tournees.map((tournee) => (
                <li key={tournee.id} className="border border-gray-100 rounded-md px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tournee.couleur ?? '#94a3b8' }} />
                      {tournee.nom}
                    </span>
                    {!tournee.actif && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {tournee.ville}
                  </p>
                </li>
              ))}
              <li className="text-xs text-gray-500 pt-1">
                {nombreAppareilsCouverts.toLocaleString('fr-FR')} appareil{nombreAppareilsCouverts > 1 ? 's' : ''} couvert
                {nombreAppareilsCouverts > 1 ? 's' : ''} au total
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
