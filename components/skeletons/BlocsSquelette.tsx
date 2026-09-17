/**
 * Briques partagées des squelettes de chargement (`loading.tsx`).
 *
 * Server Components purs : aucun état, aucun `'use client'`. Chaque brique ne
 * reproduit qu'une FORME (hauteur, largeur, disposition) — jamais un texte
 * factice. Le mouvement vient de deux classes déjà déclarées dans
 * `app/globals.css`, qu'on ne réinvente pas ici :
 *
 *  - `.cascade-squelette` posée sur un conteneur fait apparaître ses enfants
 *    directs l'un après l'autre (c'est elle qui donne le « peu à peu ») ;
 *  - `.bloc-squelette` fait respirer doucement un bloc pendant l'attente.
 *
 * Convention : tout élément purement décoratif porte `aria-hidden`, et
 * chaque écran de chargement pose une seule fois `<StatutChargement />` pour
 * l'annoncer aux technologies d'assistance.
 */

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Accessibilité
// ---------------------------------------------------------------------------

/** Libellé accessible unique par écran — le reste du squelette est décoratif. */
export function StatutChargement({ texte = 'Chargement du contenu en cours' }: { texte?: string }) {
  return (
    <span role="status" className="sr-only">
      {texte}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Brique de base
// ---------------------------------------------------------------------------

/** Une barre grise — le plus petit repère de squelette, jamais de texte factice. */
export function Ligne({ className = 'h-4 w-full' }: { className?: string }) {
  return <div aria-hidden className={`bloc-squelette rounded bg-gray-200 ${className}`} />;
}

// ---------------------------------------------------------------------------
// En-tête de page
// ---------------------------------------------------------------------------

/** Titre (+ icône optionnelle) et paragraphe d'introduction. */
export function EnTeteSquelette({
  avecIcone = false,
  largeurTitre = 'w-72',
  lignesSousTitre = 1,
}: {
  avecIcone?: boolean;
  largeurTitre?: string;
  lignesSousTitre?: number;
}) {
  return (
    <div aria-hidden>
      <div className="flex items-center gap-2">
        {avecIcone && <Ligne className="h-6 w-6 rounded" />}
        <Ligne className={`h-8 ${largeurTitre}`} />
      </div>
      {lignesSousTitre > 0 && (
        <div className="mt-2 space-y-1.5">
          {Array.from({ length: lignesSousTitre }).map((_, i) => (
            <Ligne key={i} className={`h-4 ${i === lignesSousTitre - 1 ? 'w-2/3' : 'max-w-2xl'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tuiles chiffrées (StatCard / Tuile de conformité)
// ---------------------------------------------------------------------------

/** Carte KPI façon `components/StatCard` : libellé, gros chiffre, icône. */
export function TuileStat() {
  return (
    <div aria-hidden className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Ligne className="h-4 w-2/3" />
          <Ligne className="h-8 w-1/3" />
        </div>
        <Ligne className="h-7 w-7 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

/** Tuile compacte façon `ConformiteUI.Tuile` : libellé, valeur, précision. */
export function TuileChiffre() {
  return (
    <div aria-hidden className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <Ligne className="h-3 w-2/3" />
      <Ligne className="mt-2 h-7 w-1/2" />
      <Ligne className="mt-1.5 h-3 w-3/4" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau générique (Card / cadre blanc)
// ---------------------------------------------------------------------------

/** Cadre blanc arrondi façon `components/Card`, en-tête optionnel. */
export function Panneau({
  avecEntete = false,
  largeurTitre = 'w-40',
  largeurSousTitre,
  className = '',
  children,
}: {
  avecEntete?: boolean;
  largeurTitre?: string;
  largeurSousTitre?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {avecEntete && (
        <div aria-hidden className="space-y-2 border-b border-gray-200 px-6 py-4">
          <Ligne className={`h-5 ${largeurTitre}`} />
          {largeurSousTitre && <Ligne className={`h-3.5 ${largeurSousTitre}`} />}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Répartition (barre + compteurs + chiffre clé — app/explorer)
// ---------------------------------------------------------------------------

/** Chiffre mis en avant façon `Repartition.ChiffreCle`. */
export function ChiffreClePlaceholder({
  largeurValeur = 'w-16',
  largeurLibelle = 'w-24',
}: {
  largeurValeur?: string;
  largeurLibelle?: string;
}) {
  return (
    <div aria-hidden>
      <Ligne className={`h-7 ${largeurValeur}`} />
      <Ligne className={`mt-1.5 h-3 ${largeurLibelle}`} />
    </div>
  );
}

/** Barre proportionnelle façon `Repartition.BarreRepartition`. */
export function BarrePlaceholder({ hauteur = 'h-2' }: { hauteur?: string }) {
  return <Ligne className={`${hauteur} w-full rounded-full`} />;
}

/** Compteurs par statut façon `Repartition.CompteursStatuts`. */
export function CompteursPlaceholder({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden className="flex flex-wrap items-center gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Ligne key={i} className="h-3 w-16" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fil d'Ariane et sélecteurs (app/explorer)
// ---------------------------------------------------------------------------

/** Fil d'Ariane façon `explorer/components/FilAriane`. */
export function FilArianePlaceholder() {
  return (
    <div aria-hidden className="flex items-center gap-2">
      <Ligne className="h-3 w-20" />
      <Ligne className="h-3 w-3 rounded-full" />
      <Ligne className="h-3 w-16" />
      <Ligne className="h-3 w-3 rounded-full" />
      <Ligne className="h-3 w-28" />
    </div>
  );
}

/** Rangée de pastilles façon `SelecteurDimension` ou les puces de filtres actifs. */
export function PastillesPlaceholder({ count = 7 }: { count?: number }) {
  return (
    <div aria-hidden className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Ligne key={i} className="h-7 w-24 rounded-md" />
      ))}
    </div>
  );
}

/** Carte de groupe façon `explorer/components/CarteGroupe`. */
export function CarteGroupePlaceholder() {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <Ligne className="h-4 w-2/3" />
        <Ligne className="h-4 w-4 rounded" />
      </div>
      <div className="flex items-end justify-between gap-3">
        <Ligne className="h-7 w-20" />
        <Ligne className="h-3 w-12" />
      </div>
      <div className="space-y-1.5">
        <BarrePlaceholder />
        <CompteursPlaceholder count={2} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaires de filtres
// ---------------------------------------------------------------------------

/** Un champ « libellé + saisie » façon `FiltresAppareilsForm` / `FiltresCarteForm`. */
export function ChampFiltrePlaceholder() {
  return (
    <div aria-hidden className="space-y-1.5">
      <Ligne className="h-3 w-16" />
      <Ligne className="h-8 w-full rounded-md" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglets (fiche appareil)
// ---------------------------------------------------------------------------

/** Bandeau d'onglets façon `OngletsAppareil`. */
export function OngletsPlaceholder({ count = 7 }: { count?: number }) {
  return (
    <div aria-hidden className="flex gap-6 overflow-x-auto border-b border-gray-200 pb-3">
      {Array.from({ length: count }).map((_, i) => (
        <Ligne key={i} className="h-4 w-20 shrink-0" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tableaux
// ---------------------------------------------------------------------------

/**
 * Tableau complet (en-tête + lignes), structure `<table>` réelle pour que les
 * hauteurs de ligne collent à celles des tableaux qu'il remplace.
 * `avecCadre=false` retire le cadre propre (utile sous `CadreTableauSquelette`,
 * qui porte déjà le sien).
 */
export function TableauSquelette({
  colonnes = 5,
  lignes = 6,
  avecCadre = true,
}: {
  colonnes?: number;
  lignes?: number;
  avecCadre?: boolean;
}) {
  const table = (
    <table aria-hidden className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: colonnes }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <Ligne className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {Array.from({ length: lignes }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: colonnes }).map((_, c) => (
              <td key={c} className="px-4 py-3">
                <Ligne className="h-4 w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (!avecCadre) {
    return <div className="overflow-x-auto">{table}</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">{table}</div>
    </div>
  );
}

/** Cadre + en-tête + tableau, façon `ConformiteUI.CadreTableau`. */
export function CadreTableauSquelette({
  largeurTitre = 'w-48',
  largeurSousTitre = 'w-72',
  colonnes = 6,
  lignes = 6,
}: {
  largeurTitre?: string;
  largeurSousTitre?: string;
  colonnes?: number;
  lignes?: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <header aria-hidden className="space-y-1.5 border-b border-gray-200 px-4 py-3">
        <Ligne className={`h-4 ${largeurTitre}`} />
        <Ligne className={`h-3 ${largeurSousTitre}`} />
      </header>
      <TableauSquelette colonnes={colonnes} lignes={lignes} avecCadre={false} />
    </section>
  );
}
