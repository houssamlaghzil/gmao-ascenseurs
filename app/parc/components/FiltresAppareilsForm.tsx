'use client';

/**
 * Filtres de la liste des appareils (section 4.1) — état local pour la
 * saisie, répercuté dans les query params de l'URL (partageable, et lu
 * côté serveur par app/parc/page.tsx pour filtrer/paginer).
 */

import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, RotateCcw } from 'lucide-react';
import { StatutAppareil, CategorieMaintenance } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL, LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import type { OptionsFiltresAppareils } from '@/lib/derived/parc-liste';

interface FiltresAppareilsFormProps {
  options: OptionsFiltresAppareils;
}

export default function FiltresAppareilsForm({ options }: FiltresAppareilsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    setRecherche(searchParams.get('q') ?? '');
  }, [searchParams]);

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

  const soumettreRecherche = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    definirParametre('q', recherche.trim() || undefined);
  };

  const reinitialiser = () => {
    setRecherche('');
    router.push(pathname);
  };

  const aDesFiltresActifs = Array.from(searchParams.keys()).some((k) => k !== 'page');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <form onSubmit={soumettreRecherche} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un code, une adresse, une ville, une référence, un numéro de téléalarme..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Rechercher
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ChampSelect label="Statut" value={searchParams.get('statut') ?? ''} onChange={(v) => definirParametre('statut', v || undefined)}>
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

        <ChampSelect label="Contrat" value={searchParams.get('contrat') ?? ''} onChange={(v) => definirParametre('contrat', v || undefined)}>
          <option value="">Tous</option>
          {options.contrats.map((contrat) => (
            <option key={contrat.id} value={contrat.id}>
              {contrat.label}
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

        <ChampSelect label="Tournée" value={searchParams.get('tournee') ?? ''} onChange={(v) => definirParametre('tournee', v || undefined)}>
          <option value="">Toutes</option>
          {options.tournees.map((tournee) => (
            <option key={tournee.id} value={tournee.id}>
              {tournee.label}
            </option>
          ))}
        </ChampSelect>

        <ChampSelect label="Ville" value={searchParams.get('ville') ?? ''} onChange={(v) => definirParametre('ville', v || undefined)}>
          <option value="">Toutes</option>
          {options.villes.map((ville) => (
            <option key={ville} value={ville}>
              {ville}
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

        <ChampSelect
          label="Type de maintenance"
          value={searchParams.get('typeMaintenance') ?? ''}
          onChange={(v) => definirParametre('typeMaintenance', v || undefined)}
        >
          <option value="">Tous</option>
          {Object.values(CategorieMaintenance).map((categorie) => (
            <option key={categorie} value={categorie}>
              {LIBELLE_CATEGORIE_MAINTENANCE[categorie]}
            </option>
          ))}
        </ChampSelect>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={searchParams.get('retard') === '1'}
              onChange={(e) => definirParametre('retard', e.target.checked ? '1' : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            En retard de maintenance
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={searchParams.get('degrade') === '1'}
              onChange={(e) => definirParametre('degrade', e.target.checked ? '1' : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Mode dégradé
          </label>
        </div>

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
