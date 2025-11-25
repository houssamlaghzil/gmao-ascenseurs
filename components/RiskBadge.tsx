/**
 * Badge de risque de panne (maintenance prédictive)
 * Couleurs froides selon les specs
 */

import { RiskLevel, RiskScore } from '@/domain/types';
import { getRiskColor } from '@/domain/risk-scoring';

interface RiskBadgeProps {
  riskScore: RiskScore;
  showScore?: boolean;
  showExplanation?: boolean;
  className?: string;
}

export default function RiskBadge({
  riskScore,
  showScore = true,
  showExplanation = false,
  className = '',
}: RiskBadgeProps) {
  const colors = getRiskColor(riskScore.level);

  const getLevelLabel = () => {
    switch (riskScore.level) {
      case RiskLevel.FAIBLE:
        return 'Risque faible';
      case RiskLevel.MODERE:
        return 'Risque modéré';
      case RiskLevel.ELEVE:
        return 'Risque élevé';
      default:
        return 'Risque inconnu';
    }
  };

  return (
    <div className={`${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
        title={riskScore.explication}
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{getLevelLabel()}</span>
        {showScore && (
          <span className="font-semibold">{riskScore.score}/100</span>
        )}
      </div>
      {showExplanation && (
        <p className="mt-1 text-xs text-gray-600">{riskScore.explication}</p>
      )}
    </div>
  );
}
