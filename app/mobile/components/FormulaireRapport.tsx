'use client';

/**
 * Compte-rendu + photos + signatures (sections 28/29/30), partagé entre la
 * clôture d'intervention (app/mobile/interventions/[id]/cloture) et le
 * rapport isolé (app/mobile/rapport-isole). L'état vit chez l'appelant
 * (composant contrôlé) car chacune des deux pages a ses propres champs
 * supplémentaires (état de clôture / motif du rapport isolé) à combiner
 * avec celui-ci avant l'appel à sa propre Server Action.
 *
 * - Dictée vocale (28) : pas de reconnaissance vocale réelle — un bouton
 *   bascule un état "enregistrement en cours" puis insère un texte
 *   d'exemple après un court délai simulé, purement illustratif (badge
 *   "premium").
 * - Photos (29) : pool mutualisé d'URLs (même principe que
 *   app/rapports/[id]/components/PhotosRapport.tsx et
 *   app/mobile/interventions/[id]/demarrage), catégorie + commentaire par
 *   photo, avertissements non bloquants si RegleObligationPhotos n'est pas
 *   respectée (même esprit que l'avertissement de durée insuffisante des
 *   maintenances côté web : on prévient, on ne bloque pas la validation).
 * - Signatures (30) : signature technicien = simple bascule signé/non signé
 *   (pas de canvas réel) ; signature client = décision explicite parmi les
 *   3 valeurs de StatutSignatureClient, jamais un champ vide.
 */

import { useState, type Dispatch, type SetStateAction } from 'react';
import { AlertTriangle, Camera, Mic, PenLine, Sparkles, X } from 'lucide-react';
import { CategoriePhoto, RegleObligationPhotos, StatutSignatureClient } from '@/domain/types';
import { LIBELLE_CATEGORIE_PHOTO, LIBELLE_STATUT_SIGNATURE_CLIENT } from '@/lib/derived/libelles-rapports';
import { cn } from '@/lib/utils';

export interface PhotoSaisieRapport {
  /** Identifiant local (client uniquement) pour le key/la suppression — jamais l'id PhotoRapport final. */
  clientId: string;
  url: string;
  categorie: CategoriePhoto;
  legende: string;
}

export interface EtatFormulaireRapport {
  commentaire: string;
  commentaireSaisieVocale: boolean;
  photos: PhotoSaisieRapport[];
  signatureTechnicienSignee: boolean;
  signatureClientStatut: StatutSignatureClient | null;
  signatureClientNom: string;
  signatureClientMotif: string;
}

export const ETAT_FORMULAIRE_RAPPORT_INITIAL: EtatFormulaireRapport = {
  commentaire: '',
  commentaireSaisieVocale: false,
  photos: [],
  signatureTechnicienSignee: false,
  signatureClientStatut: null,
  signatureClientNom: '',
  signatureClientMotif: '',
};

const SUGGESTIONS_COMPTE_RENDU = [
  'Panne résolue après remplacement de la pièce défectueuse. Appareil testé et remis en service.',
  'Réglage effectué sur site, plusieurs cycles de test réalisés sans anomalie.',
  "Intervention réalisée conformément à la demande, aucune anomalie complémentaire constatée.",
];

const PHRASE_DICTEE_EXEMPLE =
  "Diagnostic confirmé à l'arrivée, intervention réalisée sans difficulté particulière. Appareil contrôlé et remis en service, fonctionnement nominal constaté avant de quitter le site.";

let seqPhotoClient = 0;
function idPhotoClient(): string {
  seqPhotoClient += 1;
  return `photo-client-${seqPhotoClient}`;
}

/** Avertissements non bloquants si la règle d'obligation photos (section 29) n'est pas respectée. */
export function calculerAvertissementsPhotos(
  photos: PhotoSaisieRapport[],
  regle: RegleObligationPhotos | undefined,
  pieceCasseeSignalee: boolean
): string[] {
  if (!regle) return [];
  const avertissements: string[] = [];

  if (photos.length < regle.nombreMinimal) {
    avertissements.push(
      `Au moins ${regle.nombreMinimal} photo${regle.nombreMinimal > 1 ? 's' : ''} recommandée${regle.nombreMinimal > 1 ? 's' : ''} pour ce type de rapport (actuellement ${photos.length}).`
    );
  }
  if (regle.avantApresObligatoire) {
    const aAvant = photos.some((p) => p.categorie === CategoriePhoto.AVANT_INTERVENTION);
    const aApres = photos.some((p) => p.categorie === CategoriePhoto.APRES_INTERVENTION);
    if (!aAvant || !aApres) {
      avertissements.push('Une photo « avant intervention » et une photo « après intervention » sont recommandées.');
    }
  }
  if (regle.photoObligatoireSiPieceCassee && pieceCasseeSignalee && !photos.some((p) => p.categorie === CategoriePhoto.PIECE_CASSEE)) {
    avertissements.push('Une pièce cassée a été signalée au diagnostic : une photo « pièce cassée » est recommandée.');
  }
  return avertissements;
}

interface FormulaireRapportProps {
  technicienNom: string;
  poolPhotos: string[];
  regle?: RegleObligationPhotos;
  /** true si le diagnostic préalable indique une pièce cassée (pilote l'avertissement photo dédié). */
  pieceCasseeSignalee?: boolean;
  value: EtatFormulaireRapport;
  onChange: Dispatch<SetStateAction<EtatFormulaireRapport>>;
}

