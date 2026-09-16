/**
 * Composant Timeline générique — réutilisé pour la chronologie d'une
 * intervention (EtapeIntervention), l'historique d'une fiche appareil
 * (EntreeJournalModification), l'historique d'une réserve CTQ
 * (EvenementReserve) et l'audit transverse (EntreeAudit). Le badge et la
 * description de chaque ligne sont fournis par l'appelant : ce composant
 * ne connaît aucune de ces entités.
 */

import { ReactNode } from 'react';
import { formatDistanceToNow } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  dateHeure: string;
  badge: ReactNode;
  description?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  emptyLabel?: string;
}

export default function Timeline({ items, emptyLabel = "Aucun événement dans l'historique" }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((item, idx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {idx < items.length - 1 && (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-white">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div className="flex-1">
                    {item.badge}
                    {item.description && <p className="text-sm text-gray-700 mt-2">{item.description}</p>}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={item.dateHeure}>{formatDistanceToNow(new Date(item.dateHeure))}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
