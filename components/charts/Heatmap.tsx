'use client';

/**
 * Heatmap style GitHub contributions
 * Affiche 90 jours d'activité avec intensité colorée
 */

import { useMemo, useState } from 'react';

interface HeatmapDay {
  date: string;
  count: number;
  pannes: number;
  reparations: number;
}

interface HeatmapProps {
  data: HeatmapDay[];
  className?: string;
}

export default function Heatmap({ data, className = '' }: HeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { weeks, maxCount } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    
    // Organiser en semaines (colonnes de 7 jours)
    const weeksArr: HeatmapDay[][] = [];
    for (let i = 0; i < data.length; i += 7) {
      weeksArr.push(data.slice(i, i + 7));
    }
    
    return { weeks: weeksArr, maxCount: max };
  }, [data]);

  const getColor = (count: number): string => {
    if (count === 0) return '#f3f4f6';
    const intensity = count / maxCount;
    if (intensity < 0.25) return '#c7d2fe';
    if (intensity < 0.5) return '#a5b4fc';
    if (intensity < 0.75) return '#818cf8';
    return '#6366f1';
  };

  const handleMouseEnter = (day: HeatmapDay, e: React.MouseEvent) => {
    setHoveredDay(day);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Légende mois */}
      <div className="flex gap-1 mb-2 text-xs text-gray-500 pl-8">
        {['', '', 'Il y a 2 mois', '', '', 'Il y a 1 mois', '', '', '', 'Cette semaine'].map((label, i) => (
          <span key={i} className="w-[52px] text-center">{label}</span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Labels jours */}
        <div className="flex flex-col gap-[3px] text-xs text-gray-500 pr-2">
          <span className="h-3">L</span>
          <span className="h-3">M</span>
          <span className="h-3">M</span>
          <span className="h-3">J</span>
          <span className="h-3">V</span>
          <span className="h-3">S</span>
          <span className="h-3">D</span>
        </div>

        {/* Grille */}
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="w-3 h-3 rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1"
                  style={{ backgroundColor: getColor(day.count) }}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Légende intensité */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Moins</span>
        <div className="flex gap-[2px]">
          {['#f3f4f6', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'].map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span>Plus</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 60,
          }}
        >
          <div className="font-semibold mb-1">{formatDate(hoveredDay.date)}</div>
          <div className="flex flex-col gap-0.5">
            <span>{hoveredDay.count} événement{hoveredDay.count > 1 ? 's' : ''}</span>
            <span className="text-rose-300">{hoveredDay.pannes} panne{hoveredDay.pannes > 1 ? 's' : ''}</span>
            <span className="text-emerald-300">{hoveredDay.reparations} réparation{hoveredDay.reparations > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
