'use client';

/**
 * Assistant de réalisation d'une maintenance (section 31) : sélection
 * multi-catégories → checklist tactile (31.3) → test téléalarme obligatoire
 * (31.4) → durée de présence + validation (31.5). Toute la progression vit
 * en état local (pas de brouillon persisté entre étapes, comme
 * DiagnosticWizard côté interventions) ; un seul appel serveur à la fin.
 */

import { useEffect, useMemo, useState, useTransition } from 'react';
import { ChevronLeft } from 'lucide-react';
import { CategorieMaintenance, ChecklistItemMaintenance, ResultatTestTelealarme } from '@/domain/types';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import { genererChecklistMaintenance } from '@/lib/derived/checklist-maintenance';
import { validerMaintenance } from './actions';

const CATEGORIES_DISPONIBLES = [
  CategorieMaintenance.PERIODIQUE,
  CategorieMaintenance.CABLE,
  CategorieMaintenance.PARACHUTE,
  CategorieMaintenance.NETTOYAGE,
] as const;

type Etape = 'categories' | 'checklist' | 'telealarme' | 'recap';

interface MaintenanceWizardProps {
  maintenanceId: string;
  categoriesInitiales: CategorieMaintenance[];
  seuilDureeMinimaleMinutes: number;
  heureDebutExistante?: string;
}

