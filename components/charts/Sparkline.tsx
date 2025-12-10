'use client';

/**
 * Sparkline SVG - Mini graphique de tendance
 * Affiche une courbe simple avec gradient et animation
 */

import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  className?: string;
}

export default function Sparkline({
  data,
  width = 120,
  height = 40,
  color = '#6366f1',
  strokeWidth = 2,
  showDots = false,
  className = '',
}: SparklineProps) {
  const { path, points, gradientId } = useMemo(() => {
    if (data.length === 0) return { path: '', points: [], gradientId: '' };

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const pts = data.map((value, index) => ({
      x: padding + (index / (data.length - 1 || 1)) * chartWidth,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
    }));

    // Create smooth curve path
    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` Q ${prev.x} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    }
    if (pts.length > 1) {
      const last = pts[pts.length - 1];
      pathD += ` T ${last.x} ${last.y}`;
    }

    return {
      path: pathD,
      points: pts,
      gradientId: `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`,
    };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-gray-400 text-xs ${className}`}
        style={{ width, height }}
      >
        Pas de données
      </div>
    );
  }

  return (
    <svg width={width} height={height} className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={`${path} L ${points[points.length - 1]?.x || 0} ${height} L ${points[0]?.x || 0} ${height} Z`}
        fill={`url(#${gradientId})`}
        className="transition-all duration-500"
      />
      
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
      
      {/* Dots */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="white"
          stroke={color}
          strokeWidth={1.5}
        />
      ))}
      
      {/* Last point highlight */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={color}
          className="animate-pulse"
        />
      )}
    </svg>
  );
}
