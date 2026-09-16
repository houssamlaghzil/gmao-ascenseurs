/**
 * Accès à l'appareil et diagnostic progressif en 6 étapes (section 26) —
 * n'affiche que refusAcces si accesObtenu = false (le reste du formulaire
 * n'existe pas dans ce cas, voir domain/types.ts, RefusAcces).
 */

import { AlertTriangle } from 'lucide-react';
import { DiagnosticProgressif, RefusAcces } from '@/domain/types';
import { formatDate } from '@/lib/utils';
import { LIBELLE_LOCAL_DIAGNOSTIC, LIBELLE_MOTIF_NON_ACCES, LIBELLE_ORIGINE_DIAGNOSTIC } from '@/lib/derived/libelles-rapports';

interface DiagnosticRapportProps {
  accesObtenu: boolean;
  refusAcces?: RefusAcces;
  diagnostic?: DiagnosticProgressif;
}

function Etape({ numero, label, valeur }: { numero: number; label: string; valeur?: string }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 h-6 w-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center justify-center">
        {numero}
      </span>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{valeur ?? '—'}</p>
      </div>
    </div>
  );
}

export default function DiagnosticRapport({ accesObtenu, refusAcces, diagnostic }: DiagnosticRapportProps) {
  if (!accesObtenu) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Accès à l&apos;appareil</h2>
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-md p-4">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-800">
              Accès non obtenu{refusAcces ? ` — ${LIBELLE_MOTIF_NON_ACCES[refusAcces.motif]}` : ''}
            </p>
            {refusAcces?.commentaire && <p className="text-sm text-rose-700 mt-1">{refusAcces.commentaire}</p>}
            {refusAcces?.heureConstat && (
              <p className="text-xs text-rose-600 mt-2">Constaté le {formatDate(new Date(refusAcces.heureConstat))}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Diagnostic progressif</h2>
      {diagnostic ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Etape numero={1} label="Origine probable" valeur={LIBELLE_ORIGINE_DIAGNOSTIC[diagnostic.origine]} />
          <Etape numero={2} label="Étage concerné" valeur={diagnostic.etage} />
          <Etape numero={3} label="Local" valeur={diagnostic.local ? LIBELLE_LOCAL_DIAGNOSTIC[diagnostic.local] : undefined} />
          <Etape numero={4} label="Équipement" valeur={diagnostic.equipementLibelle} />
          <Etape numero={5} label="État constaté" valeur={diagnostic.etatConstateLibelle} />
          <Etape numero={6} label="Action réalisée" valeur={diagnostic.actionLibelle} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">Aucun diagnostic renseigné.</p>
      )}
      {diagnostic?.commentaireDiagnostic && (
        <p className="text-sm text-gray-700 mt-4 pt-4 border-t border-gray-100">{diagnostic.commentaireDiagnostic}</p>
      )}
    </div>
  );
}
