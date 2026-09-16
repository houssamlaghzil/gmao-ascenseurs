'use client';

/**
 * Rapport isolé (section 33) : type + motif, puis le formulaire compte-
 * rendu/photos/signatures partagé avec la clôture d'intervention (voir
 * app/mobile/components/FormulaireRapport.tsx). Le motif est "sélectionné"
 * parmi des motifs-types courants, avec un motif libre en dernier recours
 * (motifRapportIsole reste un champ texte libre en base — domain/types.ts).
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CloudOff } from 'lucide-react';
import { EtatConnexionMobile, RegleObligationPhotos, TypeRapport } from '@/domain/types';
import { LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { cn } from '@/lib/utils';
import FormulaireRapport, { ETAT_FORMULAIRE_RAPPORT_INITIAL, type EtatFormulaireRapport } from '@/app/mobile/components/FormulaireRapport';
import { creerRapportIsole } from './actions';

const MOTIF_AUTRE = 'Autre motif';
const MOTIFS_SUGGERES = ['Visite de courtoisie', 'Contrôle ponctuel demandé', 'Demande client hors tournée', MOTIF_AUTRE];

interface RapportIsoleWizardProps {
  ascenseurId: string;
  technicienNom: string;
  poolPhotos: string[];
  regles: RegleObligationPhotos[];
  etatConnexion: EtatConnexionMobile;
}

export default function RapportIsoleWizard({ ascenseurId, technicienNom, poolPhotos, regles, etatConnexion }: RapportIsoleWizardProps) {
  const [typeRapport, setTypeRapport] = useState<TypeRapport>(TypeRapport.DIVERS);
  const [motifChoisi, setMotifChoisi] = useState<string>(MOTIFS_SUGGERES[0]);
  const [motifLibre, setMotifLibre] = useState('');
  const [formulaire, setFormulaire] = useState<EtatFormulaireRapport>(ETAT_FORMULAIRE_RAPPORT_INITIAL);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [isPending, startTransition] = useTransition();

  const motifFinal = (motifChoisi === MOTIF_AUTRE ? motifLibre : motifChoisi).trim();
  const peutValider = motifFinal.length > 0 && formulaire.signatureTechnicienSignee && formulaire.signatureClientStatut !== null;
  const regle = regles.find((r) => r.typeRapport === typeRapport);

  const valider = () => {
    if (!peutValider) return;
    setErreur(null);
    startTransition(async () => {
      const resultat = await creerRapportIsole(ascenseurId, {
        typeRapport,
        motifRapportIsole: motifFinal,
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
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Type et motif du rapport</h2>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {Object.values(TypeRapport).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeRapport(t)}
              className={cn(
                'rounded-md border py-2 text-xs font-medium',
                typeRapport === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
              )}
            >
              {LIBELLE_TYPE_RAPPORT[t]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {MOTIFS_SUGGERES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotifChoisi(m)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-sm font-medium',
                motifChoisi === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-900'
              )}
            >
              {m}
            </button>
          ))}
        </div>
        {motifChoisi === MOTIF_AUTRE && (
          <input
            type="text"
            value={motifLibre}
            onChange={(e) => setMotifLibre(e.target.value)}
            placeholder="Précisez le motif…"
            className="mt-2 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </section>

      <FormulaireRapport technicienNom={technicienNom} poolPhotos={poolPhotos} regle={regle} value={formulaire} onChange={setFormulaire} />

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
        {isPending ? 'Enregistrement…' : 'Créer le rapport'}
      </button>
    </div>
  );
}
