'use client';

/**
 * Diagnostic progressif (section 26) : Origine → Étage → Local → Équipement
 * → État → Action. Chaque sélection ne révèle que les choix pertinents
 * suivants (référentiels en cascade lus côté serveur par la page, filtrés
 * ici selon la sélection en cours). Seule l'origine est obligatoire (les
 * autres champs sont optionnels dans DiagnosticProgressif, voir
 * domain/types.ts) : chaque étape propose donc de la "passer" si elle ne
 * s'applique pas (ex. local = Autre, sans équipement répertorié).
 *
 * La progression dans l'assistant vit entièrement dans l'état local du
 * composant — pas de persistance d'un formulaire interrompu à ce stade
 * (amélioration possible, hors scope de cette maquette). Le diagnostic
 * complet n'est envoyé au serveur qu'une fois, à la validation finale.
 */

import { useMemo, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ActionDiagnosticReferentiel,
  EquipementReferentiel,
  EtatEquipementReferentiel,
  LocalDiagnostic,
  OrigineDiagnostic,
} from '@/domain/types';
import { LIBELLE_LOCAL_DIAGNOSTIC, LIBELLE_ORIGINE_DIAGNOSTIC } from '@/lib/derived/libelles-rapports';
import { validerDiagnostic } from './actions';
import ReattributionMobile, { type TechnicienOption } from '../demarrage/ReattributionMobile';

interface NiveauOption {
  code: string;
  libelle: string;
}

interface DiagnosticWizardProps {
  interventionId: string;
  niveaux: NiveauOption[];
  equipements: EquipementReferentiel[];
  etats: EtatEquipementReferentiel[];
  actions: ActionDiagnosticReferentiel[];
  techniciensDisponibles: TechnicienOption[];
}

type Etape = 'origine' | 'etage' | 'local' | 'equipement' | 'etat' | 'action' | 'recap';

const TITRES_ETAPE: Record<Exclude<Etape, 'recap'>, string> = {
  origine: 'Origine probable',
  etage: 'Étage concerné',
  local: 'Local',
  equipement: 'Équipement',
  etat: 'État constaté',
  action: 'Action réalisée',
};
const ORDRE_ETAPES: Exclude<Etape, 'recap'>[] = ['origine', 'etage', 'local', 'equipement', 'etat', 'action'];

interface Selection {
  origine?: OrigineDiagnostic;
  etage?: string;
  local?: LocalDiagnostic;
  equipementId?: string;
  etatConstateId?: string;
  actionId?: string;
}

