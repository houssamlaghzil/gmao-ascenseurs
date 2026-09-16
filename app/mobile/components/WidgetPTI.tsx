/**
 * Widget PTI/DATI (section 38) — état de protection du travailleur isolé du
 * technicien connecté. Affiché sur l'accueil ET le Centre de synchronisation
 * (importé, jamais dupliqué), toujours dans sa propre carte, visuellement
 * distincte (bordure en tirets, fond neutre) du reste de l'écran : "cette
 * fonctionnalité doit rester visuellement indépendante des processus
 * classiques de synchronisation GMAO" (section 38). Server Component : lit
 * l'état/la configuration directement depuis le store, les transitions
 * passent par de petits formulaires (Server Actions, voir pti-actions.ts).
 *
 * Les 5 techniciens de démo ne couvrent que 2 des 5 états possibles
 * (PROTECTION_ACTIVE, et REACTIVATION_EN_COMPTE_A_REBOURS pour tech-004) :
 * les boutons "Simuler une pré-alerte" / "Inhiber temporairement" (état
 * PROTECTION_ACTIVE) sont une initiative de démo pour rendre les 5 états du
 * cahier des charges atteignables et rejouables sans dépendre d'un scénario
 * figé supplémentaire.
 */

import { Shield } from 'lucide-react';
import { EtatProtectionPTI, ModePTI } from '@/domain/types';
import { getConfigurationPTI, getEtatPTIByTechnicienId } from '@/data/store';
import { LIBELLE_ETAT_PROTECTION_PTI, LIBELLE_MODE_PTI } from '@/lib/derived/libelles-pti';
import { changerEtatPTIForm } from './pti-actions';
import CompteARebourgPTI from './CompteARebourgPTI';

const TONS_ETAT: Record<EtatProtectionPTI, string> = {
  [EtatProtectionPTI.PROTECTION_ACTIVE]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [EtatProtectionPTI.PRE_ALERTE]: 'border-amber-300 bg-amber-50 text-amber-800',
  [EtatProtectionPTI.SOS_DECLENCHE]: 'border-rose-300 bg-rose-50 text-rose-800',
  [EtatProtectionPTI.INHIBEE_TEMPORAIREMENT]: 'border-gray-200 bg-gray-50 text-gray-600',
  [EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS]: 'border-sky-200 bg-sky-50 text-sky-700',
};

function ChampCache({ technicienId, cible }: { technicienId: string; cible: EtatProtectionPTI }) {
  return (
    <>
      <input type="hidden" name="technicienId" value={technicienId} />
      <input type="hidden" name="cibleEtat" value={cible} />
    </>
  );
}

export default function WidgetPTI({ technicienId }: { technicienId: string }) {
  const etatPTI = getEtatPTIByTechnicienId(technicienId);
  const config = getConfigurationPTI(technicienId);
  if (!etatPTI) return null;

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Shield className="h-3.5 w-3.5" />
        Protection du travailleur isolé
      </p>

      <div className={`rounded-md border p-3 ${TONS_ETAT[etatPTI.etat]}`}>
        <p className="text-sm font-semibold">{LIBELLE_ETAT_PROTECTION_PTI[etatPTI.etat]}</p>
        <p className="mt-0.5 text-[11px] opacity-80">
          {config?.mode === ModePTI.INTEGRATION_SERVICE_TIERS
            ? `Via ${config.fournisseurExterne ?? 'service tiers'}`
            : LIBELLE_MODE_PTI[config?.mode ?? ModePTI.MODULE_INTERNE]}
        </p>

        {etatPTI.etat === EtatProtectionPTI.SOS_DECLENCHE && (
          <form action={changerEtatPTIForm} className="mt-2.5">
            <ChampCache technicienId={technicienId} cible={EtatProtectionPTI.PROTECTION_ACTIVE} />
            <button type="submit" className="w-full rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white active:bg-rose-700">
              Annuler l&apos;alerte
            </button>
          </form>
        )}

        {etatPTI.etat === EtatProtectionPTI.PRE_ALERTE && (
          <div className="mt-2.5 flex gap-2">
            <form action={changerEtatPTIForm} className="flex-1">
              <ChampCache technicienId={technicienId} cible={EtatProtectionPTI.PROTECTION_ACTIVE} />
              <button type="submit" className="w-full rounded-lg border border-emerald-600 py-2 text-xs font-semibold text-emerald-700 active:bg-emerald-100">
                Tout va bien
              </button>
            </form>
            <form action={changerEtatPTIForm} className="flex-1">
              <ChampCache technicienId={technicienId} cible={EtatProtectionPTI.SOS_DECLENCHE} />
              <button type="submit" className="w-full rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white active:bg-rose-700">
                Déclencher le SOS
              </button>
            </form>
          </div>
        )}

        {etatPTI.etat === EtatProtectionPTI.INHIBEE_TEMPORAIREMENT && (
          <form action={changerEtatPTIForm} className="mt-2.5">
            <ChampCache technicienId={technicienId} cible={EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS} />
            <button type="submit" className="w-full rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white active:bg-sky-700">
              Réactiver la protection
            </button>
          </form>
        )}

        {etatPTI.etat === EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS && etatPTI.finCompteARebours && (
          <CompteARebourgPTI technicienId={technicienId} finCompteARebours={etatPTI.finCompteARebours} />
        )}

        {etatPTI.etat === EtatProtectionPTI.PROTECTION_ACTIVE && (
          <div className="mt-2.5 flex gap-2">
            <form action={changerEtatPTIForm} className="flex-1">
              <ChampCache technicienId={technicienId} cible={EtatProtectionPTI.PRE_ALERTE} />
              <button type="submit" className="w-full rounded-lg border border-amber-300 py-1.5 text-[11px] font-medium text-amber-700 active:bg-amber-100">
                Simuler une pré-alerte
              </button>
            </form>
            <form action={changerEtatPTIForm} className="flex-1">
              <ChampCache technicienId={technicienId} cible={EtatProtectionPTI.INHIBEE_TEMPORAIREMENT} />
              <button type="submit" className="w-full rounded-lg border border-gray-300 py-1.5 text-[11px] font-medium text-gray-600 active:bg-gray-100">
                Inhiber temporairement
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
