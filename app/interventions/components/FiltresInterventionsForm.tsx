'use client';

/**
 * Filtres de la liste des interventions (section 7.1) — état local pour la
 * saisie, répercuté dans les query params de l'URL (partageable, et lu côté
 * serveur par app/interventions/page.tsx pour filtrer/paginer). Même
 * convention que app/parc/components/FiltresAppareilsForm.tsx.
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { EtatSLA, PrioriteIntervention, SourceTicket, StatutIntervention } from '@/domain/types';
import {
  LIBELLE_ETAT_SLA,
  LIBELLE_PRIORITE_INTERVENTION,
  LIBELLE_SOURCE_TICKET,
  LIBELLE_STATUT_INTERVENTION,
} from '@/lib/derived/libelles-interventions';
import type { OptionFiltre } from '@/lib/derived/parc-liste';

interface FiltresInterventionsFormProps {
  techniciens: OptionFiltre[];
}

export default function FiltresInterventionsForm({ techniciens }: FiltresInterventionsFormProps) {
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ChampSelect label="Statut" value={searchParams.get('statut') ?? ''} onChange={(v) => definirParametre('statut', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(StatutIntervention).map((statut) => (
            <option key={statut} value={statut}>
              {LIBELLE_STATUT_INTERVENTION[statut]}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Priorité" value={searchParams.get('priorite') ?? ''} onChange={(v) => definirParametre('priorite', v || undefined)}>
          <option value="">Toutes</option>
          {Object.values(PrioriteIntervention).map((priorite) => (
            <option key={priorite} value={priorite}>
              {LIBELLE_PRIORITE_INTERVENTION[priorite]}
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

        <ChampSelect label="État SLA" value={searchParams.get('sla') ?? ''} onChange={(v) => definirParametre('sla', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(EtatSLA).map((etat) => (
            <option key={etat} value={etat}>
              {LIBELLE_ETAT_SLA[etat]}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Source" value={searchParams.get('source') ?? ''} onChange={(v) => definirParametre('source', v || undefined)}>
          <option value="">Toutes</option>
          {Object.values(SourceTicket).map((source) => (
            <option key={source} value={source}>
              {LIBELLE_SOURCE_TICKET[source]}
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