export default function DiagnosticWizard({
  interventionId,
  niveaux,
  equipements,
  etats,
  actions,
  techniciensDisponibles,
}: DiagnosticWizardProps) {
  const [etape, setEtape] = useState<Etape>('origine');
  const [selection, setSelection] = useState<Selection>({});
  const [commentaire, setCommentaire] = useState('');
  const [isPending, startTransition] = useTransition();

  const equipementsFiltres = useMemo(
    () => (selection.local ? equipements.filter((e) => e.localsCompatibles.includes(selection.local!)) : []),
    [equipements, selection.local]
  );
  const etatsFiltres = useMemo(
    () => (selection.equipementId ? etats.filter((e) => e.equipementIds.includes(selection.equipementId!)) : []),
    [etats, selection.equipementId]
  );
  const actionsFiltres = useMemo(
    () => (selection.etatConstateId ? actions.filter((a) => a.etatIds.includes(selection.etatConstateId!)) : []),
    [actions, selection.etatConstateId]
  );

  const equipementChoisi = equipements.find((e) => e.id === selection.equipementId);
  const etatChoisi = etats.find((e) => e.id === selection.etatConstateId);
  const actionChoisie = actions.find((a) => a.id === selection.actionId);

  const choisirOrigine = (origine: OrigineDiagnostic) => {
    setSelection({ origine });
    setEtape('etage');
  };
  const choisirEtage = (etage: string | undefined) => {
    setSelection((s) => ({ origine: s.origine, etage }));
    setEtape('local');
  };
  const choisirLocal = (local: LocalDiagnostic | undefined) => {
    setSelection((s) => ({ origine: s.origine, etage: s.etage, local }));
    setEtape('equipement');
  };
  const choisirEquipement = (equipementId: string | undefined) => {
    setSelection((s) => ({ ...s, equipementId, etatConstateId: undefined, actionId: undefined }));
    setEtape(equipementId ? 'etat' : 'recap');
  };
  const choisirEtat = (etatConstateId: string | undefined) => {
    setSelection((s) => ({ ...s, etatConstateId, actionId: undefined }));
    setEtape(etatConstateId ? 'action' : 'recap');
  };
  const choisirAction = (actionId: string | undefined) => {
    setSelection((s) => ({ ...s, actionId }));
    setEtape('recap');
  };

  const valider = () => {
    if (!selection.origine) return;
    startTransition(async () => {
      await validerDiagnostic(interventionId, {
        origine: selection.origine!,
        etage: selection.etage,
        local: selection.local,
        equipementId: selection.equipementId,
        etatConstateId: selection.etatConstateId,
        actionId: selection.actionId,
        commentaireDiagnostic: commentaire,
      });
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-2">
      {etape !== 'recap' && (
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Étape {ORDRE_ETAPES.indexOf(etape) + 1}/{ORDRE_ETAPES.length} — {TITRES_ETAPE[etape]}
        </p>
      )}

      {etape === 'origine' && (
        <ListeChoix
          items={Object.values(OrigineDiagnostic).map((o) => ({ valeur: o, libelle: LIBELLE_ORIGINE_DIAGNOSTIC[o] }))}
          onChoisir={choisirOrigine}
        />
      )}

      {etape === 'etage' && (
        <>
          <ListeChoix
            items={niveaux.map((n) => ({ valeur: n.code, libelle: `${n.libelle} (${n.code})` }))}
            onChoisir={choisirEtage}
          />
          <BoutonsBasDeSelection onRetour={() => setEtape('origine')} onPasser={() => choisirEtage(undefined)} />
        </>
      )}

      {etape === 'local' && (
        <>
          <ListeChoix
            items={Object.values(LocalDiagnostic).map((l) => ({ valeur: l, libelle: LIBELLE_LOCAL_DIAGNOSTIC[l] }))}
            onChoisir={choisirLocal}
          />
          <BoutonsBasDeSelection onRetour={() => setEtape('etage')} onPasser={() => choisirLocal(undefined)} />
        </>
      )}

      {etape === 'equipement' && (
        <>
          {equipementsFiltres.length > 0 ? (
            <ListeChoix items={equipementsFiltres.map((e) => ({ valeur: e.id, libelle: e.libelle }))} onChoisir={choisirEquipement} />
          ) : (
            <p className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
              {selection.local ? 'Aucun équipement répertorié pour ce local.' : "Aucun local sélectionné à l'étape précédente."}
            </p>
          )}
          <BoutonsBasDeSelection
            onRetour={() => setEtape('local')}
            onPasser={() => choisirEquipement(undefined)}
            passerLabel="Terminer sans équipement"
          />
        </>
      )}

      {etape === 'etat' && (
        <>
          {etatsFiltres.length > 0 ? (
            <ListeChoix items={etatsFiltres.map((e) => ({ valeur: e.id, libelle: e.libelle }))} onChoisir={choisirEtat} />
          ) : (
            <p className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
              Aucun état répertorié pour cet équipement.
            </p>
          )}
          <BoutonsBasDeSelection
            onRetour={() => setEtape('equipement')}
            onPasser={() => choisirEtat(undefined)}
            passerLabel="Terminer sans état constaté"
          />
        </>
      )}

      {etape === 'action' && (
        <>
          {actionsFiltres.length > 0 ? (
            <ListeChoix items={actionsFiltres.map((a) => ({ valeur: a.id, libelle: a.libelle }))} onChoisir={choisirAction} />
          ) : (
            <p className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
              Aucune action répertoriée pour cet état.
            </p>
          )}
          <BoutonsBasDeSelection onRetour={() => setEtape('etat')} onPasser={() => choisirAction(undefined)} passerLabel="Terminer sans action" />
        </>
      )}

      {etape === 'recap' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Récapitulatif du diagnostic</p>
            <dl className="space-y-2">
              <LigneRecap label="Origine" valeur={selection.origine ? LIBELLE_ORIGINE_DIAGNOSTIC[selection.origine] : undefined} />
              <LigneRecap label="Étage" valeur={selection.etage} />
              <LigneRecap label="Local" valeur={selection.local ? LIBELLE_LOCAL_DIAGNOSTIC[selection.local] : undefined} />
              <LigneRecap label="Équipement" valeur={equipementChoisi?.libelle} />
              <LigneRecap label="État constaté" valeur={etatChoisi?.libelle} />
              <LigneRecap label="Action" valeur={actionChoisie?.libelle} />
            </dl>
            <button
              type="button"
              onClick={() => setEtape('origine')}
              className="mt-3 text-xs font-medium text-indigo-600 underline underline-offset-2"
            >
              Reprendre le diagnostic depuis le début
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">Commentaire (optionnel)</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Précisions utiles pour la suite de l'intervention…"
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={valider}
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? 'Enregistrement…' : 'Valider le diagnostic'}
          </button>
        </div>
      )}

      <ReattributionMobile interventionId={interventionId} techniciensDisponibles={techniciensDisponibles} />
    </div>
  );
}

function ListeChoix<T extends string>({
  items,
  onChoisir,
}: {
  items: { valeur: T; libelle: string }[];
  onChoisir: (valeur: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.valeur}
          type="button"
          onClick={() => onChoisir(item.valeur)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 active:bg-gray-50"
        >
          {item.libelle}
        </button>
      ))}
    </div>
  );
}

function BoutonsBasDeSelection({
  onRetour,
  onPasser,
  passerLabel = 'Passer cette étape',
}: {
  onRetour: () => void;
  onPasser: () => void;
  passerLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onRetour}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Retour
      </button>
      <button
        type="button"
        onClick={onPasser}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600"
      >
        {passerLabel} <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function LigneRecap({ label, valeur }: { label: string; valeur?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900">{valeur ?? '—'}</dd>
    </div>
  );
}
