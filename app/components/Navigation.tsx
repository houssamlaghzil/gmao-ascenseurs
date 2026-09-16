'use client';

/**
 * Navigation principale — barre latérale (section 1.1 du cahier des
 * charges : navigation courte, sans sous-menus profonds).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCommandPalette } from '@/lib/contexts/CommandPaletteContext';
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  FileBarChart,
  ShieldCheck,
  CalendarDays,
  Users,
  FileSignature,
  Plug,
  Settings,
  Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/parc', label: 'Parc', icon: Building2 },
  { href: '/maintenances', label: 'Maintenances', icon: ClipboardList },
  { href: '/interventions', label: 'Interventions', icon: Wrench },
  { href: '/rapports', label: 'Rapports', icon: FileBarChart },
  { href: '/ctq', label: 'CTQ / Réserves', icon: ShieldCheck },
  { href: '/planning', label: 'Planning', icon: CalendarDays },
  { href: '/techniciens', label: 'Techniciens', icon: Users },
  { href: '/contrats', label: 'Contrats', icon: FileSignature },
  { href: '/integrations', label: 'Intégrations', icon: Plug },
  { href: '/administration', label: 'Administration', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();
  const { toggle } = useCommandPalette();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-gray-200 bg-white">
      <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-gray-200 shrink-0">
        <Building2 className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">
          Manei<span className="text-blue-600">-Lift</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive(href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 shrink-0">
        <button
          onClick={toggle}
          className="flex items-center justify-between w-full gap-2 px-3 py-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-md hover:border-blue-300 transition-colors"
          title="Ouvrir la palette de commandes"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Rechercher
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-xs text-gray-400">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </kbd>
        </button>
      </div>
    </aside>
  );
}
