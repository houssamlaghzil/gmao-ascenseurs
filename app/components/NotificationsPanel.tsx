/**
 * Flux "Activité récente" du tableau de bord (cahier des charges, section
 * 3.4) : fusion des dernières étapes d'intervention, maintenances validées,
 * réserves CTQ soldées et échanges d'intégration, triés par date
 * décroissante. Réécrit pour le nouveau modèle — l'ancienne version
 * importait EvenementBadge/EvenementHistorique, qui n'existent plus.
 *
 * N'utilise plus le composant générique Timeline (components/Timeline.tsx) :
 * chaque ligne de ce flux doit mener quelque part (règle d'or du projet —
 * aucun cul-de-sac), ce que l'interface de Timeline ne permet pas
 * (description typée `string`, pas de `href`). Le balisage reproduit donc
 * fidèlement celui de Timeline, avec chaque ligne enveloppée dans un lien.
 */

import Link from 'next/link';
import { ReactNode } from 'react';
import Card from '@/components/Card';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { CategorieMaintenanceBadge, GraviteReserveBadge } from '@/components/StatusBadges';
import { ActiviteRecenteItem } from '@/lib/derived/dashboard';
import { TypeEtapeIntervention } from '@/domain/types';
import { getAscenseurByCode, getAllReservesCTQ, getInterventionByNumero } from '@/data/store';
import { lienAppareil } from '@/lib/derived/explorer';
import { formatDistanceToNow } from '@/lib/utils';
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

interface LigneAffichee {
  badge: ReactNode;
  description: string;
}

function contenuActivite(item: ActiviteRecenteItem): LigneAffichee {
  switch (item.source) {
    case 'intervention':
      return {
        badge: <StatutInterventionBadge statut={item.statut} />,
        description: `${LIBELLE_ETAPE[item.etape]} — Intervention ${item.numero} (${item.ascenseurCode})`,
      };
    case 'maintenance':
      return {
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
        badge: <GraviteReserveBadge gravite={item.gravite} />,
        description: `Réserve CTQ ${item.numero} validée — ${item.ascenseurCode}`,
      };
    case 'integration':
      return {
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

/**
 * Destination naturelle d'une ligne d'activité. Le flux ne porte que des
 * identifiants d'affichage (numéro, code appareil) — jamais les identifiants
 * réels des entités (voir lib/derived/dashboard.ts, getActiviteRecente) —
 * donc chaque cas se résout via les mêmes clés lisibles que celles montrées
 * à l'écran : le numéro d'intervention, le code appareil, ou le numéro de
 * réserve. Une intervention mène à sa fiche ; une maintenance ou une réserve
 * sans fiche dédiée mène à l'appareil concerné ; une réserve retrouvée mène
 * directement à son contrôle CTQ ; un échange d'intégration mène à l'écran
 * Intégrations.
 */
function lienActivite(item: ActiviteRecenteItem): string | undefined {
  switch (item.source) {
    case 'intervention': {
      const intervention = getInterventionByNumero(item.numero);
      return intervention ? `/interventions/${intervention.id}` : undefined;
    }
    case 'maintenance': {
      const ascenseur = getAscenseurByCode(item.ascenseurCode);
      return ascenseur ? lienAppareil(ascenseur.id) : undefined;
    }
    case 'reserve': {
      const reserve = getAllReservesCTQ().find((r) => r.numero === item.numero);
      if (reserve) return `/ctq/${reserve.controleId}`;
      const ascenseur = getAscenseurByCode(item.ascenseurCode);
      return ascenseur ? lienAppareil(ascenseur.id) : undefined;
    }
    case 'integration':
      return '/integrations';
  }
}

export default function NotificationsPanel({ items }: NotificationsPanelProps) {
  return (
    <Card title="Activité récente" subtitle="Interventions, maintenances, réserves CTQ et intégrations">
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune activité récente</p>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {items.map((item, idx) => {
              const { badge, description } = contenuActivite(item);
              const href = lienActivite(item);
              const ligne = (
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-white">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div className="flex-1">
                      {badge}
                      {description && <p className="text-sm text-gray-700 mt-2">{description}</p>}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={item.dateHeure}>{formatDistanceToNow(new Date(item.dateHeure))}</time>
                    </div>
                  </div>
                </div>
              );
              return (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {idx < items.length - 1 && (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    {href ? (
                      <Link
                        href={href}
                        className="block -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        {ligne}
                      </Link>
                    ) : (
                      ligne
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
