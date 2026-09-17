'use client';

/**
 * Réattribution de l'écran Détail intervention (section 8) : bouton
 * "Réattribuer" (Server Action reaffecterInterventionAction, qui appelle
 * domain/business-logic.reaffecter puis data/store.updateIntervention +
 * addReaffectation) et historique des réaffectations déjà effectuées
 * (getReaffectationsByCible, résolu côté serveur par le parent).
 */

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, AlertCircle } from 'lucide-react';
import { MotifReattribution, OrigineAction, StatutIntervention } from '@/domain/types';
import { reaffecterInterventionAction } from '../../actions';
import { LIBELLE_MOTIF_REATTRIBUTION } from '@/lib/derived/libelles-interventions';
import { LIBELLE_ORIGINE_ACTION } from '@/lib/derived/libelles-parc';
import { formatDate } from '@/lib/utils';
import type { OptionFiltre } from '@/lib/derived/parc-liste';
import { LienTechnicien } from '@/components/Liens';

export interface ReaffectationAffichee {
  id: string;
  dateHeure: string;
  ancienTechnicienId?: string;
  ancienTechnicienNom?: string;
  nouveauTechnicienId: string;
  nouveauTechnicienNom: string;
  motif: MotifReattribution;
  commentaire?: string;
  origine: OrigineAction;
  demandeurNom?: string;
}

interface ReattributionPanelProps {
  interventionId: string;
  statutIntervention: StatutIntervention;
  techniciensDisponibles: OptionFiltre[];
  historique: ReaffectationAffichee[];
}

export default function ReattributionPanel({
  interventionId,
  statutIntervention,
  techniciensDisponibles,
  historique,
}: ReattributionPanelProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [technicienId, setTechnicienId] = useState('');
  const [motif, setMotif] = useState<MotifReattribution>(MotifReattribution.AUTRE);
  const [commentaire, setCommentaire] = useState('');
  const [erreur, setErreur] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const cloturee = statutIntervention === StatutIntervention.CLOTURE;

  const soumettre = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(undefined);
    startTransition(async () => {
      const resultat = await reaffecterInterventionAction(interventionId, technicienId, motif, commentaire);
      if (resultat.success) {
        setOuvert(false);
        setTechnicienId('');
        setCommentaire('');
        router.refresh();
      } else {
        setErreur(resultat.error ?? 'Erreur inattendue.');
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Réattribution</h2>
        {!cloturee && (
          <button
            onClick={() => setOuvert((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Réattribuer
          </button>
        )}
      </div>

      {cloturee && <p className="text-sm text-gray-500">Une intervention clôturée ne peut plus être réattribuée.</p>}

      {ouvert && !cloturee && (
        <form onSubmit={soumettre} className="space-y-3 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nouveau technicien</label>
            <select
              required
              value={technicienId}
              onChange={(e) => setTechnicienId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Sélectionner un technicien…</option>
              {techniciensDisponibles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Motif</label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value as MotifReattribution)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {Object.values(MotifReattribution).map((m) => (
                <option key={m} value={m}>
                  {LIBELLE_MOTIF_REATTRIBUTION[m]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Commentaire (optionnel)</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {erreur && (
            <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{erreur}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !technicienId}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Réattribution…' : 'Confirmer'}
            </button>
          </div>
        </form>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Historique des réaffectations</h3>
        {historique.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune réaffectation enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {historique.map((r) => (
              <li key={r.id} className="text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span>
                    {r.ancienTechnicienId && r.ancienTechnicienNom ? (
                      <>
                        <LienTechnicien id={r.ancienTechnicienId} ton="sobre">
                          {r.ancienTechnicienNom}
                        </LienTechnicien>{' '}
                        →{' '}
                      </>
                    ) : (
                      ''
                    )}
                    <span className="font-medium">
                      <LienTechnicien id={r.nouveauTechnicienId} ton="sobre">
                        {r.nouveauTechnicienNom}
                      </LienTechnicien>
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(new Date(r.dateHeure))}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {LIBELLE_MOTIF_REATTRIBUTION[r.motif]} · {LIBELLE_ORIGINE_ACTION[r.origine]}
                  {r.demandeurNom ? ` · ${r.demandeurNom}` : ''}
                </p>
                {r.commentaire && <p className="text-xs text-gray-500 mt-1">{r.commentaire}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
