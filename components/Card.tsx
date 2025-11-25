/**
 * Composant Card générique
 */

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', title, subtitle, onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 shadow-sm';
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';

  return (
    <div className={`${baseClasses} ${clickableClasses} ${className}`} onClick={onClick}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
