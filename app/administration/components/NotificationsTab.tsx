/**
 * Onglet Notifications de l'écran Administration (section 17) : configuration
 * par type de notification (getAllConfigurationsNotification, section 45) —
 * canaux actifs, rôles destinataires par défaut, délai d'alerte.
 */

import { ConfigurationNotification, RoleUtilisateur } from '@/domain/types';
import { LIBELLE_CANAL_NOTIFICATION } from '@/lib/derived/libelles-administration';

interface NotificationsTabProps {
  configurations: ConfigurationNotification[];
  roleLibelles: Record<RoleUtilisateur, string>;
}

export default function NotificationsTab({ configurations, roleLibelles }: NotificationsTabProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notification</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canaux actifs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôles destinataires</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Délai avant alerte</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {configurations.map((config) => (
              <tr key={config.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{config.libelle}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {config.canauxActifs.map((canal) => (
                      <span
                        key={canal}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        {LIBELLE_CANAL_NOTIFICATION[canal]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {config.rolesDestinataires.map((role) => roleLibelles[role]).join(', ')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                  {config.delaiAvantAlerteMinutes ? `${config.delaiAvantAlerteMinutes} min` : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                      config.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {config.actif ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
