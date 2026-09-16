'use client';

/**
 * Capture des photos "après traitement" et déclaration d'une réserve CTQ
 * traitée (section 32, s'appuyant sur la règle métier "photo obligatoire
 * pour réserve CTQ", section 29). Pas de vrai accès caméra (section 29) :
 * "Ajouter une photo" associe une image du pool mutualisé déjà utilisé côté
 * web (voir app/rapports/[id]/components/PhotosRapport.tsx).
 *
 * Le bouton "Déclarer traitée" reste volontairement actif même sans photo :
 * la garde métier (declarerReserveTraitee) doit pouvoir être démontrée telle
 * quelle, avec son message d'erreur affiché proprement plutôt que masqué par
 * une désactivation silencieuse du bouton.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, X } from 'lucide-react';
import { declarerTraitee } from '../actions';

export default function ReserveTraitementForm({ reserveId, poolPhotos }: { reserveId: string; poolPhotos: string[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [commentaire, setCommentaire] = useState('');
  const [erreur, setErreur] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const ajouterPhoto = () => {
    if (poolPhotos.length === 0) return;
    const disponibles = poolPhotos.filter((url) => !photos.includes(url));
    const suivante = disponibles[Math.floor(Math.random() * disponibles.length)] ?? poolPhotos[photos.length % poolPhotos.length];
    setPhotos((p) => [...p, suivante]);
  };

  const retirerPhoto = (url: string) => setPhotos((p) => p.filter((u) => u !== url));

  const soumettre = () => {
    setErreur(undefined);
    startTransition(async () => {
      const resultat = await declarerTraitee(reserveId, photos, commentaire);
      if (resultat.success) {
        router.refresh();
      } else {
        setErreur(resultat.error ?? 'Erreur inattendue.');
      }
    });
  };

  return (
    <div className="space-y-2 rounded-md border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-600">Photo(s) après traitement</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div key={url} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Photo de traitement" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => retirerPhoto(url)}
              aria-label="Retirer la photo"
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={ajouterPhoto}
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-gray-300 text-gray-400"
        >
          <Camera className="h-4 w-4" />
          <span className="text-[9px]">Ajouter</span>
        </button>
      </div>

      <textarea
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        rows={2}
        placeholder="Commentaire (optionnel)"
        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {erreur && (
        <div className="flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {erreur}
        </div>
      )}

      <button
        type="button"
        onClick={soumettre}
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Déclarer traitée'}
      </button>
    </div>
  );
}
