'use client';

/**
 * Filtres de l'écran Planning (section 11) — état local pour la saisie,
 * répercuté dans les query params de l'URL. Même convention que
 * app/maintenances/components/FiltresMaintenancesForm.tsx.
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import type { OptionsFiltresPlanning } from '@/lib/derived/planning';

interface FiltresPlanningFormProps {
  options: OptionsFiltresPlanning;
}

export default function FiltresPlanningForm({ options }: FiltresPlanningFormProps) {
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

  const reinitialiser = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const cle of ['technicien', 'tournee', 'secteur']) params.delete(cle);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const aDesFiltresActifs = ['technicien', 'tournee', 'secteur'].some((cle) => searchParams.get(cle));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ChampSelect label="Technicien" value={searchParams.get('technicien') ?? ''} onChange={(v) => definirParametre('technicien', v || undefined)}>
          <option value="">Tous</option>
          {options.techniciens.map((technicien) => (
            <option key={technicien.id} value={technicien.id}>
              {technicien.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Tournée" value={searchParams.get('tournee') ?? ''} onChange={(v) => definirParametre('tournee', v || undefined)}>
          <option value="">Toutes</option>
          {options.tournees.map((tournee) => (
            <option key={tournee.id} value={tournee.id}>
              {tournee.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Secteur" value={searchParams.get('secteur') ?? ''} onChange={(v) => definirParametre('secteur', v || undefined)}>
          <option value="">Tous</option>
          {options.secteurs.map((secteur) => (
            <option key={secteur.id} value={secteur.id}>
              {secteur.label}
            </option>
          ))}
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
