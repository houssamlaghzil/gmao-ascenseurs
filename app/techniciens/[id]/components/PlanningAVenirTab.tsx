/**
 * Onglet Planning de la fiche technicien (section 12) : tâches à venir sur
 * les 7 prochains jours (maintenances, interventions ouvertes, absences),
 * projetées par lib/derived/planning.ts. Lecture seule — la réaffectation
 * par glisser-déposer vit sur l'écran Planning complet (section 11.2).
 */

import Link from 'next/link';
import { CalendarClock, ClipboardList, Wrench, UserX, ArrowLeftRight } from 'lucide-react';
import { TachePlanning, TypeTachePlanning } from '@/domain/types';
import { formatDate } from '@/lib/utils';
import { LienAppareil } from '@/components/Liens';

const ICONE_TYPE: Record<TypeTachePlanning, typeof Wrench> = {
  [TypeTachePlanning.MAINTENANCE]: ClipboardList,
  [TypeTachePlanning.INTERVENTION]: Wrench,
  [TypeTachePlanning.ABSENCE]: UserX,
};

interface PlanningAVenirTabProps {
  technicienId: string;
  taches: TachePlanning[];
  total: number;
}

export default function PlanningAVenirTab({ technicienId, taches, total }: PlanningAVenirTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 inline-flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-gray-400" />
          {total} tâche{total > 1 ? 's' : ''} sur les 7 prochains jours
        </p>
        <Link href={`/planning?technicien=${technicienId}`} className="text-sm text-blue-600 hover:underline">
          Voir le planning complet →
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
        {taches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Aucune tâche planifiée sur les 7 prochains jours.</p>
        ) : (
          taches.map((tache) => {
            const Icone = ICONE_TYPE[tache.type];
            return (
              <div key={tache.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      tache.urgent ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tache.ascenseurId ? (
                        <LienAppareil ascenseurId={tache.ascenseurId} ton="sobre" className="!text-inherit">
                          {tache.libelle}
                        </LienAppareil>
                      ) : (
                        tache.libelle
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(new Date(tache.dateDebut))} · {tache.statutAffichage}
                      {tache.reaffecte && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 ml-1">
                          <ArrowLeftRight className="h-3 w-3" /> réaffectée
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {tache.urgent && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
                    Urgent
                  </span>
                )}
              </div>
            );
          })
        )}
        {total > taches.length && (
          <p className="px-4 py-2 text-xs text-gray-500 text-center">
            + {total - taches.length} autre{total - taches.length > 1 ? 's' : ''} tâche{total - taches.length > 1 ? 's' : ''} sur la période
          </p>
        )}
      </div>
    </div>
  );
}