export default function MaintenanceWizard({
  maintenanceId,
  categoriesInitiales,
  seuilDureeMinimaleMinutes,
  heureDebutExistante,
}: MaintenanceWizardProps) {
  const [etape, setEtape] = useState<Etape>('categories');
  const [categories, setCategories] = useState<CategorieMaintenance[]>(categoriesInitiales.length > 0 ? categoriesInitiales : [CategorieMaintenance.PERIODIQUE]);
  const [checklist, setChecklist] = useState<ChecklistItemMaintenance[]>([]);
  const [telealarme, setTelealarme] = useState<ResultatTestTelealarme>();
  const [isPending, startTransition] = useTransition();

  // Référence de début de visite fixée une seule fois (heure réelle si la
  // visite était déjà en cours, sinon l'instant d'ouverture de l'assistant).
  const [debutMs] = useState(() => (heureDebutExistante ? new Date(heureDebutExistante).getTime() : Date.now()));
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const intervalle = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(intervalle);
  }, []);

  const dureeEcouleeSecondes = Math.max(0, Math.floor((maintenant - debutMs) / 1000));
  const dureeEcouleeMinutes = Math.floor(dureeEcouleeSecondes / 60);
  const seuilNonRespecte = dureeEcouleeMinutes < seuilDureeMinimaleMinutes;

  const basculerCategorie = (categorie: CategorieMaintenance) => {
    setCategories((c) => (c.includes(categorie) ? c.filter((x) => x !== categorie) : [...c, categorie]));
  };

  const passerAuxChecklists = () => {
    setChecklist(genererChecklistMaintenance(categories));
    setEtape('checklist');
  };

  const basculerItemChecklist = (id: string) => {
    setChecklist((items) => items.map((item) => (item.id === id ? { ...item, coche: !item.coche } : item)));
  };

  const obligatoiresRestants = checklist.filter((item) => item.obligatoire && !item.coche).length;

  const valider = () => {
    if (!telealarme) return;
    startTransition(async () => {
      await validerMaintenance(maintenanceId, {
        categories,
        checklist,
        testTelealarmeResultat: telealarme,
        dureeReelleMinutes: dureeEcouleeMinutes,
      });
    });
  };

  const minutesAffichees = dureeEcouleeMinutes;
  const secondesAffichees = dureeEcouleeSecondes % 60;
  const progression = useMemo(() => Math.min(100, Math.round((dureeEcouleeMinutes / Math.max(1, seuilDureeMinimaleMinutes)) * 100)), [dureeEcouleeMinutes, seuilDureeMinimaleMinutes]);

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-2">
      {etape !== 'categories' && (
        <button
          type="button"
          onClick={() => setEtape(etape === 'checklist' ? 'categories' : etape === 'telealarme' ? 'checklist' : 'telealarme')}
          className="flex items-center gap-1 self-start text-xs font-medium text-gray-500"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Retour
        </button>
      )}

      {etape === 'categories' && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Étape 1/4 — Opérations réalisées</p>
          <div className="flex flex-col gap-2">
            {CATEGORIES_DISPONIBLES.map((categorie) => {
              const coche = categories.includes(categorie);
              return (
                <button
                  key={categorie}
                  type="button"
                  onClick={() => basculerCategorie(categorie)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                    coche ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  {LIBELLE_CATEGORIE_MAINTENANCE[categorie]}
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      coche ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {coche && '✓'}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={passerAuxChecklists}
            disabled={categories.length === 0}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {etape === 'checklist' && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Étape 2/4 — Checklist</p>
          <div className="flex flex-col gap-2">
            {checklist.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => basculerItemChecklist(item.id)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left ${
                  item.coche ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 text-base ${
                    item.coche ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                  }`}
                >
                  {item.coche && '✓'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900">{item.libelle}</span>
                  <span className="block text-[11px] text-gray-400">
                    {LIBELLE_CATEGORIE_MAINTENANCE[item.categorie]}
                    {item.obligatoire ? ' · Obligatoire' : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {obligatoiresRestants > 0 && (
            <p className="text-xs text-amber-600">
              {obligatoiresRestants} point{obligatoiresRestants > 1 ? 's' : ''} obligatoire{obligatoiresRestants > 1 ? 's' : ''} restant{obligatoiresRestants > 1 ? 's' : ''} à cocher.
            </p>
          )}
          <button
            type="button"
            onClick={() => setEtape('telealarme')}
            disabled={obligatoiresRestants > 0}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {etape === 'telealarme' && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Étape 3/4 — Téléalarme</p>
          <p className="text-sm font-medium text-gray-900">Test téléalarme effectué ?</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setTelealarme(ResultatTestTelealarme.FONCTIONNELLE)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                telealarme === ResultatTestTelealarme.FONCTIONNELLE ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              Fonctionnelle
            </button>
            <button
              type="button"
              onClick={() => setTelealarme(ResultatTestTelealarme.DEFAILLANTE)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                telealarme === ResultatTestTelealarme.DEFAILLANTE ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              Défaillante
            </button>
          </div>
          <button
            type="button"
            onClick={() => setEtape('recap')}
            disabled={!telealarme}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {etape === 'recap' && (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Étape 4/4 — Durée et validation</p>

          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-[11px] text-gray-500">Présence sur site</p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-gray-900">
              {String(minutesAffichees).padStart(2, '0')}:{String(secondesAffichees).padStart(2, '0')}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">minimum contractuel : {seuilDureeMinimaleMinutes} min</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${seuilNonRespecte ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${progression}%` }}
              />
            </div>
            {seuilNonRespecte && (
              <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-700">
                Durée de présence inférieure au minimum contractuel ({minutesAffichees} min / {seuilDureeMinimaleMinutes} min).
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-gray-900">Récapitulatif</p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Opérations</dt>
                <dd className="text-right font-medium text-gray-900">{categories.map((c) => LIBELLE_CATEGORIE_MAINTENANCE[c]).join(', ')}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Checklist</dt>
                <dd className="font-medium text-gray-900">
                  {checklist.filter((i) => i.coche).length}/{checklist.length} points cochés
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Téléalarme</dt>
                <dd className={`font-medium ${telealarme === ResultatTestTelealarme.DEFAILLANTE ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {telealarme === ResultatTestTelealarme.DEFAILLANTE ? 'Défaillante' : 'Fonctionnelle'}
                </dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={valider}
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? 'Enregistrement…' : 'Valider la maintenance'}
          </button>
        </div>
      )}
    </div>
  );
}
