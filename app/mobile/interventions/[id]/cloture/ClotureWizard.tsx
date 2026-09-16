'use client';

/**
 * Formulaire de clôture d'intervention (sections 27-30) : état de clôture
 * (+ étages/commentaire si mode dégradé, ou motif/précision si "pas
 * d'accès" — voir la note d'écart dans ./actions.ts), puis le formulaire
 * compte-rendu/photos/signatures partagé
 * (app/mobile/components/FormulaireRapport.tsx). Rendu en une seule page
 * défilante plutôt qu'un assistant multi-écrans : contrairement au
 * diagnostic progressif (dont chaque étape filtre la suivante), les 4
 * sections de la clôture sont indépendantes et se prêtent bien à une
 * relecture d'ensemble avant validation.
 *
 * La validation finale (section 44) affiche d'abord une confirmation
 * ("Rapport enregistré" ou, hors ligne, "Enregistré sur l'appareil — en
 * attente de synchronisation") avant de proposer le retour à l'accueil :
 * la Server Action ne fait donc pas de redirect() elle-même.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CloudOff } from 'lucide-react';
import { EtatConnexionMobile, MotifNonAcces, RegleObligationPhotos, StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import { LIBELLE_MOTIF_NON_ACCES } from '@/lib/derived/libelles-rapports';
import { cn } from '@/lib/utils';
import FormulaireRapport, { ETAT_FORMULAIRE_RAPPORT_INITIAL, type EtatFormulaireRapport } from '@/app/mobile/components/FormulaireRapport';
import { validerCloture } from './actions';
import { PAS_ACCES } from './constants';

type EtatChoisi = StatutAppareil | typeof PAS_ACCES;

const ETATS_CLOTURE: StatutAppareil[] = [
  StatutAppareil.EN_SERVICE,
  StatutAppareil.A_L_ARRET,
  StatutAppareil.MODE_DEGRADE,
  StatutAppareil.ARRET_TRAVAUX,
];

interface NiveauOption {
  code: string;
  libelle: string;
}

interface ClotureWizardProps {
  interventionId: string;
  technicienNom: string;
  niveaux: NiveauOption[];
  poolPhotos: string[];
  regle?: RegleObligationPhotos;
  pieceCasseeSignalee: boolean;
  etatConnexion: EtatConnexionMobile;
}

export default function ClotureWizard({
  interventionId,
  technicienNom,
  niveaux,
  poolPhotos,
  regle,
  pieceCasseeSignalee,
  etatConnexion,
}: ClotureWizardProps) {
  const [etatChoisi, setEtatChoisi] = useState<EtatChoisi | null>(null);
  const [etagesChoisis, setEtagesChoisis] = useState<string[]>([]);
  const [commentaireCloture, setCommentaireCloture] = useState('');
  const [motifPasAcces, setMotifPasAcces] = useState<MotifNonAcces>(MotifNonAcces.CLIENT_ABSENT);
  const [formulaire, setFormulaire] = useState<EtatFormulaireRapport>(ETAT_FORMULAIRE_RAPPORT_INITIAL);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [isPending, startTransition] = useTransition();

  const modeDegradeValide = etatChoisi === StatutAppareil.MODE_DEGRADE && etagesChoisis.length > 0 && commentaireCloture.trim().length > 0;
  const pasAccesValide = etatChoisi === PAS_ACCES && commentaireCloture.trim().length > 0;
  const etatValide =
    etatChoisi !== null &&
    (etatChoisi === StatutAppareil.MODE_DEGRADE ? modeDegradeValide : etatChoisi === PAS_ACCES ? pasAccesValide : true);

  const peutValider = etatValide && formulaire.signatureTechnicienSignee && formulaire.signatureClientStatut !== null;

  const valider = () => {
    if (!etatChoisi || !peutValider) return;
    setErreur(null);
    startTransition(async () => {
      const resultat = await validerCloture(interventionId, {
        etatSelectionne: etatChoisi,
        etagesModeDegrade: etatChoisi === StatutAppareil.MODE_DEGRADE ? etagesChoisis : undefined,
        motifPasAcces: etatChoisi === PAS_ACCES ? motifPasAcces : undefined,
        commentaireCloture: commentaireCloture.trim() || undefined,
        commentaire: formulaire.commentaire,
        commentaireSaisieVocale: formulaire.commentaireSaisieVocale,
        photos: formulaire.photos.map((p) => ({ url: p.url, categorie: p.categorie, legende: p.legende.trim() || undefined })),
        signatureTechnicienSignee: formulaire.signatureTechnicienSignee,
        signatureClientStatut: formulaire.signatureClientStatut!,
        signatureClientNom: formulaire.signatureClientNom,
        signatureClientMotif: formulaire.signatureClientMotif,
      });
      if (resultat.success) setSucces(true);
      else setErreur(resultat.error ?? 'Une erreur est survenue.');
    });
  };

  if (succes) {
    const horsLigne = etatConnexion === EtatConnexionMobile.HORS_LIGNE;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-12 pt-12 text-center">
        <span className={cn('flex h-16 w-16 items-center justify-center rounded-full', horsLigne ? 'bg-gray-100' : 'bg-emerald-50')}>
          {horsLigne ? <CloudOff className="h-8 w-8 text-gray-500" /> : <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
        </span>
        <div>
          <p className="text-base font-semibold text-gray-900">{horsLigne ? "Enregistré sur l'appareil" : 'Rapport enregistré'}</p>
          <p className="mt-1.5 text-sm text-gray-500">
            {horsLigne
              ? 'En attente de synchronisation dès que la connexion sera rétablie.'
              : 'Le rapport a été transmis et est en attente de synchronisation.'}
          </p>
        </div>
        <Link href="/mobile/accueil" className="mt-2 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white active:bg-indigo-700">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-2">
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">État de l&apos;appareil à la clôture</h2>
        <div className="flex flex-col gap-2">
          {ETATS_CLOTURE.map((etat) => (
            <button
              key={etat}
              type="button"
              onClick={() => setEtatChoisi(etat)}
              className={cn(
                'rounded-lg border px-4 py-3 text-left text-sm font-medium',
                etatChoisi === etat ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-900'
              )}
            >
              {LIBELLE_STATUT_APPAREIL[etat]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEtatChoisi(PAS_ACCES)}
            className={cn(
              'rounded-lg border px-4 py-3 text-left text-sm font-medium',
              etatChoisi === PAS_ACCES ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-900'
            )}
          >
            Pas d&apos;accès
          </button>
        </div>

        {etatChoisi === StatutAppareil.MODE_DEGRADE && (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500">Étages concernés</p>
            {niveaux.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun niveau desservi renseigné pour cet appareil.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {niveaux.map((n) => {
                  const actif = etagesChoisis.includes(n.code);
                  return (
                    <button
                      key={n.code}
                      type="button"
                      onClick={() => setEtagesChoisis((prev) => (actif ? prev.filter((c) => c !== n.code) : [...prev, n.code]))}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium',
                        actif ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600'
                      )}
                    >
                      {n.libelle}
                    </button>
                  );
                })}
              </div>
            )}
            <textarea
              value={commentaireCloture}
              onChange={(e) => setCommentaireCloture(e.target.value)}
              rows={2}
              placeholder="Commentaire sur le mode dégradé (obligatoire)…"
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {etatChoisi === PAS_ACCES && (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <select
              value={motifPasAcces}
              onChange={(e) => setMotifPasAcces(e.target.value as MotifNonAcces)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.values(MotifNonAcces).map((m) => (
                <option key={m} value={m}>
                  {LIBELLE_MOTIF_NON_ACCES[m]}
                </option>
              ))}
            </select>
            <textarea
              value={commentaireCloture}
              onChange={(e) => setCommentaireCloture(e.target.value)}
              rows={2}
              placeholder="Précisions (obligatoire)…"
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {etatChoisi && etatChoisi !== StatutAppareil.MODE_DEGRADE && etatChoisi !== PAS_ACCES && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <textarea
              value={commentaireCloture}
              onChange={(e) => setCommentaireCloture(e.target.value)}
              rows={2}
              placeholder="Commentaire (optionnel)…"
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </section>

      <FormulaireRapport
        technicienNom={technicienNom}
        poolPhotos={poolPhotos}
        regle={regle}
        pieceCasseeSignalee={pieceCasseeSignalee}
        value={formulaire}
        onChange={setFormulaire}
      />

      {erreur && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-xs text-rose-700">{erreur}</p>
        </div>
      )}

      <button
        type="button"
        onClick={valider}
        disabled={!peutValider || isPending}
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Valider et clôturer'}
      </button>
    </div>
  );
}
