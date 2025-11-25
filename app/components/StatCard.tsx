'use client';

/**
 * Carte de statistique cliquable avec animation de transition
 */

import { useRouter } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'yellow';
  href: string;
}

const colorClasses = {
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    hover: 'hover:border-blue-600 hover:shadow-blue-100',
  },
  green: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    hover: 'hover:border-emerald-600 hover:shadow-emerald-100',
  },
  red: {
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-500',
    hover: 'hover:border-rose-600 hover:shadow-rose-100',
  },
  yellow: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    hover: 'hover:border-amber-600 hover:shadow-amber-100',
  },
};

export default function StatCard({ label, value, icon: Icon, color, href }: StatCardProps) {
  const router = useRouter();
  const [isExpanding, setIsExpanding] = useState(false);
  const classes = colorClasses[color];

  const handleClick = () => {
    setIsExpanding(true);
    
    // Animation de l'expansion
    const card = document.getElementById(`stat-card-${label}`);
    if (card) {
      const rect = card.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.className = `fixed ${classes.bg} z-50 transition-all duration-1000 ease-in-out`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.borderRadius = '0.5rem';
      
      document.body.appendChild(overlay);
      
      // Forcer le reflow
      overlay.offsetHeight;
      
      // Expansion
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.borderRadius = '0';
      
      setTimeout(() => {
        router.push(href);
        document.body.removeChild(overlay);
        setIsExpanding(false);
      }, 1000);
    } else {
      // Fallback si l'animation échoue
      router.push(href);
      setIsExpanding(false);
    }
  };

  return (
    <button
      id={`stat-card-${label}`}
      onClick={handleClick}
      disabled={isExpanding}
      className={`bg-white rounded-lg border-2 border-gray-200 p-6 shadow-sm transition-all duration-300 cursor-pointer
        ${classes.hover} hover:scale-105 hover:shadow-lg
        ${isExpanding ? 'scale-110 opacity-0' : ''}
        disabled:cursor-not-allowed
      `}
    >
      <div className="flex items-center justify-between">
        <div className="text-left">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-3xl font-bold ${classes.text} mt-2`}>{value}</p>
        </div>
        <Icon className={`h-12 w-12 ${classes.text} opacity-20`} />
      </div>
      <div className="mt-3 flex items-center text-xs text-gray-500">
        <span>Cliquez pour voir le détail</span>
        <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
