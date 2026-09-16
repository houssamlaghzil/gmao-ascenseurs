/**
 * Chronologie de l'écran Détail intervention (section 8) : Timeline
 * générique alimentée par getEtapesInterventionParId(id). Le badge reprend
 * le libellé coloré de TypeEtapeIntervention ; la description combine le
 * commentaire éventuel avec le technicien/ticket/rapport/état d'appareil
 * concerné, quand l'étape en porte un.
 */

import { EtapeIntervention } from '@/domain/types';
import { getRapportById, getTechnicienById, getTicketById } from '@/data/store';
import Timeline, { TimelineItem } from '@/components/Timeline';
import { TypeEtapeInterventionBadge } from '@/components/StatusBadges';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';

function description(etape: EtapeIntervention): string | undefined {
  const parties: string[] = [];
  if (etape.technicienId) {
    const technicien = getTechnicienById(etape.technicienId);
    if (technicien) parties.push(`Technicien : ${technicien.nomComplet}`);
  }
  if (etape.ticketId) {
    const ticket = getTicketById(etape.ticketId);
    if (ticket) parties.push(`Ticket ${ticket.numero}`);
  }
  if (etape.rapportId) {
    const rapport = getRapportById(etape.rapportId);
    if (rapport) parties.push(`Rapport ${rapport.numero}`);
  }
  if (etape.etatAppareil) {
    parties.push(`État constaté : ${LIBELLE_STATUT_APPAREIL[etape.etatAppareil]}`);
  }
  if (etape.commentaire) parties.push(etape.commentaire);
  return parties.length > 0 ? parties.join(' — ') : undefined;
}

export default function ChronologieIntervention({ etapes }: { etapes: EtapeIntervention[] }) {
  const items: TimelineItem[] = etapes.map((etape) => ({
    id: etape.id,
    dateHeure: etape.dateHeure,
    badge: <TypeEtapeInterventionBadge type={etape.type} />,
    description: description(etape),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Chronologie</h2>
      <Timeline items={items} emptyLabel="Aucune étape enregistrée pour cette intervention" />
    </div>
  );
}
