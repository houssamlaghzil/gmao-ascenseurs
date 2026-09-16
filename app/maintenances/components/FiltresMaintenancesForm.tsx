'use client';

/**
 * Filtres de l'écran Maintenances (section 6) — état local pour la saisie,
 * répercuté dans les query params de l'URL (partageable, et lu côté serveur
 * par app/maintenances/page.tsx pour filtrer la vue prioritaire ET la vue
 * calendrier). Toute modification réinitialise la pagination des 3 groupes
 * de la vue prioritaire, dont le contenu change avec le filtre.
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { CategorieMaintenance } from '@/domain/types';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import type { OptionsFiltresMaintenances } from '@/lib/derived/maintenances-liste';

const PARAMS_PAGINATION = ['pageRetard', 'pageSemaine', 'pageAVenir'];

interface FiltresMaintenancesFormProps {
  options: OptionsFiltresMaintenances;
}

export default function FiltresMaintenancesForm({ options }: FiltresMaintenancesFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const definirParametre = useCallback(
    (cle: string, valeur: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valeur) params.set(cle, valeur);
      else params.delete(cle);
      for (const p of PARAMS_PAGINATION) params.delete(p);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const reinitialiser = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const cle of ['technicien', 'tournee', 'contrat', 'categorie', ...PARAMS_PAGINATION]) params.delete(cle);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const aDesFiltresActifs = ['technicien', 'tournee', 'contrat', 'categorie'].some((cle) => searchParams.get(cle));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        <ChampSelect label="Contrat" value={searchParams.get('contrat') ?? ''} onChange={(v) => definirParametre('contrat', v || undefined)}>
          <option value="">Tous</option>
          {options.contrats.map((contrat) => (
            <option key={contrat.id} value={contrat.id}>
              {contrat.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Catégorie" value={searchParams.get('categorie') ?? ''} onChange={(v) => definirParametre('categorie', v || undefined)}>
          <option value="">Toutes</option>
          {Object.values(CategorieMaintenance).map((categorie) => (
            <option key={categorie} value={categorie}>
              {LIBELLE_CATEGORIE_MAINTENANCE[categorie]}
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
