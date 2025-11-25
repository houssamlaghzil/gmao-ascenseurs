/**
 * Composant Timeline pour afficher l'historique des événements
 */

import { EvenementHistorique } from '@/domain/types';
import EvenementBadge from './EvenementBadge';
import { formatDistanceToNow } from '@/lib/utils';

interface TimelineProps {
  evenements: EvenementHistorique[];
}

export default function Timeline({ evenements }: TimelineProps) {
  if (evenements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun événement dans l&apos;historique</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {evenements.map((evt, idx) => (
          <li key={evt.id}>
            <div className="relative pb-8">
              {/* Ligne verticale */}
              {idx < evenements.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                {/* Point sur la ligne */}
                <div>
                  <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center ring-4 ring-white">
                    <span className="h-2 w-2 rounded-full bg-primary-600" />
                  </span>
                </div>
                {/* Contenu de l'événement */}
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div className="flex-1">
                    <EvenementBadge type={evt.typeEvenement} />
                    {evt.commentaire && (
                      <p className="text-sm text-gray-700 mt-2">{evt.commentaire}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={evt.dateHeure}>
                      {formatDistanceToNow(new Date(evt.dateHeure))}
                    </time>
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
