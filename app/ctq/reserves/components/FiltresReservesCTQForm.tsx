'use client';

/**
 * Filtres de la liste des réserves CTQ (section 10.3) — état local pour la
 * saisie, répercuté dans les query params de l'URL. Même convention que
 * app/ctq/components/FiltresControlesCTQForm.tsx, avec un filtre "en retard"
 * en plus (case à cocher, domain/business-logic.estReserveEnRetard).
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { GraviteReserve, StatutReserve } from '@/domain/types';
import type { OptionFiltre } from '@/lib/derived/parc-liste';

const LIBELLE_STATUT_RESERVE: Record<StatutReserve, string> = {
  [StatutReserve.A_TRAITER]: 'À traiter',
  [StatutReserve.PLANIFIEE]: 'Planifiée',
  [StatutReserve.EN_COURS]: 'En cours',
  [StatutReserve.TRAITEE]: 'Traitée',
  [StatutReserve.A_CONTROLER]: 'À contrôler',
  [StatutReserve.VALIDEE]: 'Validée',
};

const LIBELLE_GRAVITE_RESERVE: Record<GraviteReserve, string> = {
  [GraviteReserve.MINEURE]: 'Mineure',
  [GraviteReserve.MAJEURE]: 'Majeure',
  [GraviteReserve.CRITIQUE]: 'Critique',
};

interface FiltresReservesCTQFormProps {
  clients: OptionFiltre[];
  techniciens: OptionFiltre[];
}

export default function FiltresReservesCTQForm({ clients, techniciens }: FiltresReservesCTQFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const definirParametre = useCallback(
    (cle: string, valeur: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valeur) params.set(cle, valeur);
      else params.delete(cle);
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const basculerEnRetard = useCallback(() => {
    definirParametre('retard', searchParams.get('retard') === '1' ? undefined : '1');
  }, [definirParametre, searchParams]);

  const reinitialiser = () => router.push(pathname);
  const aDesFiltresActifs = Array.from(searchParams.keys()).some((k) => k !== 'page');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ChampSelect label="Statut" value={searchParams.get('statut') ?? ''} onChange={(v) => definirParametre('statut', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(StatutReserve).map((statut) => (
            <option key={statut} value={statut}>
              {LIBELLE_STATUT_RESERVE[statut]}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Gravité" value={searchParams.get('gravite') ?? ''} onChange={(v) => definirParametre('gravite', v || undefined)}>
          <option value="">Toutes</option>
          {Object.values(GraviteReserve).map((gravite) => (
            <option key={gravite} value={gravite}>
              {LIBELLE_GRAVITE_RESERVE[gravite]}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Client" value={searchParams.get('client') ?? ''} onChange={(v) => definirParametre('client', v || undefined)}>
          <option value="">Tous</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Technicien" value={searchParams.get('technicien') ?? ''} onChange={(v) => definirParametre('technicien', v || undefined)}>
          <option value="">Tous</option>
          {techniciens.map((technicien) => (
            <option key={technicien.id} value={technicien.id}>
              {technicien.label}
            </option>
          ))}
        </ChampSelect>
      </div>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={searchParams.get('retard') === '1'}
            onChange={basculerEnRetard}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          En retard uniquement
        </label>

        {aDesFiltresActifs && (
          <button onClick={reinitialiser} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser les filtres
          </button>
        )}
      </div>
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
