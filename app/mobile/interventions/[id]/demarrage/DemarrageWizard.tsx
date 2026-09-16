'use client';

/**
 * Parcours en étapes du démarrage d'intervention (sections 24/25) :
 * 1. Accès à l'appareil — Oui/Non. "Non" n'affiche QUE motif/commentaire/
 *    photo/heure/validation (jamais le reste du formulaire, voir
 *    domain/types.ts RefusAcces) et termine le rapport directement.
 * 2. État initial constaté (En service / À l'arrêt / Mode dégradé), bien
 *    distinct du motif de l'appel (déjà connu de l'intervention, non
 *    ressaisi ici) — valide puis redirige vers le diagnostic (section 26).
 *
 * L'enchaînement entre étapes vit dans l'état local du composant (pas de
 * persistance nécessaire pour une reprise de formulaire interrompu à ce
 * stade — amélioration possible mais hors scope de cette maquette) ; chaque
 * validation d'étape passe par une Server Action.
 */

import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, X } from 'lucide-react';
import { CategoriePhoto, MotifNonAcces, StatutAppareil } from '@/domain/types';
import { LIBELLE_CATEGORIE_PHOTO, LIBELLE_MOTIF_NON_ACCES } from '@/lib/derived/libelles-rapports';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import { validerAccesRefuse, validerEtatInitial } from './actions';
import ReattributionMobile, { type TechnicienOption } from './ReattributionMobile';

interface PhotoChoisie {
  url: string;
  categorie: CategoriePhoto;
}

interface DemarrageWizardProps {
  interventionId: string;
  techniciensDisponibles: TechnicienOption[];
  poolPhotos: string[];
}

const ETATS_INITIAUX: StatutAppareil[] = [StatutAppareil.EN_SERVICE, StatutAppareil.A_L_ARRET, StatutAppareil.MODE_DEGRADE];
const MAX_PHOTOS_REFUS = 3;

export default function DemarrageWizard({ interventionId, techniciensDisponibles, poolPhotos }: DemarrageWizardProps) {
  const [etape, setEtape] = useState<'acces' | 'refus' | 'etatInitial'>('acces');
  const [motif, setMotif] = useState<MotifNonAcces>(MotifNonAcces.CLIENT_ABSENT);
  const [commentaire, setCommentaire] = useState('');
  const [photos, setPhotos] = useState<PhotoChoisie[]>([]);
  const [galerieOuverte, setGalerieOuverte] = useState(false);

  const ajouterPhoto = (url: string) => {
    setPhotos((p) => [...p, { url, categorie: CategoriePhoto.ETAT_GENERAL }]);
    setGalerieOuverte(false);
  };
  const retirerPhoto = (index: number) => setPhotos((p) => p.filter((_, i) => i !== index));
  const changerCategorie = (index: number, categorie: CategoriePhoto) =>
    setPhotos((p) => p.map((photo, i) => (i === index ? { ...photo, categorie } : photo)));

  if (etape === 'acces') {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
          <p className="text-sm font-medium text-gray-900">Avez-vous accès à l&apos;appareil ?</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEtape('etatInitial')}
              className="rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white active:bg-emerald-700"
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setEtape('refus')}
              className="rounded-lg bg-rose-600 py-3 text-sm font-semibold text-white active:bg-rose-700"
            >
              Non
            </button>
          </div>
        </div>

        <ReattributionMobile interventionId={interventionId} techniciensDisponibles={techniciensDisponibles} />
      </div>
    );
  }

  if (etape === 'refus') {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-xs text-rose-700">
            Accès non obtenu : aucune autre information n&apos;est demandée (l&apos;état initial et le diagnostic ne s&apos;appliquent
            pas). Ce rapport est transmis tel quel une fois validé.
          </p>
        </div>

        <form action={validerAccesRefuse} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <input type="hidden" name="interventionId" value={interventionId} />

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Motif</label>
            <select
              name="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value as MotifNonAcces)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.values(MotifNonAcces).map((m) => (
                <option key={m} value={m}>
                  {LIBELLE_MOTIF_NON_ACCES[m]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Commentaire</label>
            <textarea
              name="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Détails utiles au dispatch…"
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Photo (facultatif)</label>

            {photos.map((photo, idx) => (
              <div key={`${photo.url}-${idx}`} className="mb-2 flex items-center gap-2 rounded-md border border-gray-200 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                <select
                  value={photo.categorie}
                  onChange={(e) => changerCategorie(idx, e.target.value as CategoriePhoto)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs text-gray-700"
                >
                  {Object.values(CategoriePhoto).map((c) => (
                    <option key={c} value={c}>
                      {LIBELLE_CATEGORIE_PHOTO[c]}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => retirerPhoto(idx)} className="shrink-0 text-gray-400">
                  <X className="h-4 w-4" />
                </button>
                <input type="hidden" name="photoUrl" value={photo.url} />
                <input type="hidden" name="photoCategorie" value={photo.categorie} />
              </div>
            ))}

            {photos.length < MAX_PHOTOS_REFUS && (
              <button
                type="button"
                onClick={() => setGalerieOuverte((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500"
              >
                <Camera className="h-3.5 w-3.5" />
                Ajouter une photo
              </button>
            )}

            {galerieOuverte && (
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {poolPhotos.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => ajouterPhoto(url)}
                    className="aspect-square overflow-hidden rounded-md border border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEtape('acces')}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm text-gray-600"
            >
              Retour
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white active:bg-gray-800">
              Valider
            </button>
          </div>
        </form>

        <ReattributionMobile interventionId={interventionId} techniciensDisponibles={techniciensDisponibles} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
      <form action={validerEtatInitial} className="rounded-lg border border-gray-200 bg-white p-5">
        <input type="hidden" name="interventionId" value={interventionId} />
        <p className="text-sm font-medium text-gray-900">Quel est l&apos;état de l&apos;appareil à votre arrivée ?</p>
        <div className="mt-4 flex flex-col gap-2">
          {ETATS_INITIAUX.map((etat) => (
            <button
              key={etat}
              type="submit"
              name="etatInitial"
              value={etat}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 active:bg-gray-100"
            >
              {LIBELLE_STATUT_APPAREIL[etat]}
              <CheckCircle2 className="h-4 w-4 shrink-0 text-gray-300" />
            </button>
          ))}
        </div>
      </form>

      <button
        type="button"
        onClick={() => setEtape('acces')}
        className="text-center text-xs text-gray-400 underline underline-offset-2"
      >
        Retour
      </button>

      <ReattributionMobile interventionId={interventionId} techniciensDisponibles={techniciensDisponibles} />
    </div>
  );
}
