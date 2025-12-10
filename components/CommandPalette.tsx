'use client';

/**
 * Command Palette - Navigation rapide au clavier (Cmd+K / Ctrl+K)
 * Permet aux utilisateurs de naviguer rapidement dans l'application
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { 
  Home, 
  LayoutGrid, 
  Settings, 
  Building2, 
  Users, 
  FileText, 
  Search,
  X 
} from 'lucide-react';
import { useParcs, useAscenseurs } from '@/lib/react-query/hooks';
import { useCommandPalette } from '@/lib/contexts/CommandPaletteContext';

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [search, setSearch] = useState('');
  const router = useRouter();
  
  const { data: parcs = [] } = useParcs();
  const { data: ascenseurs = [] } = useAscenseurs();

  // Toggle avec Cmd+K ou Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    setSearch('');
    callback();
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Command className="rounded-lg border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Rechercher une page, un parc, un ascenseur..."
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-gray-400"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              Aucun résultat trouvé.
            </Command.Empty>

            {/* Pages principales */}
            <Command.Group heading="Pages" className="text-xs font-semibold text-gray-500 px-2 py-2">
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Home className="h-4 w-4 text-gray-600" />
                <span>Tableau de bord</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/gestion'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-600" />
                <span>Gestion</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/board'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <LayoutGrid className="h-4 w-4 text-gray-600" />
                <span>Board Kanban</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/rapports'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-4 w-4 text-gray-600" />
                <span>Rapports</span>
              </Command.Item>
            </Command.Group>

            {/* Parcs */}
            {parcs.length > 0 && (
              <Command.Group heading="Parcs" className="text-xs font-semibold text-gray-500 px-2 py-2 mt-2">
                {parcs.slice(0, 5).map((parc) => (
                  <Command.Item
                    key={parc.id}
                    onSelect={() => handleSelect(() => router.push(`/parcs/${parc.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium">{parc.nom}</div>
                      <div className="text-xs text-gray-500">{parc.ville}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Ascenseurs */}
            {ascenseurs.length > 0 && (
              <Command.Group heading="Ascenseurs" className="text-xs font-semibold text-gray-500 px-2 py-2 mt-2">
                {ascenseurs.slice(0, 5).map((ascenseur) => (
                  <Command.Item
                    key={ascenseur.id}
                    onSelect={() => handleSelect(() => router.push(`/ascenseurs/${ascenseur.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Users className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium">{ascenseur.nom}</div>
                      <div className="text-xs text-gray-500">
                        {ascenseur.referenceTechnique || 'Sans référence'}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer avec raccourci */}
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Appuyez sur <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Échap</kbd> pour fermer</span>
            <span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">↓</kbd> pour naviguer
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
