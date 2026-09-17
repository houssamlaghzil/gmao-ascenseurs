/**
 * Mini-bloc "Top ascenseurs à risque" (maintenance prédictive) — préservé
 * depuis l'ancien tableau de bord, recalculé sur le nouveau modèle via
 * getRiskScoreForAscenseur (domain/risk-scoring.ts, inchangé).
 */

import Link from 'next/link';
import Card from '@/components/Card';
import RiskBadge from '@/components/RiskBadge';
import Sparkline from '@/components/charts/Sparkline';
import { AscenseurRisqueAffiche } from '@/lib/derived/dashboard';
import { RiskLevel } from '@/domain/types';
import { lienAppareil } from '@/lib/derived/explorer';

interface RisqueAscenseursPanelProps {
  items: AscenseurRisqueAffiche[];
}

const COULEUR_TENDANCE: Record<RiskLevel, string> = {
  [RiskLevel.FAIBLE]: '#3b82f6',
  [RiskLevel.MODERE]: '#a855f7',
  [RiskLevel.ELEVE]: '#f43f5e',
};

export default function RisqueAscenseursPanel({ items }: RisqueAscenseursPanelProps) {
  return (
    <Card title="Maintenance prédictive" subtitle="Top ascenseurs à risque de panne (7 jours)">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune donnée de risque disponible.</p>
      ) : (
        <div className="space-y-3">
          {items.map(({ ascenseur, risk, tendance7j }) => (
            <Link
              key={ascenseur.id}
              href={lienAppareil(ascenseur.id)}
              className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{ascenseur.code} — {ascenseur.ville}</p>
                <div className="mt-1">
                  <RiskBadge riskScore={risk} />
                </div>
              </div>
              <Sparkline data={tendance7j} width={80} height={28} color={COULEUR_TENDANCE[risk.level]} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
