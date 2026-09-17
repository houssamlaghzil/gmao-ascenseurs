/**
 * Lecture visuelle d'une `RepartitionStatuts` : la barre proportionnelle et
 * ses compteurs.
 *
 * C'est la brique répétée des trois paliers — accueil, décomposition, groupe.
 * Elle est isolée ici pour que la même répartition se lise exactement pareil
 * quel que soit l'axe : l'œil compare 500 sites entre eux uniquement si la
 * couleur, l'ordre et l'échelle ne bougent jamais.
 *
 * Ordre des segments : les états qui posent problème d'abord, l'état normal
 * en dernier. La conséquence est voulue — le liseré rouge est toujours collé
 * au bord gauche, donc aligné d'une carte à l'autre, et une seule panne sur
 * 200 appareils reste repérable au lieu de se noyer au milieu du vert.
 *
 * Server Component : aucun état, aucun handler.
 */

import Link from 'next/link';
import { ReactNode } from 'react';
import { StatutAppareil } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import { RepartitionStatuts } from '@/lib/derived/explorer';

/** Du plus grave au plus normal — voir l'en-tête de fichier. */
export const ORDRE_STATUTS: StatutAppareil[] = [
  StatutAppareil.EN_PANNE,
  StatutAppareil.A_L_ARRET,
  StatutAppareil.MODE_DEGRADE,
  StatutAppareil.ARRET_TRAVAUX,
  StatutAppareil.EN_SERVICE,
];

/** Aplats de la barre — mêmes teintes que les pastilles de components/Liens.tsx. */
const REMPLISSAGE: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_PANNE]: 'bg-rose-500',
  [StatutAppareil.A_L_ARRET]: 'bg-orange-500',
  [StatutAppareil.MODE_DEGRADE]: 'bg-amber-400',
  [StatutAppareil.ARRET_TRAVAUX]: 'bg-slate-400',
  [StatutAppareil.EN_SERVICE]: 'bg-emerald-500',
};

/** Couleur du compteur chiffré associé. */
const TEXTE: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_PANNE]: 'text-rose-700',
  [StatutAppareil.A_L_ARRET]: 'text-orange-700',
  [StatutAppareil.MODE_DEGRADE]: 'text-amber-700',
  [StatutAppareil.ARRET_TRAVAUX]: 'text-slate-600',
  [StatutAppareil.EN_SERVICE]: 'text-emerald-700',
};

export function nombre(valeur: number): string {
  return valeur.toLocaleString('fr-FR');
}

/** « appareil » / « appareils » — accord systématique des libellés chiffrés. */
export function pluriel(valeur: number, singulier: string, pluriel_ = `${singulier}s`): string {
  return valeur > 1 ? pluriel_ : singulier;
}

/**
 * Additionne plusieurs répartitions (les 7 axes couvrent le même parc, mais
 * un total agrégé doit recalculer sa disponibilité, pas moyenner des pourcents).
 */
export function cumulerRepartitions(repartitions: RepartitionStatuts[]): RepartitionStatuts {
  const parStatut = {
    [StatutAppareil.EN_SERVICE]: 0,
    [StatutAppareil.EN_PANNE]: 0,
    [StatutAppareil.A_L_ARRET]: 0,
    [StatutAppareil.MODE_DEGRADE]: 0,
    [StatutAppareil.ARRET_TRAVAUX]: 0,
  };
  let total = 0;
  for (const repartition of repartitions) {
    total += repartition.total;
    for (const statut of ORDRE_STATUTS) parStatut[statut] += repartition.parStatut[statut];
  }
  return {
    total,
    parStatut,
    problemes: parStatut[StatutAppareil.EN_PANNE] + parStatut[StatutAppareil.A_L_ARRET],
    disponibilitePourcent: total === 0 ? 0 : Math.round((parStatut[StatutAppareil.EN_SERVICE] / total) * 100),
  };
}

// ---------------------------------------------------------------------------
// Barre proportionnelle
// ---------------------------------------------------------------------------

/**
 * Les segments non vides reçoivent une largeur plancher : sans elle, une panne
 * isolée sur un site de 200 appareils occuperait un demi-pixel et disparaîtrait
 * — or c'est précisément la ligne que l'écran doit faire remarquer.
 */
export function BarreRepartition({
  repartition,
  hauteur = 'h-2',
  className = '',
}: {
  repartition: RepartitionStatuts;
  hauteur?: string;
  className?: string;
}) {
  const { total, parStatut } = repartition;
  const segments = ORDRE_STATUTS.filter((statut) => parStatut[statut] > 0);
  const legende = segments
    .map((statut) => `${LIBELLE_STATUT_APPAREIL[statut]} : ${nombre(parStatut[statut])}`)
    .join(' · ');

  if (total === 0) {
    return <div className={`${hauteur} w-full rounded-full bg-gray-100 ${className}`} />;
  }

  return (
    <div
      className={`flex ${hauteur} w-full overflow-hidden rounded-full bg-gray-100 ${className}`}
      role="img"
      aria-label={legende}
      title={legende}
    >
      {segments.map((statut) => (
        <div
          key={statut}
          className={REMPLISSAGE[statut]}
          style={{ width: `${(parStatut[statut] / total) * 100}%`, minWidth: '3px' }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compteurs
// ---------------------------------------------------------------------------

/**
 * Compteurs chiffrés sous la barre. Les statuts absents sont omis : sur une
 * grille de 50 cartes, afficher quatre zéros par carte noie les trois chiffres
 * qui comptent.
 *
 * `lienStatut` rend chaque compteur cliquable lorsque l'écran sait où mener —
 * palier 2 filtré sur ce statut. Sans lui, les compteurs restent du texte.
 */
export function CompteursStatuts({
  repartition,
  lienStatut,
  taille = 'text-xs',
}: {
  repartition: RepartitionStatuts;
  lienStatut?: (statut: StatutAppareil) => string;
  taille?: string;
}) {
  const presents = ORDRE_STATUTS.filter((statut) => repartition.parStatut[statut] > 0);
  if (presents.length === 0) {
    return <p className={`${taille} text-gray-400`}>Aucun appareil</p>;
  }

  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${taille}`}>
      {presents.map((statut) => {
        const contenu: ReactNode = (
          <>
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${REMPLISSAGE[statut]}`} aria-hidden />
            <span className={`font-semibold tabular-nums ${TEXTE[statut]}`}>{nombre(repartition.parStatut[statut])}</span>
            <span className="text-gray-500">{LIBELLE_STATUT_APPAREIL[statut]}</span>
          </>
        );
        return (
          <li key={statut}>
            {lienStatut ? (
              <Link
                href={lienStatut(statut)}
                className="inline-flex items-center gap-1.5 rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {contenu}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5">{contenu}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Chiffre mis en avant
// ---------------------------------------------------------------------------

/** Cellule chiffrée d'un bandeau de synthèse (total, problèmes, disponibilité). */
export function ChiffreCle({
  valeur,
  libelle,
  ton = 'neutre',
}: {
  valeur: string;
  libelle: string;
  ton?: 'neutre' | 'alerte' | 'bon';
}) {
  const couleur = ton === 'alerte' ? 'text-rose-600' : ton === 'bon' ? 'text-emerald-600' : 'text-gray-900';
  return (
    <div>
      <p className={`text-2xl font-semibold tabular-nums leading-none ${couleur}`}>{valeur}</p>
      <p className="mt-1 text-xs text-gray-500">{libelle}</p>
    </div>
  );
}
