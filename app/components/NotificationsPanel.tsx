/**
 * Flux "Activité récente" du tableau de bord (cahier des charges, section
 * 3.4) : fusion des dernières étapes d'intervention, maintenances validées,
 * réserves CTQ soldées et échanges d'intégration, triés par date
 * décroissante. Réécrit pour le nouveau modèle — l'ancienne version
 * importait EvenementBadge/EvenementHistorique, qui n'existent plus.
 */

import Card from '@/components/Card';
import Timeline, { TimelineItem } from '@/components/Timeline';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { CategorieMaintenanceBadge, GraviteReserveBadge } from '@/components/StatusBadges';
import { ActiviteRecenteItem } from '@/lib/derived/dashboard';
import { TypeEtapeIntervention } from '@/domain/types';
import { Plug } from 'lucide-react';

interface NotificationsPanelProps {
  items: ActiviteRecenteItem[];
}

const LIBELLE_ETAPE: Record<TypeEtapeIntervention, string> = {
  [TypeEtapeIntervention.SIGNALEMENT_RECU]: 'Signalement reçu',
  [TypeEtapeIntervention.INTERVENTION_CREEE]: 'Intervention créée',
  [TypeEtapeIntervention.TICKET_RATTACHE]: 'Ticket rattaché',
  [TypeEtapeIntervention.TECHNICIEN_AFFECTE]: 'Technicien affecté',
  [TypeEtapeIntervention.REATTRIBUEE]: 'Réattribuée',
  [TypeEtapeIntervention.PRISE_EN_CHARGE]: 'Prise en charge',
  [TypeEtapeIntervention.ARRIVEE_SUR_SITE]: 'Arrivée sur site',
  [TypeEtapeIntervention.ACCES_REFUSE]: 'Accès refusé',
  [TypeEtapeIntervention.RAPPORT_AJOUTE]: 'Rapport ajouté',
  [TypeEtapeIntervention.ETAT_APPAREIL_CHANGE]: "État de l'appareil constaté",
  [TypeEtapeIntervention.MISE_EN_ATTENTE_PIECE]: 'Mise en attente de pièce',
  [TypeEtapeIntervention.REPRISE]: 'Reprise',
  [TypeEtapeIntervention.RAPPORT_REJETE]: 'Rapport rejeté',
  [TypeEtapeIntervention.TERMINEE]: 'Terminée',
  [TypeEtapeIntervention.VALIDEE]: 'Validée',
  [TypeEtapeIntervention.CLOTUREE]: 'Clôturée',
  [TypeEtapeIntervention.COMMENTAIRE]: 'Commentaire',
};

function toTimelineItem(item: ActiviteRecenteItem): TimelineItem {
  switch (item.source) {
    case 'intervention':
      return {
        id: item.id,
        dateHeure: item.dateHeure,
        badge: <StatutInterventionBadge statut={item.statut} />,
        description: `${LIBELLE_ETAPE[item.etape]} — Intervention ${item.numero} (${item.ascenseurCode})`,
      };
    case 'maintenance':
      return {
        id: item.id,
        dateHeure: item.dateHeure,
        badge: (
          <div className="flex flex-wrap items-center gap-1.5">
            {item.categories.map((categorie) => (
              <CategorieMaintenanceBadge key={categorie} categorie={categorie} />
            ))}
          </div>
        ),
        description: `Maintenance ${item.numero} réalisée — ${item.ascenseurCode}`,
      };
    case 'reserve':
      return {
        id: item.id,
        dateHeure: item.dateHeure,
        badge: <GraviteReserveBadge gravite={item.gravite} />,
        description: `Réserve CTQ ${item.numero} validée — ${item.ascenseurCode}`,
      };
    case 'integration':
      return {
        id: item.id,
        dateHeure: item.dateHeure,
        badge: (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            <Plug className="h-3 w-3" />
            {item.systeme.toUpperCase()}
          </span>
        ),
        description: item.evenement,
      };
  }
}

export default function NotificationsPanel({ items }: NotificationsPanelProps) {
  return (
    <Card title="Activité récente" subtitle="Interventions, maintenances, réserves CTQ et intégrations">
      <Timeline items={items.map(toTimelineItem)} emptyLabel="Aucune activité récente" />
    </Card>
  );
}
