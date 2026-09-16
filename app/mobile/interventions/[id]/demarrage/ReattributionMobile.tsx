'use client';

/**
 * "Je ne peux pas traiter cette intervention" (section 34) — lien discret
 * présent à chaque étape du démarrage et du diagnostic, ouvrant un petit
 * formulaire de réaffectation vers un collègue puis une confirmation
 * explicite avant retour à l'accueil. Composant partagé entre
 * app/mobile/interventions/[id]/demarrage et .../diagnostic (import relatif
 * depuis diagnostic/, toutes deux propriété de cet agent).
 */

import { FormEvent, useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Repeat } from 'lucide-react';
import { MotifReattribution } from '@/domain/types';
import { LIBELLE_MOTIF_REATTRIBUTION } from '@/lib/derived/libelles-interventions';
import { reaffecterInterventionMobile } from './reattribution-actions';

export interface TechnicienOption {
  id: string;
  nomComplet: string;
}

interface ReattributionMobileProps {
  interventionId: string;
  techniciensDisponibles: TechnicienOption[];
}

export default function ReattributionMobile({ interventionId, techniciensDisponibles }: ReattributionMobileProps) {
  const [ouvert, setOuvert] = useState(false);
  const [transfere, setTransfere] = useState(false);
  const [technicienId, setTechnicienId] = useState('');
  const [motif, setMotif] = useState<MotifReattribution>(MotifReattribution.INDISPONIBILITE_TECHNICIEN);
  const [commentaire, setCommentaire] = useState('');
  const [erreur, setErreur] = useState<string>();
  const [isPending, startTransition] = useTransition();

  if (transfere) {
    return (
      <div className="mx-4 mb-4 flex flex-col items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-800">Intervention transférée</p>
        <p className="text-xs text-emerald-700">Un autre technicien va prendre le relais.</p>
        <Link
          href="/mobile/accueil"
          className="mt-2 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white active:bg-emerald-700"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const soumettre = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(undefined);
    startTransition(async () => {
      const resultat = await reaffecterInterventionMobile(interventionId, technicienId, motif, commentaire);
      if (resultat.success) {
        setTransfere(true);
      } else {
        setErreur(resultat.error ?? 'Erreur inattendue.');
      }
    });
  };

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="mx-4 mb-4 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-500 underline underline-offset-2"
      >
        <Repeat className="h-3.5 w-3.5" />
        Je ne peux pas traiter cette intervention
      </button>
    );
  }

  return (
    <form onSubmit={soumettre} className="mx-4 mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-gray-900">Transférer à un collègue</p>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Nouveau technicien</label>
        <select
          required
          value={technicienId}
          onChange={(e) => setTechnicienId(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Sélectionner…</option>
          {techniciensDisponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nomComplet}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Motif</label>
        <select
          value={motif}
          onChange={(e) => setMotif(e.target.value as MotifReattribution)}
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.values(MotifReattribution).map((m) => (
            <option key={m} value={m}>
              {LIBELLE_MOTIF_REATTRIBUTION[m]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Commentaire (optionnel)</label>
        <textarea
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {erreur && (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {erreur}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending || !technicienId}
          className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? 'Envoi…' : 'Transférer'}
        </button>
      </div>
    </form>
  );
}
