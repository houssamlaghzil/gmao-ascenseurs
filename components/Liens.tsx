/**
 * Liens vers les entités du modèle.
 *
 * Règle du projet : toute valeur affichée qui désigne une entité (un client,
 * un contrat, un technicien, un site, un statut…) est rendue par l'un de ces
 * composants, jamais par du texte brut. C'est ce qui garantit qu'aucun
 * élément visible n'est un cul-de-sac, sans compter sur la vigilance de
 * celui qui écrit l'écran : afficher un nom de client sans lien demande
 * désormais plus d'effort que de le faire correctement.
 *
 * Chaque composant sait construire sa propre destination — les écrans n'ont
 * jamais à connaître la forme des URL. Les filtres du parcours en cours
 * peuvent être propagés via `filtres`, ce qui conserve le contexte de
 * descente (voir lib/derived/explorer.ts).
 *
 * Server Components : aucun état, aucun handler.
 */

import Link from 'next/link';
import { ReactNode } from 'react';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import {
  DimensionSlug,
  FiltresExploration,
  lienAppareil,
  lienDimension,
  lienGroupe,
} from '@/lib/derived/explorer';

/** Apparence partagée par tous les liens d'entité. */
const STYLE_BASE =
  'inline-flex items-center gap-1 rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

interface LienEntiteProps {
  href: string;
  children: ReactNode;
  /** `sobre` pour une valeur dans un tableau, `accentue` pour une référence mise en avant. */
  ton?: 'sobre' | 'accentue';
  className?: string;
  title?: string;
}

export function LienEntite({ href, children, ton = 'accentue', className = '', title }: LienEntiteProps) {
  const couleur = ton === 'accentue' ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-700 hover:text-indigo-700';
  return (
    <Link href={href} title={title} className={`${STYLE_BASE} ${couleur} ${className}`}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Entités du modèle
// ---------------------------------------------------------------------------

export function LienAppareil({
  ascenseurId,
  children,
  ton,
  className,
}: {
  ascenseurId: string;
  children: ReactNode;
  ton?: 'sobre' | 'accentue';
  className?: string;
}) {
  return (
    <LienEntite href={lienAppareil(ascenseurId)} ton={ton} className={className}>
      {children}
    </LienEntite>
  );
}

/** Lien générique vers le palier « appareils d'un groupe » d'une dimension. */
export function LienGroupe({
  dimension,
  valeur,
  filtres,
  children,
  ton,
  className,
}: {
  dimension: DimensionSlug;
  valeur: string;
  filtres?: FiltresExploration;
  children: ReactNode;
  ton?: 'sobre' | 'accentue';
  className?: string;
}) {
  return (
    <LienEntite href={lienGroupe(dimension, valeur, filtres)} ton={ton} className={className}>
      {children}
    </LienEntite>
  );
}

type PropsGroupeNomme = {
  id: string;
  filtres?: FiltresExploration;
  children: ReactNode;
  ton?: 'sobre' | 'accentue';
  className?: string;
};

export const LienSite = (p: PropsGroupeNomme) => <LienGroupe dimension="parc" valeur={p.id} {...p} />;
export const LienClient = (p: PropsGroupeNomme) => <LienGroupe dimension="client" valeur={p.id} {...p} />;
export const LienContrat = (p: PropsGroupeNomme) => <LienGroupe dimension="contrat" valeur={p.id} {...p} />;
export const LienTechnicien = (p: PropsGroupeNomme) => <LienGroupe dimension="technicien" valeur={p.id} {...p} />;
export const LienTournee = (p: PropsGroupeNomme) => <LienGroupe dimension="tournee" valeur={p.id} {...p} />;
export const LienSecteur = (p: PropsGroupeNomme) => <LienGroupe dimension="secteur" valeur={p.id} {...p} />;
export const LienVille = (p: PropsGroupeNomme) => <LienGroupe dimension="ville" valeur={p.id} {...p} />;

/** Lien vers le palier de décomposition complet d'une dimension. */
export function LienDimension({
  dimension,
  filtres,
  children,
  ton,
  className,
}: {
  dimension: DimensionSlug;
  filtres?: FiltresExploration;
  children: ReactNode;
  ton?: 'sobre' | 'accentue';
  className?: string;
}) {
  return (
    <LienEntite href={lienDimension(dimension, filtres)} ton={ton} className={className}>
      {children}
    </LienEntite>
  );
}

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------

const PASTILLE_STATUT: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_SERVICE]: 'bg-emerald-500',
  [StatutAppareil.EN_PANNE]: 'bg-rose-500',
  [StatutAppareil.A_L_ARRET]: 'bg-orange-500',
  [StatutAppareil.MODE_DEGRADE]: 'bg-amber-500',
  [StatutAppareil.ARRET_TRAVAUX]: 'bg-slate-500',
};

export function PastilleStatut({ statut, className = '' }: { statut: StatutAppareil; className?: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${PASTILLE_STATUT[statut]} ${className}`} aria-hidden />;
}

/**
 * Un statut, cliquable : mène à la décomposition du parc pour ce statut, en
 * conservant le reste du parcours. « En panne » depuis n'importe où ouvre donc
 * la même exploration.
 */
export function LienStatut({
  statut,
  dimension = 'parc',
  filtres,
  avecPastille = true,
  children,
  className,
}: {
  statut: StatutAppareil;
  dimension?: DimensionSlug;
  filtres?: FiltresExploration;
  avecPastille?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <LienEntite href={lienDimension(dimension, { ...filtres, statut })} ton="sobre" className={className}>
      {avecPastille && <PastilleStatut statut={statut} />}
      {children ?? LIBELLE_STATUT_APPAREIL[statut]}
    </LienEntite>
  );
}
