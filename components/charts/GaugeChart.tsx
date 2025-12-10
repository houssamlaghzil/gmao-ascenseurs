'use client';

/**
 * Gauge Chart SVG - Jauge semi-circulaire avec gradient
 * Affiche un pourcentage ou score avec animation
 */

import { useEffect, useState } from 'react';

interface GaugeChartProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  colorStops?: { offset: string; color: string }[];
}

export default function GaugeChart({
  value,
  max = 100,
  label,
  size = 120,
  strokeWidth = 12,
  className = '',
  colorStops = [
    { offset: '0%', color: '#22c55e' },
    { offset: '50%', color: '#eab308' },
    { offset: '100%', color: '#ef4444' },
  ],
}: GaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const normalizedValue = Math.min(Math.max(animatedValue, 0), max);
  const percentage = (normalizedValue / max) * 100;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-circle
  const progress = (percentage / 100) * circumference;
  const center = size / 2;
  
  const gradientId = `gauge-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + strokeWidth} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {colorStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle indicator */}
          <g transform={`rotate(${-90 + (percentage / 100) * 180}, ${center}, ${size / 2})`}>
            <circle
              cx={center}
              cy={strokeWidth / 2}
              r={6}
              fill="white"
              stroke="#374151"
              strokeWidth={2}
              className="transition-all duration-1000 ease-out"
            />
          </g>
        </svg>
        
        {/* Center value */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: 0 }}
        >
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(normalizedValue)}
            <span className="text-sm font-normal text-gray-500">%</span>
          </span>
        </div>
      </div>
      
      {label && (
        <span className="text-sm text-gray-600 mt-1">{label}</span>
      )}
    </div>
  );
}
