/**
 * Écran Intégrations (section 15). Server Component : lecture directe du
 * store, une carte par IntegrationExterne, chacune enrichie de son journal
 * des échanges (getJournalEchangesByIntegrationId) affiché à la demande.
 */

import { Plug } from 'lucide-react';
import { getAllIntegrationsExternes, getJournalEchangesByIntegrationId } from '@/data/store';
import IntegrationCard from './components/IntegrationCard';

export const dynamic = 'force-dynamic';

export default function IntegrationsPage() {
  const integrations = getAllIntegrationsExternes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Plug className="h-6 w-6 text-blue-600" />
          Intégrations
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {integrations.length.toLocaleString('fr-FR')} système{integrations.length > 1 ? 's' : ''} externe{integrations.length > 1 ? 's' : ''} connecté{integrations.length > 1 ? 's' : ''} à Manei-Lift
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} journal={getJournalEchangesByIntegrationId(integration.id)} />
        ))}
      </div>
    </div>
  );
}
