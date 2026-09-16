/**
 * Vue prioritaire de l'écran Maintenances (section 6.2) : 3 groupes, dans
 * l'ordre imposé — 1) en retard, 2) cette semaine, 3) à venir — chacun
 * paginé indépendamment (page 1 par défaut). Composant serveur : aucune
 * interactivité propre, seulement des <Link> de pagination (voir
 * PaginationMaintenances).
 */

import { AlertTriangle, CalendarClock, CalendarRange } from 'lucide-react';
import { MaintenanceAvecUrgence, TypeMaintenanceRef } from '@/domain/types';
import type { PageResultat } from '@/lib/derived/maintenances-liste';
import LigneMaintenance from './LigneMaintenance';
import PaginationMaintenances from './PaginationMaintenances';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

const ENTETES = ['Maintenance', 'Appareil', 'Dates & retard', 'Statut', 'Durée & seuil (6.5)', 'Affectation'];

interface VuePrioritaireProps {
  enRetard: PageResultat<MaintenanceAvecUrgence>;
  cetteSemaine: PageResultat<MaintenanceAvecUrgence>;
  aVenir: PageResultat<MaintenanceAvecUrgence>;
  typesMaintenanceRef: TypeMaintenanceRef[];
  searchParams: SearchParamsRecord;
}

export default function VuePrioritaire({ enRetard, cetteSemaine, aVenir, typesMaintenanceRef, searchParams }: VuePrioritaireProps) {
  return (
    <div className="space-y-6">
      <SectionPriorite
        titre="En retard"
        icon={AlertTriangle}
        iconClassName="text-rose-600"
        page={enRetard}
        pageParam="pageRetard"
        typesMaintenanceRef={typesMaintenanceRef}
        searchParams={searchParams}
        emptyLabel="Aucune maintenance en retard : le parc est à jour."
      />
      <SectionPriorite
        titre="Cette semaine"
        icon={CalendarClock}
        iconClassName="text-amber-600"
        page={cetteSemaine}
        pageParam="pageSemaine"
        typesMaintenanceRef={typesMaintenanceRef}
        searchParams={searchParams}
        emptyLabel="Aucune maintenance prévue cette semaine."
      />
      <SectionPriorite
        titre="À venir"
        icon={CalendarRange}
        iconClassName="text-sky-600"
        page={aVenir}
        pageParam="pageAVenir"
        typesMaintenanceRef={typesMaintenanceRef}
        searchParams={searchParams}
        emptyLabel="Aucune maintenance à venir au-delà de cette semaine."
      />
    </div>
  );
}

interface SectionPrioriteProps {
  titre: string;
  icon: typeof AlertTriangle;
  iconClassName: string;
  page: PageResultat<MaintenanceAvecUrgence>;
  pageParam: string;
  typesMaintenanceRef: TypeMaintenanceRef[];
  searchParams: SearchParamsRecord;
  emptyLabel: string;
}

function SectionPriorite({ titre, icon: Icon, iconClassName, page, pageParam, typesMaintenanceRef, searchParams, emptyLabel }: SectionPrioriteProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClassName}`} />
          {titre}
        </h2>
        <span className="text-xs text-gray-500">
          {page.total.toLocaleString('fr-FR')} maintenance{page.total > 1 ? 's' : ''}
        </span>
      </div>

      {page.items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {ENTETES.map((label) => (
                  <th key={label} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {page.items.map((maintenance) => (
                <LigneMaintenance key={maintenance.id} maintenance={maintenance} typesMaintenanceRef={typesMaintenanceRef} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 pb-3">
        <PaginationMaintenances searchParams={searchParams} pageParam={pageParam} pageActuelle={page.pageActuelle} totalPages={page.totalPages} />
      </div>
    </div>
  );
}
