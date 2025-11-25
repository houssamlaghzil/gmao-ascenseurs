'use client';

/**
 * Panneau de notifications affichant les événements récents
 */

import Card from '@/components/Card';
import EvenementBadge from '@/components/EvenementBadge';
import { formatDistanceToNow } from '@/lib/utils';
import { EvenementHistorique, TypeEvenement } from '@/domain/types';
import { Bell, AlertCircle } from 'lucide-react';

interface NotificationsPanelProps {
  evenements: EvenementHistorique[];
}

export default function NotificationsPanel({ evenements }: NotificationsPanelProps) {
  // Mettre en évidence les pannes non attribuées (les plus récentes)
  const pannesNonAttribuees = evenements.filter(
    (evt) => evt.typeEvenement === TypeEvenement.PANNE_DECLAREE
  );

  return (
    <Card
      title="Notifications"
      subtitle="Événements récents"
      className="h-fit sticky top-20"
    >
      {/* Alerte pour pannes non attribuées */}
      {pannesNonAttribuees.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm font-medium text-red-800">
              {pannesNonAttribuees.length} panne(s) récente(s) déclarée(s)
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {evenements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          evenements.map((evt) => (
            <div
              key={evt.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <EvenementBadge type={evt.typeEvenement} />
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(evt.dateHeure))}
                </span>
              </div>
              {evt.commentaire && (
                <p className="text-sm text-gray-700 mt-2">{evt.commentaire}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Ascenseur: {evt.ascenseurId}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
