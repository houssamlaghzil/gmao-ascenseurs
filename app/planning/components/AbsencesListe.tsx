/**
 * Liste des absences techniciens (section 11.3) : remplaçant désigné et
 * tâches de la période concernées, avec leur état de réaffectation actuel
 * (déjà transférées ou encore à la charge du technicien absent).
 */

import { UserX } from 'lucide-react';
import { StatutAbsenceBadge, TypeAbsenceBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import type { LigneAbsencePlanning } from '@/lib/derived/planning';
import { LienAppareil, LienTechnicien } from '@/components/Liens';

export default function AbsencesListe({ lignes }: { lignes: LigneAbsencePlanning[] }) {
  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
        Aucune absence enregistrée.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lignes.map(({ absence, technicienNom, remplacantNom, tachesConcernees }) => {
        const nombreReaffectees = tachesConcernees.filter((t) => t.reaffecte).length;
        return (
          <div key={absence.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <LienTechnicien id={absence.technicienId} className="text-sm font-semibold">
                    {technicienNom}
                  </LienTechnicien>
                  <TypeAbsenceBadge type={absence.type} />
                  <StatutAbsenceBadge statut={absence.statut} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Du {formatDate(new Date(`${absence.dateDebut}T00:00:00`))} au {formatDate(new Date(`${absence.dateFin}T00:00:00`))}
                </p>
                {absence.commentaire && <p className="text-xs text-gray-500 mt-1">{absence.commentaire}</p>}
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="inline-flex items-center gap-1">
                  <UserX className="h-3.5 w-3.5 text-gray-400" />
                  Remplaçant :{' '}
                  {absence.remplacantId && remplacantNom ? (
                    <LienTechnicien id={absence.remplacantId} className="font-medium">
                      {remplacantNom}
                    </LienTechnicien>
                  ) : (
                    <span className="font-medium text-gray-900">Aucun désigné</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                Tâches concernées ({tachesConcernees.length}
                {tachesConcernees.length > 0 ? ` · ${nombreReaffectees} transférée${nombreReaffectees > 1 ? 's' : ''}` : ''})
              </p>
              {tachesConcernees.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune maintenance ou intervention planifiée sur cette période.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {tachesConcernees.map((tache) => (
                    <li
                      key={tache.id}
                      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${
                        tache.reaffecte ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {tache.ascenseurId ? (
                        <LienAppareil ascenseurId={tache.ascenseurId} ton="sobre" className="!text-inherit">
                          {tache.libelle}
                        </LienAppareil>
                      ) : (
                        tache.libelle
                      )}
                      <span className="opacity-70">— {tache.reaffecte ? 'transférée' : 'à transférer'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
