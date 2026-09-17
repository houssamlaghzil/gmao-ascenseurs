/**
 * Bloc "Urgences" du tableau de bord (cahier des charges, section 3.3) :
 * liste courte et priorisée, groupée par nature d'urgence.
 */

import Link from 'next/link';
import { ComponentType } from 'react';
import Card from '@/components/Card';
import { formatDistanceToNow } from '@/lib/utils';
import { GroupeUrgence, TypeUrgence } from '@/lib/derived/dashboard';
import { lienAppareil } from '@/lib/derived/explorer';
import { AlertOctagon, Clock, TimerOff, AlertTriangle, PlugZap, CheckCircle2 } from 'lucide-react';

interface UrgencesPanelProps {
  groupes: GroupeUrgence[];
}

/**
 * Destination naturelle d'un item d'urgence, déterminée par la nature du
 * groupe plutôt que par `item.href` : dans les trois groupes issus des
 * interventions, `item.id` porte l'identifiant réel de l'intervention (le
 * titre affiché est d'ailleurs « Intervention <numéro> »), donc sa fiche
 * `/interventions/<id>` — pas la fiche appareil. Le groupe « Appareils à
 * l'arrêt » porte lui l'identifiant de l'appareil. Les anomalies API
 * n'ayant pas de fiche dédiée, elles renvoient vers l'écran Intégrations.
 */
function lienUrgence(type: TypeUrgence, itemId: string): string {
  switch (type) {
    case TypeUrgence.PERSONNE_BLOQUEE:
    case TypeUrgence.NON_PRIS_EN_CHARGE:
    case TypeUrgence.SLA_BIENTOT_DEPASSE:
      return `/interventions/${itemId}`;
    case TypeUrgence.APPAREIL_A_L_ARRET:
      return lienAppareil(itemId);
    case TypeUrgence.ANOMALIE_API:
      return '/integrations';
  }
}

const ICONE: Record<TypeUrgence, ComponentType<{ className?: string }>> = {
  [TypeUrgence.PERSONNE_BLOQUEE]: AlertOctagon,
  [TypeUrgence.NON_PRIS_EN_CHARGE]: Clock,
  [TypeUrgence.SLA_BIENTOT_DEPASSE]: TimerOff,
  [TypeUrgence.APPAREIL_A_L_ARRET]: AlertTriangle,
  [TypeUrgence.ANOMALIE_API]: PlugZap,
};

const TONALITE: Record<TypeUrgence, { bg: string; text: string; border: string }> = {
  [TypeUrgence.PERSONNE_BLOQUEE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  [TypeUrgence.NON_PRIS_EN_CHARGE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  [TypeUrgence.SLA_BIENTOT_DEPASSE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  [TypeUrgence.APPAREIL_A_L_ARRET]: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  [TypeUrgence.ANOMALIE_API]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function UrgencesPanel({ groupes }: UrgencesPanelProps) {
  if (groupes.length === 0) {
    return (
      <Card title="Urgences" subtitle="Actions prioritaires">
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Aucune urgence en cours.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Urgences" subtitle="Actions prioritaires">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groupes.map((groupe) => {
          const Icone = ICONE[groupe.type];
          const tone = TONALITE[groupe.type];
          return (
            <div key={groupe.type} className={`rounded-lg border p-4 ${tone.bg} ${tone.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 font-semibold text-sm ${tone.text}`}>
                  <Icone className="h-4 w-4" />
                  {groupe.titre}
                </div>
                <span className={`text-xs font-bold rounded-full px-2 py-0.5 bg-white border ${tone.border} ${tone.text}`}>
                  {groupe.total}
                </span>
              </div>
              <ul className="space-y-2">
                {groupe.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={lienUrgence(groupe.type, item.id)}
                      className="block bg-white rounded-md border border-gray-200 px-3 py-2 transition-all hover:border-indigo-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{item.titre}</p>
                      <p className="text-xs text-gray-600 truncate">{item.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(item.dateHeure))}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              {groupe.total > groupe.items.length && (
                <p className={`text-xs mt-2 ${tone.text}`}>+ {groupe.total - groupe.items.length} autre(s)</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
