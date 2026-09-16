'use client';

/**
 * Filtres de la liste des rapports (section 9.1) — état local pour la
 * saisie, répercuté dans les query params de l'URL (partageable, et lu côté
 * serveur par app/rapports/page.tsx pour filtrer/paginer). Même convention
 * que app/interventions/components/FiltresInterventionsForm.tsx.
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { RattachementRapport, StatutValidationRapport, TypeRapport } from '@/domain/types';
import { LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { LIBELLE_RATTACHEMENT_RAPPORT } from '@/lib/derived/libelles-rapports';
import type { OptionsFiltresRapports } from '@/lib/derived/rapports-liste';

const LIBELLE_STATUT_VALIDATION: Record<StatutValidationRapport, string> = {
  [StatutValidationRapport.EN_ATTENTE]: 'En attente',
  [StatutValidationRapport.VALIDE]: 'Validé',
  [StatutValidationRapport.REFUSE_A_CORRIGER]: 'Refusé — à corriger',
};

interface FiltresRapportsFormProps {
  options: OptionsFiltresRapports;
}

export default function FiltresRapportsForm({ options }: FiltresRapportsFormProps) {
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

  const reinitialiser = () => router.push(pathname);
  const aDesFiltresActifs = Array.from(searchParams.keys()).some((k) => k !== 'page');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ChampSelect label="Type" value={searchParams.get('type') ?? ''} onChange={(v) => definirParametre('type', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(TypeRapport).map((type) => (
            <option key={type} value={type}>
              {LIBELLE_TYPE_RAPPORT[type]}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Appareil" value={searchParams.get('appareil') ?? ''} onChange={(v) => definirParametre('appareil', v || undefined)}>
          <option value="">Tous</option>
          {options.appareils.map((appareil) => (
            <option key={appareil.id} value={appareil.id}>
              {appareil.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Technicien" value={searchParams.get('technicien') ?? ''} onChange={(v) => definirParametre('technicien', v || undefined)}>
          <option value="">Tous</option>
          {options.techniciens.map((technicien) => (
            <option key={technicien.id} value={technicien.id}>
              {technicien.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Client" value={searchParams.get('client') ?? ''} onChange={(v) => definirParametre('client', v || undefined)}>
          <option value="">Tous</option>
          {options.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </ChampSelect>

        <label className="block text-xs font-medium text-gray-500">
          Date
          <input
            type="date"
            value={searchParams.get('date') ?? ''}
            onChange={(e) => definirParametre('date', e.target.value || undefined)}
            className="mt-1 w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </label>

        <ChampSelect label="Intervention" value={searchParams.get('intervention') ?? ''} onChange={(v) => definirParametre('intervention', v || undefined)}>
          <option value="">Toutes</option>
          {options.interventions.map((intervention) => (
            <option key={intervention.id} value={intervention.id}>
              {intervention.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Statut" value={searchParams.get('statut') ?? ''} onChange={(v) => definirParametre('statut', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(StatutValidationRapport).map((statut) => (
            <option key={statut} value={statut}>
              {LIBELLE_STATUT_VALIDATION[statut]}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Rattachement" value={searchParams.get('rattachement') ?? ''} onChange={(v) => definirParametre('rattachement', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(RattachementRapport).map((rattachement) => (
            <option key={rattachement} value={rattachement}>
              {LIBELLE_RATTACHEMENT_RAPPORT[rattachement]}
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
