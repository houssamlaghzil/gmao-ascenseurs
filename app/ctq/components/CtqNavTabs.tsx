/**
 * Sous-navigation Contrôles / Réserves de la section CTQ (section 10) —
 * deux pages distinctes (/ctq et /ctq/reserves) plutôt qu'un onglet client,
 * pour que chacune garde ses propres filtres/pagination dans l'URL sans
 * collision de query params.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CtqNavTabsProps {
  actif: 'controles' | 'reserves';
}

const ONGLETS = [
  { id: 'controles' as const, label: 'Contrôles', href: '/ctq' },
  { id: 'reserves' as const, label: 'Réserves', href: '/ctq/reserves' },
];

export default function CtqNavTabs({ actif }: CtqNavTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-6">
        {ONGLETS.map((onglet) => (
          <Link
            key={onglet.id}
            href={onglet.href}
            className={cn(
              'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium',
              actif === onglet.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            {onglet.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
