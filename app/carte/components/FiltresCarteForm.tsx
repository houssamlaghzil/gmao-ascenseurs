'use client';

/**
 * Filtres du panneau de cartographie (section 13) — technicien, statut,
 * client, intervention (urgente), maintenance (en retard), plus l'option
 * explicite "afficher tous les appareils" qui lève la restriction de volume
 * par défaut (4 348 appareils : seuls les anomalies/urgences sont affichées
 * sans elle). Même mécanique que app/parc/components/FiltresAppareilsForm :
 * état répercuté dans les query params, lu côté serveur par app/carte/page.tsx.
 */

import { ReactNode, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import type { OptionsFiltresCarte } from '@/lib/derived/carte';

interface FiltresCarteFormProps {
  options: OptionsFiltresCarte;
}

export default function FiltresCarteForm({ options }: FiltresCarteFormProps) {
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

  const aDesFiltresActifs = Array.from(searchParams.keys()).length > 0;

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

        <ChampSelect label="Statut appareil" value={searchParams.get('statut') ?? ''} onChange={(v) => definirParametre('statut', v || undefined)}>
          <option value="">Tous</option>
          {Object.values(StatutAppareil).map((statut) => (
            <option key={statut} value={statut}>
              {LIBELLE_STATUT_APPAREIL[statut]}
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
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={searchParams.get('urgent') === '1'}
              onChange={(e) => definirParametre('urgent', e.target.checked ? '1' : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Intervention urgente en cours uniquement
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={searchParams.get('retardMaintenance') === '1'}
              onChange={(e) => definirParametre('retardMaintenance', e.target.checked ? '1' : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Maintenance en retard uniquement
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={searchParams.get('tous') === '1'}
              onChange={(e) => definirParametre('tous', e.target.checked ? '1' : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Afficher tous les appareils de la zone visible
          </label>
        </div>

        {aDesFiltresActifs && (
          <button onClick={() => router.push(pathname)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser les filtres
          </button>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        Position des techniciens en temps réel : accès réservé aux profils administratifs autorisés.
      </p>
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
