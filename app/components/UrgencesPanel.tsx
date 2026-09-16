/**
 * Bloc "Urgences" du tableau de bord (cahier des charges, section 3.3) :
 * liste courte et priorisée, groupée par nature d'urgence.
 */

import Link from 'next/link';
import { ComponentType } from 'react';
import Card from '@/components/Card';
import { formatDistanceToNow } from '@/lib/utils';
import { GroupeUrgence, TypeUrgence } from '@/lib/derived/dashboard';
import { AlertOctagon, Clock, TimerOff, AlertTriangle, PlugZap, CheckCircle2 } from 'lucide-react';

interface UrgencesPanelProps {
  groupes: GroupeUrgence[];
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
                {groupe.items.map((item) => {
                  const contenu = (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">{item.titre}</p>
                      <p className="text-xs text-gray-600 truncate">{item.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(item.dateHeure))}</p>
                    </>
                  );
                  return (
                    <li key={item.id} className="bg-white rounded-md border border-gray-200 px-3 py-2">
                      {item.href ? (
                        <Link href={item.href} className="hover:underline block">
                          {contenu}
                        </Link>
                      ) : (
                        contenu
                      )}
                    </li>
                  );
                })}
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
