'use client';

/**
 * Modification de fiche technique côté mobile (section 23) : digicode et
 * gestion des clés. Trois écrans locaux (lecture → édition → confirmation)
 * pour rester dans l'esprit "un écran = une action" malgré les deux champs
 * modifiables : la confirmation résume chaque changement sous la forme
 * "Digicode : 4521 → 8754" avant tout envoi au serveur.
 */

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Pencil } from 'lucide-react';
import { DetenteurCles } from '@/domain/types';
import { LIBELLE_DETENTEUR_CLES } from '@/lib/derived/libelles-parc';
import { modifierFicheTechniqueAction } from '../actions';

interface ModifierAccesFormProps {
  ascenseurId: string;
  digicodeActuel?: string;
  detenteurActuel: DetenteurCles;
  localisationActuelle?: string;
}

type Mode = 'lecture' | 'edition' | 'confirmation';

const NON_RENSEIGNE = 'Non renseigné';

export default function ModifierAccesForm({ ascenseurId, digicodeActuel, detenteurActuel, localisationActuelle }: ModifierAccesFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('lecture');
  const [digicode, setDigicode] = useState(digicodeActuel ?? '');
  const [detenteur, setDetenteur] = useState<DetenteurCles>(detenteurActuel);
  const [localisation, setLocalisation] = useState(localisationActuelle ?? '');
  const [erreur, setErreur] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const digicodeModifie = digicode.trim() !== (digicodeActuel ?? '').trim();
  const detenteurModifie = detenteur !== detenteurActuel;
  const localisationModifiee = localisation.trim() !== (localisationActuelle ?? '').trim();
  const auMoinsUneModification = digicodeModifie || detenteurModifie || localisationModifiee;

  function reinitialiser() {
    setDigicode(digicodeActuel ?? '');
    setDetenteur(detenteurActuel);
    setLocalisation(localisationActuelle ?? '');
    setErreur(undefined);
  }

  function annuler() {
    reinitialiser();
    setMode('lecture');
  }

  function passerEnConfirmation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auMoinsUneModification) return;
    setMode('confirmation');
  }

  function confirmer() {
    setErreur(undefined);
    startTransition(async () => {
      const resultat = await modifierFicheTechniqueAction(ascenseurId, {
        digicode: digicodeModifie ? digicode.trim() : undefined,
        detenteurCles: detenteurModifie ? detenteur : undefined,
        localisationCles: localisationModifiee ? localisation.trim() : undefined,
      });
      if (resultat.success) {
        setMode('lecture');
        router.refresh();
      } else {
        setErreur(resultat.error ?? 'Erreur inattendue.');
        setMode('edition');
      }
    });
  }

  if (mode === 'lecture') {
    return (
      <button
        type="button"
        onClick={() => setMode('edition')}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        <Pencil className="h-3 w-3" /> Modifier
      </button>
    );
  }

  if (mode === 'confirmation') {
    return (
      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
        <p className="text-xs font-medium text-gray-500 uppercase">Confirmer les modifications</p>
        <ul className="space-y-1.5 text-sm text-gray-900">
          {digicodeModifie && (
            <li>
              Digicode : <span className="text-gray-400">{digicodeActuel || NON_RENSEIGNE}</span>
              {' → '}
              <span className="font-semibold">{digicode.trim() || NON_RENSEIGNE}</span>
            </li>
          )}
          {detenteurModifie && (
            <li>
              Gestion des clés : <span className="text-gray-400">{LIBELLE_DETENTEUR_CLES[detenteurActuel]}</span>
              {' → '}
              <span className="font-semibold">{LIBELLE_DETENTEUR_CLES[detenteur]}</span>
            </li>
          )}
          {localisationModifiee && (
            <li>
              Localisation des clés : <span className="text-gray-400">{localisationActuelle || NON_RENSEIGNE}</span>
              {' → '}
              <span className="font-semibold">{localisation.trim() || NON_RENSEIGNE}</span>
            </li>
          )}
        </ul>

        {erreur && (
          <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setMode('edition')} className="px-3 py-1.5 text-xs text-gray-600">
            Retour
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={confirmer}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Envoi…' : 'Confirmer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={passerEnConfirmation} className="mt-3 space-y-3 border-t border-gray-100 pt-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Digicode</label>
        <input
          value={digicode}
          onChange={(e) => setDigicode(e.target.value)}
          placeholder="Ex. 4521"
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Gestion des clés</label>
        <select
          value={detenteur}
          onChange={(e) => setDetenteur(e.target.value as DetenteurCles)}
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(DetenteurCles).map((d) => (
            <option key={d} value={d}>
              {LIBELLE_DETENTEUR_CLES[d]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Localisation des clés</label>
        <input
          value={localisation}
          onChange={(e) => setLocalisation(e.target.value)}
          placeholder="Ex. Loge du gardien"
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={annuler} className="px-3 py-1.5 text-xs text-gray-600">
          Annuler
        </button>
        <button
          type="submit"
          disabled={!auMoinsUneModification}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer
        </button>
      </div>
    </form>
  );
}
