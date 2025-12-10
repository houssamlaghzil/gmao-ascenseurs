'use client';

/**
 * Navigation principale - Client Component
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCommandPalette } from '@/lib/contexts/CommandPaletteContext';
import {
  Building2,
  LayoutDashboard,
  Columns3,
  FileBarChart,
  Settings,
  Building,
  List,
  Search,
  BarChart3
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const { toggle } = useCommandPalette();
  const [isMac, setIsMac] = useState(false);

  // Détecter si on est sur Mac
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (prefix: string) => pathname?.startsWith(prefix);

  return (
    <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Building2 className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
            <h1 className="ml-3 text-xl font-bold text-gray-900">
              GMAO <span className="text-blue-600">Ascenseurs</span>
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link
              href="/gestion"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isActive('/gestion')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Gestion
            </Link>
            <Link
              href="/board"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isActive('/board')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <Columns3 className="h-4 w-4 mr-2" />
              Board Kanban
            </Link>
            {/* Données dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDataMenuOpen(true)}
              onMouseLeave={() => setDataMenuOpen(false)}
            >
              <button
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  isActivePrefix('/parcs') || isActivePrefix('/ascenseurs')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
                aria-haspopup="menu"
                aria-expanded={dataMenuOpen}
              >
                <List className="h-4 w-4 mr-2" />
                Données
                <svg
                  className={`ml-1 h-4 w-4 transition-transform ${dataMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              {dataMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/parcs"
                    className={`flex items-center px-3 py-2 text-sm transition-colors ${
                      isActivePrefix('/parcs') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="h-4 w-4 mr-2 text-blue-600" />
                    Liste des Parcs
                  </Link>
                  <Link
                    href="/ascenseurs"
                    className={`flex items-center px-3 py-2 text-sm transition-colors ${
                      isActivePrefix('/ascenseurs') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Columns3 className="h-4 w-4 mr-2 text-green-600" />
                    Liste des Ascenseurs
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/analytics"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isActive('/analytics')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
            <Link
              href="/rapports"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isActive('/rapports')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              Rapports IA
            </Link>

            {/* Bouton Command Palette */}
            <button
              onClick={toggle}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:border-blue-400 transition-all hover:shadow-sm"
              title="Ouvrir la palette de commandes"
            >
              <Search className="h-3.5 w-3.5" />
              <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-xs">
                <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>
                <span>K</span>
              </kbd>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
