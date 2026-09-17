/**
 * Squelette de chargement de la conformité contractuelle
 * (`app/conformite/page.tsx`).
 *
 * Reprend l'en-tête, le bandeau des 5 compteurs, les 3 tuiles, le bloc
 * « origine du déficit » puis les 3 tableaux (par opération, par contrat,
 * par client).
 */

import {
  CadreTableauSquelette,
  EnTeteSquelette,
  Ligne,
  StatutChargement,
  TuileChiffre,
} from '@/components/skeletons/BlocsSquelette';

export default function Loading() {
  return (
    <>
      <StatutChargement texte="Chargement de la conformité contractuelle en cours" />

      <div className="space-y-6 cascade-squelette">
        <EnTeteSquelette avecIcone largeurTitre="w-80" lignesSousTitre={3} />

        {/* Bandeau des 5 compteurs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <TuileChiffre key={i} />
          ))}
        </div>

        {/* 3 tuiles de synthèse */}
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TuileChiffre key={i} />
          ))}
        </div>

        {/* Origine du déficit */}
        <div aria-hidden className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <Ligne className="h-3 w-32" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Ligne className="h-4 w-48" />
              <Ligne className="h-3 w-full" />
            </div>
            <div className="space-y-1.5">
              <Ligne className="h-4 w-48" />
              <Ligne className="h-3 w-full" />
            </div>
          </div>
        </div>

        <CadreTableauSquelette largeurTitre="w-56" largeurSousTitre="w-96" colonnes={8} lignes={7} />
        <CadreTableauSquelette largeurTitre="w-32" largeurSousTitre="w-80" colonnes={11} lignes={10} />
        <CadreTableauSquelette largeurTitre="w-28" largeurSousTitre="w-96" colonnes={9} lignes={8} />
      </div>
    </>
  );
}
