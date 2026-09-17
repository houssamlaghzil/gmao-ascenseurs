/**
 * Centre de synchronisation mobile (section 35) — écran important du cahier
 * des charges : état global de synchronisation du technicien connecté, puis
 * le détail de chaque élément de sa file (`ElementFileSynchronisation`),
 * avec un bouton "Réessayer" uniquement pour ceux en échec (`peutReessayer`).
 *
 * Le scénario canonique de démonstration (tech-001, Rapport #12451
 * SYNCHRONISE / Photo #885 EN_ATTENTE / Intervention #458 ENVOI_EN_COURS /
 * Rapport #12452 ECHEC — section 35 du cahier) vit entièrement dans
 * data/mockData.ts : cette page se contente de lire
 * `getElementsFileSynchronisationByTechnicienId` et de l'afficher fidèlement,
 * quel que soit le technicien réellement connecté.
 */

import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { ElementFileSynchronisation, EtatConnexionMobile, StatutSynchronisation } from '@/domain/types';
import { getElementsFileSynchronisationByTechnicienId, getSessionActiveDuTechnicien } from '@/data/store';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import { formatDistanceToNow, cn } from '@/lib/utils';
import { StatutSynchronisationBadge } from '@/components/StatusBadges';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import WidgetPTI from '@/app/mobile/components/WidgetPTI';
import { reessayerElementSync } from './actions';

function formatOctets(tailleOctets: number): string {
  if (tailleOctets < 1024) return `${tailleOctets} o`;
  const ko = tailleOctets / 1024;
  if (ko < 1024) return `${ko.toFixed(0)} Ko`;
  return `${(ko / 1024).toFixed(1)} Mo`;
}

function ElementSyncCard({ element }: { element: ElementFileSynchronisation }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{element.libelleAffichage}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{formatDistanceToNow(new Date(element.horodatageEvenement))}</p>
        </div>
        <StatutSynchronisationBadge statut={element.statut} />
      </div>

      {element.messageErreur && <p className="mt-2 text-xs text-rose-600">{element.messageErreur}</p>}

      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
        <span>
          {element.nombreTentatives} tentative{element.nombreTentatives > 1 ? 's' : ''}
        </span>
        {typeof element.tailleOctets === 'number' && <span>{formatOctets(element.tailleOctets)}</span>}
      </div>

      {element.peutReessayer && (
        <form action={reessayerElementSync} className="mt-2.5">
          <input type="hidden" name="elementId" value={element.id} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white active:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Réessayer
          </button>
        </form>
      )}
    </div>
  );
}

export default function SynchronisationMobilePage() {
  const technicienId = getTechnicienConnecteId();
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;

  const elements = getElementsFileSynchronisationByTechnicienId(technicienId);
  const enAttente = elements.filter((e) => e.statut !== StatutSynchronisation.SYNCHRONISE);

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <h1 className="text-lg font-semibold text-gray-900">Centre de synchronisation</h1>
      </div>

      <div
        className={cn(
          'mx-4 mb-4 flex items-center gap-2 rounded-lg border p-3',
          enAttente.length === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        )}
      >
        {enAttente.length === 0 ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <RefreshCw className="h-5 w-5 shrink-0 text-amber-600" />
        )}
        <p className={cn('text-sm font-semibold', enAttente.length === 0 ? 'text-emerald-800' : 'text-amber-800')}>
          {enAttente.length === 0 ? 'Synchronisé' : `${enAttente.length} élément${enAttente.length > 1 ? 's' : ''} en attente`}
        </p>
      </div>

      <div className="flex-1 space-y-2 px-4 pb-4">
        {elements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <p className="text-sm text-gray-500">Aucun élément à synchroniser.</p>
          </div>
        ) : (
          elements.map((element) => <ElementSyncCard key={element.id} element={element} />)
        )}
      </div>

      {enAttente.some((e) => e.statut === StatutSynchronisation.ECHEC) && (
        <div className="mx-4 mb-4 flex items-start gap-2 rounded-md border border-rose-100 bg-rose-50/60 px-3 py-2 text-[11px] text-rose-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Certains éléments n&apos;ont pas pu être envoyés. Réessayez ou attendez de retrouver une meilleure connexion.
        </div>
      )}

      <div className="px-4 pb-6">
        <WidgetPTI technicienId={technicienId} />
      </div>
    </div>
  );
}
