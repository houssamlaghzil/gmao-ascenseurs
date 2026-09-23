'use client';

/**
 * Navigation principale — barre latérale (section 1.1 du cahier des
 * charges : navigation courte, sans sous-menus profonds).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
  ListTodo,
  Compass,
  Map,
  Gauge,
  Smartphone,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/explorer', label: 'Exploration', icon: Compass },
  { href: '/parc', label: 'Parc', icon: Building2 },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/maintenances', label: 'Maintenances', icon: ClipboardList },
  { href: '/conformite', label: 'Conformité', icon: Gauge },
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
  const { toggle, ancreRef } = useCommandPalette();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  /*
   * Focus de navigation.
   *
   * Un seul bloc glisse d'une entrée à l'autre au lieu qu'un fond s'allume ici
   * et s'éteigne là : le déplacement raconte le lien entre l'endroit d'où l'on
   * vient et celui où l'on va.
   *
   * Il se déplace à l'ENFONCEMENT du lien, pas à l'arrivée de la page. Les
   * pages sont rendues par le serveur à chaque navigation — près d'une seconde
   * pour le tableau de bord — et attendre le nouveau `pathname` ferait partir
   * le focus longtemps après le geste, ce qui donnerait exactement l'impression
   * de lourdeur qu'on cherche à supprimer.
   */
  const liensRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const [indexPresse, setIndexPresse] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ y: number; hauteur: number } | null>(null);

  const indexActif = NAV_ITEMS.findIndex(({ href }) => isActive(href));
  const indexAffiche = indexPresse ?? indexActif;

  useLayoutEffect(() => {
    const lien = indexAffiche >= 0 ? liensRef.current[indexAffiche] : null;
    setFocus(lien ? { y: lien.offsetTop, hauteur: lien.offsetHeight } : null);
  }, [indexAffiche]);

  // La navigation a abouti (ou a été abandonnée) : on rend la main à l'URL.
  useEffect(() => {
    setIndexPresse(null);
  }, [pathname]);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-gray-200 bg-white">
      <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-gray-200 shrink-0">
        <Building2 className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">
          Manei<span className="text-blue-600">-Lift</span>
        </span>
      </Link>

      <nav ref={navRef} className="relative flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Le bloc de focus est rendu sous les entrées, jamais entre elles :
            il est décoratif et ne doit pas intercepter le pointeur. */}
        <span
          aria-hidden
          className="focus-navigation pointer-events-none absolute left-3 right-3 rounded-md bg-blue-50"
          style={{
            transform: `translate3d(0, ${focus?.y ?? 0}px, 0)`,
            height: focus?.hauteur ?? 0,
            opacity: focus ? 1 : 0,
            top: 0,
          }}
        />

        {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            ref={(element) => {
              liensRef.current[index] = element;
            }}
            onPointerDown={() => setIndexPresse(index)}
            className={`surface-cliquable relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
              indexAffiche === index ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 shrink-0">
        <Link
          href="/mobile"
          className="flex items-center justify-center gap-2 px-3 py-2 mb-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
        >
          <Smartphone className="h-3.5 w-3.5" />
          Vue technicien (Android)
        </Link>
        <Link href="/taches" className="flex items-center gap-2 px-3 py-2 mb-1 text-sm text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"><ListTodo className="h-3.5 w-3.5" />Tâches</Link>
        {/* Ce bouton sert d'ancre à la palette : elle se déplie depuis sa
            position, y compris quand elle est ouverte au clavier. */}
        <button
          ref={ancreRef as React.RefObject<HTMLButtonElement>}
          onClick={toggle}
          className="surface-cliquable flex items-center justify-between w-full gap-2 px-3 py-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-md hover:border-blue-300"
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
