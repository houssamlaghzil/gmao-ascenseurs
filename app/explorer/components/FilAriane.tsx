/**
 * Fil d'Ariane de l'exploration — le repère permanent de la descente.
 *
 * Deux lignes, deux rôles distincts :
 *
 *  1. Le *chemin* (Tableau de bord › Explorer › Dimension › Groupe) dit où l'on
 *     se trouve dans la descente, et chaque étape reste cliquable en emportant
 *     les critères en cours : remonter d'un palier ne remet pas à zéro le
 *     travail de filtrage déjà fait.
 *
 *  2. Les *critères actifs*, en pastilles retirables. C'est le point clé de
 *     l'UX : chaque pastille renvoie vers la page courante privée de ce seul
 *     critère (`sansCeCritere`), jamais vers une page nettoyée de tout. On peut
 *     donc être sur « les appareils en panne du technicien Dupont » et enlever
 *     « en panne » pour voir tout son portefeuille, sans quitter Dupont ni
 *     reconstruire le parcours à la main.
 *
 * Retirer un critère change l'ensemble affiché : le lien produit ne porte
 * volontairement pas de `page`, ce qui ramène à la première page de résultats.
 *
 * Server Component : aucun état, aucun handler.
 */

import Link from 'next/link';
import { ChevronRight, X } from 'lucide-react';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import {
  CritereActif,
  DimensionSlug,
  FiltresExploration,
  definitionDimension,
  lienDimension,
  lienGroupe,
  listerCriteresActifs,
  serialiserFiltres,
} from '@/lib/derived/explorer';

/** Contexte de la page courante, d'où se déduisent le chemin et les liens de retrait. */
export interface ContexteFilAriane {
  /** Absent sur l'accueil `/explorer`. */
  dimension?: DimensionSlug;
  /** Présent au palier 2 uniquement. */
  groupe?: { valeur: string; libelle: string };
}

/** Reconstruit l'URL de la page courante pour un jeu de filtres donné. */
export function lienPageCourante(contexte: ContexteFilAriane, filtres: FiltresExploration): string {
  if (!contexte.dimension) return `/explorer${serialiserFiltres(filtres)}`;
  if (contexte.groupe) return lienGroupe(contexte.dimension, contexte.groupe.valeur, filtres);
  return lienDimension(contexte.dimension, filtres);
}

/** Préfixe explicitant la nature du critère quand son libellé seul est ambigu. */
const PREFIXE_CRITERE: Partial<Record<CritereActif['cle'], string>> = {
  statut: 'Statut',
  recherche: 'Recherche',
};

export default function FilAriane({
  filtres,
  ...contexte
}: ContexteFilAriane & { filtres: FiltresExploration }) {
  const { dimension, groupe } = contexte;
  const criteres = listerCriteresActifs(filtres, (s: StatutAppareil) => LIBELLE_STATUT_APPAREIL[s]);

  // Le dernier maillon n'est pas un lien : il désigne la page qu'on regarde.
  const etapes: { libelle: string; href?: string }[] = [
    { libelle: 'Tableau de bord', href: '/' },
    { libelle: 'Explorer', href: dimension ? `/explorer${serialiserFiltres(filtres)}` : undefined },
  ];
  if (dimension) {
    const definition = definitionDimension(dimension);
    etapes.push({
      libelle: definition.libellePluriel,
      href: groupe ? lienDimension(dimension, filtres) : undefined,
    });
  }
  if (groupe) etapes.push({ libelle: groupe.libelle });

  return (
    <div className="space-y-2">
      <nav aria-label="Fil d'Ariane">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
          {etapes.map((etape, index) => (
            <li key={`${etape.libelle}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />}
              {etape.href ? (
                <Link
                  href={etape.href}
                  className="rounded text-gray-500 underline-offset-2 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {etape.libelle}
                </Link>
              ) : (
                <span className="font-medium text-gray-900" aria-current="page">
                  {etape.libelle}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {criteres.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Critères</span>
          {criteres.map((critere) => {
            const prefixe = PREFIXE_CRITERE[critere.cle];
            return (
              <Link
                key={critere.cle}
                href={lienPageCourante(contexte, critere.sansCeCritere)}
                title={`Retirer le critère : ${critere.libelle}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-indigo-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {prefixe && <span className="font-normal text-indigo-400 group-hover:text-rose-400">{prefixe}</span>}
                {critere.libelle}
                <X className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
                <span className="sr-only">Retirer ce critère</span>
              </Link>
            );
          })}
          {criteres.length > 1 && (
            <Link
              href={lienPageCourante(contexte, {})}
              className="ml-0.5 rounded px-1 text-xs text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Tout retirer
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
