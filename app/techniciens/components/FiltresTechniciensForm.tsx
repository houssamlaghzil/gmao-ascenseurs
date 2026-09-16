'use client';

/**
 * Filtres de l'écran Techniciens (section 12) — état local pour la saisie,
 * répercuté dans les query params de l'URL. Même convention que
 * app/interventions/components/FiltresInterventionsForm.tsx.
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import type { OptionFiltre } from '@/lib/derived/parc-liste';

interface FiltresTechniciensFormProps {
  secteurs: OptionFiltre[];
}

export default function FiltresTechniciensForm({ secteurs }: FiltresTechniciensFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const definirParametre = useCallback(
    (cle: string, valeur: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valeur) params.set(cle, valeur);
      else params.delete(cle);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const reinitialiser = () => router.push(pathname);
  const aDesFiltresActifs = Array.from(searchParams.keys()).length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block text-xs font-medium text-gray-500">
          Rechercher
          <input
            type="text"
            defaultValue={searchParams.get('recherche') ?? ''}
            onChange={(e) => definirParametre('recherche', e.target.value || undefined)}
            placeholder="Nom du technicien…"
            className="mt-1 w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </label>

        <ChampSelect label="Secteur" value={searchParams.get('secteur') ?? ''} onChange={(v) => definirParametre('secteur', v || undefined)}>
          <option value="">Tous</option>
          {secteurs.map((secteur) => (
            <option key={secteur.id} value={secteur.id}>
              {secteur.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Statut du compte" value={searchParams.get('actif') ?? ''} onChange={(v) => definirParametre('actif', v || undefined)}>
          <option value="">Tous</option>
          <option value="actifs">Actifs</option>
          <option value="archives">Archivés</option>
        </ChampSelect>
      </div>

      {aDesFiltresActifs && (
        <div className="flex justify-end">
          <button onClick={reinitialiser} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}

interface ChampSelectProps {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  children: ReactNode;
}

function ChampSelect({ label, value, onChange, children }: ChampSelectProps) {
  return (
    <label className="block text-xs font-medium text-gray-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
      >
        {children}
      </select>
    </label>
  );
}