export default function FormulaireRapport({
  technicienNom,
  poolPhotos,
  regle,
  pieceCasseeSignalee = false,
  value,
  onChange,
}: FormulaireRapportProps) {
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [galerieOuverte, setGalerieOuverte] = useState(false);

  const lancerDicteeVocale = () => {
    if (enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    setTimeout(() => {
      onChange((prev) => ({
        ...prev,
        commentaire: prev.commentaire ? `${prev.commentaire}\n${PHRASE_DICTEE_EXEMPLE}` : PHRASE_DICTEE_EXEMPLE,
        commentaireSaisieVocale: true,
      }));
      setEnregistrementEnCours(false);
    }, 1400);
  };

  const insererSuggestion = (phrase: string) => {
    onChange((prev) => ({ ...prev, commentaire: prev.commentaire ? `${prev.commentaire}\n${phrase}` : phrase }));
  };

  const ajouterPhoto = (url: string) => {
    onChange((prev) => ({
      ...prev,
      photos: [...prev.photos, { clientId: idPhotoClient(), url, categorie: CategoriePhoto.ETAT_GENERAL, legende: '' }],
    }));
    setGalerieOuverte(false);
  };
  const retirerPhoto = (clientId: string) =>
    onChange((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.clientId !== clientId) }));
  const modifierPhoto = (clientId: string, patch: Partial<PhotoSaisieRapport>) =>
    onChange((prev) => ({ ...prev, photos: prev.photos.map((p) => (p.clientId === clientId ? { ...p, ...patch } : p)) }));

  const avertissements = calculerAvertissementsPhotos(value.photos, regle, pieceCasseeSignalee);

  return (
    <>
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Compte-rendu</h2>
        <textarea
          value={value.commentaire}
          onChange={(e) => onChange((prev) => ({ ...prev, commentaire: e.target.value, commentaireSaisieVocale: false }))}
          rows={5}
          placeholder="Décrivez l'intervention réalisée…"
          className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={lancerDicteeVocale}
          disabled={enregistrementEnCours}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-indigo-300 bg-indigo-50 py-2 text-xs font-medium text-indigo-700 disabled:opacity-60"
        >
          <Mic className={cn('h-3.5 w-3.5', enregistrementEnCours && 'animate-pulse')} />
          {enregistrementEnCours ? 'Enregistrement en cours…' : 'Dictée vocale (premium)'}
        </button>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS_COMPTE_RENDU.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => insererSuggestion(phrase)}
              className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-left text-[11px] text-gray-600"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-gray-400" />
              {phrase.length > 42 ? `${phrase.slice(0, 42)}…` : phrase}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Photos ({value.photos.length})</h2>

        {avertissements.length > 0 && (
          <div className="mb-3 space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2.5">
            {avertissements.map((avertissement) => (
              <p key={avertissement} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {avertissement}
              </p>
            ))}
          </div>
        )}

        {value.photos.length > 0 && (
          <div className="mb-3 space-y-2">
            {value.photos.map((photo) => (
              <div key={photo.clientId} className="flex gap-2 rounded-md border border-gray-200 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1 space-y-1">
                  <select
                    value={photo.categorie}
                    onChange={(e) => modifierPhoto(photo.clientId, { categorie: e.target.value as CategoriePhoto })}
                    className="w-full rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs text-gray-700"
                  >
                    {Object.values(CategoriePhoto).map((c) => (
                      <option key={c} value={c}>
                        {LIBELLE_CATEGORIE_PHOTO[c]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={photo.legende}
                    onChange={(e) => modifierPhoto(photo.clientId, { legende: e.target.value })}
                    placeholder="Commentaire (optionnel)"
                    className="w-full rounded-md border border-gray-300 px-1.5 py-1 text-xs text-gray-700"
                  />
                </div>
                <button type="button" onClick={() => retirerPhoto(photo.clientId)} className="shrink-0 self-start text-gray-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setGalerieOuverte((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500"
        >
          <Camera className="h-3.5 w-3.5" />
          Ajouter une photo
        </button>

        {galerieOuverte && (
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {poolPhotos.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
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
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Signatures</h2>

        <div className="mb-3 rounded-md border border-gray-200 p-3">
          <p className="text-xs font-medium uppercase text-gray-500">Technicien</p>
          <p className="mt-0.5 text-sm text-gray-900">{technicienNom}</p>
          {value.signatureTechnicienSignee ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <PenLine className="h-3.5 w-3.5" />
                Signature enregistrée
              </span>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, signatureTechnicienSignee: false }))}
                className="text-[11px] text-gray-400 underline underline-offset-2"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, signatureTechnicienSignee: true }))}
              className="mt-2 w-full rounded-md bg-gray-900 py-2 text-xs font-semibold text-white active:bg-gray-800"
            >
              Signer
            </button>
          )}
        </div>

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-medium uppercase text-gray-500">Client</p>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.values(StatutSignatureClient).map((statut) => (
              <button
                key={statut}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, signatureClientStatut: statut }))}
                className={cn(
                  'rounded-md border py-2 text-xs font-medium',
                  value.signatureClientStatut === statut ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
                )}
              >
                {LIBELLE_STATUT_SIGNATURE_CLIENT[statut]}
              </button>
            ))}
          </div>

          {value.signatureClientStatut === StatutSignatureClient.SIGNE && (
            <input
              type="text"
              value={value.signatureClientNom}
              onChange={(e) => onChange((prev) => ({ ...prev, signatureClientNom: e.target.value }))}
              placeholder="Nom du signataire"
              className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900"
            />
          )}
          {(value.signatureClientStatut === StatutSignatureClient.ABSENT || value.signatureClientStatut === StatutSignatureClient.INDISPONIBLE) && (
            <input
              type="text"
              value={value.signatureClientMotif}
              onChange={(e) => onChange((prev) => ({ ...prev, signatureClientMotif: e.target.value }))}
              placeholder="Précision (optionnel)"
              className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900"
            />
          )}
        </div>
      </section>
    </>
  );
}
