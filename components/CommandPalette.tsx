'use client';

/**
 * Command Palette — navigation rapide (Cmd+K / Ctrl+K, section 39 : recherche
 * globale). Navigation statique vers les 11 sections + recherche serveur
 * d'appareils/clients/interventions.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Wrench,
  FileBarChart,
  ShieldCheck,
  CalendarDays,
  Users,
  FileSignature,
  Plug,
  Settings,
  ListTodo,
  Search,
  X,
} from 'lucide-react';
import { useCommandPalette } from '@/lib/contexts/CommandPaletteContext';

const PAGES = [
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
  { href: '/taches', label: 'Tâches', icon: ListTodo },
];

interface RechercheResultats {
  appareils: { id: string; code: string; adresse: string; ville: string }[];
  clients: { id: string; nom: string; ville: string }[];
  interventions: { id: string; numero: string; statut: string }[];
}

export default function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPalette();
  const [search, setSearch] = useState('');
  const [resultats, setResultats] = useState<RechercheResultats>({ appareils: [], clients: [], interventions: [] });
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResultats({ appareils: [], clients: [], interventions: [] });
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/recherche?q=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then(setResultats)
        .catch(() => setResultats({ appareils: [], clients: [], interventions: [] }));
    }, 200);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSelect = useCallback(
    (callback: () => void) => {
      setOpen(false);
      setSearch('');
      callback();
    },
    [setOpen]
  );

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
              placeholder="Rechercher une page, un appareil, un client, une intervention..."
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-gray-400"
            />
            <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">Aucun résultat trouvé.</Command.Empty>

            <Command.Group heading="Pages" className="text-xs font-semibold text-gray-500 px-2 py-2">
              {PAGES.map(({ href, label, icon: Icon }) => (
                <Command.Item
                  key={href}
                  onSelect={() => handleSelect(() => router.push(href))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {resultats.appareils.length > 0 && (
              <Command.Group heading="Appareils" className="text-xs font-semibold text-gray-500 px-2 py-2 mt-2">
                {resultats.appareils.map((a) => (
                  <Command.Item
                    key={a.id}
                    onSelect={() => handleSelect(() => router.push(`/parc/${a.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium">{a.code}</div>
                      <div className="text-xs text-gray-500">{a.adresse} — {a.ville}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {resultats.clients.length > 0 && (
              <Command.Group heading="Clients" className="text-xs font-semibold text-gray-500 px-2 py-2 mt-2">
                {resultats.clients.map((c) => (
                  <Command.Item
                    key={c.id}
                    onSelect={() => handleSelect(() => router.push(`/contrats?client=${c.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Users className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium">{c.nom}</div>
                      <div className="text-xs text-gray-500">{c.ville}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {resultats.interventions.length > 0 && (
              <Command.Group heading="Interventions" className="text-xs font-semibold text-gray-500 px-2 py-2 mt-2">
                {resultats.interventions.map((i) => (
                  <Command.Item
                    key={i.id}
                    onSelect={() => handleSelect(() => router.push(`/interventions/${i.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Wrench className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-medium">{i.numero}</div>
                      <div className="text-xs text-gray-500">{i.statut}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
            <span>
              Appuyez sur <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Échap</kbd> pour fermer
            </span>
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
