'use client';

/**
 * Donut Chart SVG animé
 * Affiche une répartition en segments colorés avec animation au chargement
 */

import { useEffect, useState } from 'react';

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export default function DonutChart({
  segments,
  size = 200,
  strokeWidth = 24,
  className = '',
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          
          {/* Segments */}
          {segments.map((segment, index) => {
            const segmentLength = (segment.value / total) * circumference * animationProgress;
            const offset = currentOffset;
            currentOffset += (segment.value / total) * circumference;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ transitionDelay: `${index * 100}ms` }}
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-3xl font-bold text-gray-900">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-sm text-gray-500">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-600">{segment.label}</span>
              <span className="text-sm font-semibold text-gray-900 ml-auto">
                {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
