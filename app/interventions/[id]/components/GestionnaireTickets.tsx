/**
 * Gestionnaire de tickets de l'écran Détail intervention (section 7.3) :
 * liste des tickets rattachés, triés par ordreDansIntervention. Un seul
 * signalement reste discret (pas de tableau ni de bannière) ; plusieurs
 * signalements affichent explicitement le regroupement.
 */

import { Layers } from 'lucide-react';
import { Ticket } from '@/domain/types';
import { formatDate } from '@/lib/utils';
import { LIBELLE_SOURCE_TICKET } from '@/lib/derived/libelles-interventions';

export default function GestionnaireTickets({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Tickets</h2>
        <p className="text-sm text-gray-500">Aucun ticket rattaché.</p>
      </div>
    );
  }

  if (tickets.length === 1) {
    const ticket = tickets[0];
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Ticket</h2>
        <p className="text-sm text-gray-700">
          <span className="font-medium">{ticket.numero}</span> — {LIBELLE_SOURCE_TICKET[ticket.source]} · reçu le{' '}
          {formatDate(new Date(ticket.dateReception))}
          {ticket.contact ? ` · ${ticket.contact}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-indigo-600" />
        <h2 className="text-sm font-semibold text-gray-900">
          {tickets.length} signalements regroupés sous cette intervention
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Numéro', 'Source', 'Date de réception', 'Contact', 'Canal'].map((label) => (
                <th key={label} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{ticket.ordreDansIntervention ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{ticket.numero}</td>
                <td className="px-3 py-2 whitespace-nowrap">{LIBELLE_SOURCE_TICKET[ticket.source]}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(new Date(ticket.dateReception))}</td>
                <td className="px-3 py-2 whitespace-nowrap">{ticket.contact ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{ticket.canal ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
