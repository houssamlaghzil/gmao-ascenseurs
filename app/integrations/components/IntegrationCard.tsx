'use client';

/**
 * Carte d'une intégration externe (section 15) : état de connexion, dernière
 * synchronisation/erreur, tâches en attente, temps de réponse, et un
 * bouton repliable "Consulter les logs" qui affiche le journal des échanges
 * (getJournalEchangesByIntegrationId, déjà trié le plus récent en premier
 * par le store). Composant client uniquement pour le repli/dépli : toutes
 * les données sont déjà résolues côté serveur et passées en props.
 */

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DirectionEchange, IntegrationExterne, JournalEchangeIntegration, StatutConnexionIntegration, StatutEchange } from '@/domain/types';
import { StatutConnexionIntegrationBadge } from '@/components/StatusBadges';
import { formatDistanceToNow } from '@/lib/utils';
import { LIBELLE_DIRECTION_ECHANGE, LIBELLE_SYSTEME_EXTERNE } from '@/lib/derived/libelles-integrations';

/** Seuil au-delà duquel une intégration pourtant connectée est signalée comme lente (section 15). */
const SEUIL_LENTEUR_MS = 1500;

type Tone = { bg: string; text: string; border: string; label: string };

/** Badge local (statut d'un échange) : pas d'équivalent dans components/StatusBadges.tsx, propre à cet écran. */
const TONE_STATUT_ECHANGE: Record<StatutEchange, Tone> = {
  [StatutEchange.SUCCES]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Succès' },
  [StatutEchange.ECHEC]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Échec' },
  [StatutEchange.EN_COURS]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'En cours' },
  [StatutEchange.EN_ATTENTE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'En attente' },
};

function StatutEchangeBadge({ statut }: { statut: StatutEchange }) {
  const tone = TONE_STATUT_ECHANGE[statut];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${tone.bg} ${tone.text} ${tone.border}`}>
      {tone.label}
    </span>
  );
}

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

interface IntegrationCardProps {
  integration: IntegrationExterne;
  journal: JournalEchangeIntegration[];
}

export default function IntegrationCard({ integration, journal }: IntegrationCardProps) {
  const [logsOuverts, setLogsOuverts] = useState(false);
  const lente = integration.statutConnexion === StatutConnexionIntegration.CONNECTEE && integration.tempsReponseMoyenMs > SEUIL_LENTEUR_MS;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{integration.nomAffiche}</h3>
          <div className="flex items-center gap-2 mt-2">
            <StatutConnexionIntegrationBadge statut={integration.statutConnexion} />
            {lente && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                Lente
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLogsOuverts((v) => !v)}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline shrink-0"
        >
          {logsOuverts ? 'Masquer les logs' : 'Consulter les logs'}
          {logsOuverts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <Champ label="Dernière synchronisation">
          {integration.derniereSynchronisation ? formatDistanceToNow(new Date(integration.derniereSynchronisation)) : 'Jamais synchronisée'}
        </Champ>
        <Champ label="Tâches en attente">
          <span className={integration.nombreTachesEnAttente > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'}>
            {integration.nombreTachesEnAttente}
          </span>
        </Champ>
        <Champ label="Temps de réponse moyen">
          {integration.statutConnexion === StatutConnexionIntegration.CONNECTEE ? `${integration.tempsReponseMoyenMs} ms` : '—'}
        </Champ>
        <Champ label="Dernière erreur">
          {integration.derniereErreurMessage ? (
            <>
              <span className="text-rose-600">{integration.derniereErreurMessage}</span>
              {integration.derniereErreurDate && (
                <span className="block text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(integration.derniereErreurDate))}</span>
              )}
            </>
          ) : (
            <span className="text-gray-400">Aucune</span>
          )}
        </Champ>
      </dl>

      {logsOuverts && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Journal des échanges</h4>
          {journal.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun échange enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Système</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tentatives</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Erreur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {journal.map((entree) => (
                    <tr key={entree.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{LIBELLE_SYSTEME_EXTERNE[entree.systeme]}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                        {entree.direction === DirectionEchange.ENTRANT ? '↓ ' : '↑ '}
                        {LIBELLE_DIRECTION_ECHANGE[entree.direction]}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{entree.evenement}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatDistanceToNow(new Date(entree.dateHeure))}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <StatutEchangeBadge statut={entree.statut} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700">{entree.nombreTentatives}</td>
                      <td className="px-3 py-2 text-sm text-rose-600">{entree.messageErreur ?? <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
