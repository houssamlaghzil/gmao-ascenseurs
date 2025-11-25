/**
 * Composant Timeline vertical pour l'historique des événements
 * Affichage chronologique du plus récent au plus ancien
 */

import { EvenementHistorique, TypeEvenement } from '@/domain/types';

interface TimelineProps {
  evenements: EvenementHistorique[];
}

/**
 * Formatte une date en temps relatif (il y a X heures/jours)
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  } else if (diffDays < 7) {
    return `il y a ${diffDays}j`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

export default function Timeline({ evenements }: TimelineProps) {
  const getEventIcon = (type: TypeEvenement) => {
    switch (type) {
      case TypeEvenement.PANNE_DECLAREE:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case TypeEvenement.PANNE_ATTRIBUEE:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case TypeEvenement.DEBUT_REPARATION:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case TypeEvenement.FIN_REPARATION:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case TypeEvenement.RETOUR_FONCTIONNEL:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getEventColor = (type: TypeEvenement) => {
    switch (type) {
      case TypeEvenement.PANNE_DECLAREE:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case TypeEvenement.PANNE_ATTRIBUEE:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case TypeEvenement.DEBUT_REPARATION:
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case TypeEvenement.FIN_REPARATION:
      case TypeEvenement.RETOUR_FONCTIONNEL:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventLabel = (type: TypeEvenement) => {
    switch (type) {
      case TypeEvenement.PANNE_DECLAREE:
        return 'Panne déclarée';
      case TypeEvenement.PANNE_ATTRIBUEE:
        return 'Panne attribuée';
      case TypeEvenement.DEBUT_REPARATION:
        return 'Début de réparation';
      case TypeEvenement.FIN_REPARATION:
        return 'Fin de réparation';
      case TypeEvenement.RETOUR_FONCTIONNEL:
        return 'Retour en service';
      case TypeEvenement.COMMENTAIRE:
        return 'Commentaire';
      default:
        return 'Événement';
    }
  };

  if (evenements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun événement enregistré</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {evenements.map((evt, idx) => (
          <li key={evt.id}>
            <div className="relative pb-8">
              {idx !== evenements.length - 1 && (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div>
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${getEventColor(
                      evt.typeEvenement
                    )}`}
                  >
                    {getEventIcon(evt.typeEvenement)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {getEventLabel(evt.typeEvenement)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatTimeAgo(evt.dateHeure)}
                    </p>
                  </div>
                  {evt.commentaire && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-200">
                      {evt.commentaire}
                    </div>
                  )}
                  {evt.technicienId && (
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">Technicien:</span> {evt.technicienId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
