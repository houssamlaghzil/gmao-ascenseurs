'use client';

/**
 * ZoneDefilante — conteneur à défilement horizontal sans barre visible.
 *
 * Le contenu qui dépasse n'est pas annoncé par une barre de défilement (elle
 * est masquée, et elle n'existe de toute façon pas au doigt) mais par un
 * « fondu en pointillé » : sur environ 5 % de la largeur, du côté où ça
 * déborde, le contenu se dissout dans une trame de points couleur du fond.
 * Le calque n'apparaît que du côté où il reste quelque chose à révéler : on
 * défile vers la droite, le pointillé de droite s'efface et celui de gauche
 * apparaît. Aux deux butées, le fondu correspondant disparaît.
 *
 * Le composant ne connaît rien de son contenu : tableau large, grille de
 * cartes, heatmap, tout passe.
 *
 * Exemple :
 *
 *   <ZoneDefilante className="rounded-lg" couleurFondu="#ffffff"
 *                  centrerSur='[data-scroll-cible="true"]'>
 *     <table className="min-w-[60rem]">…</table>
 *   </ZoneDefilante>
 *
 * La mécanique visuelle (trame + masque) est commentée dans
 * `ZoneDefilante.module.css` ; ce fichier ne porte que le pilotage.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import styles from './ZoneDefilante.module.css';

/* --------------------------------------------------------------------------
   La logique, isolée du DOM
   -------------------------------------------------------------------------- */

/** Les trois seules mesures dont dépend l'affichage des fondus. */
export interface MesuresDefilement {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export interface EtatDebordement {
  /** Du contenu est masqué à gauche : le fondu gauche doit être visible. */
  peutDefilerGauche: boolean;
  /** Du contenu est masqué à droite : le fondu droit doit être visible. */
  peutDefilerDroite: boolean;
}

/**
 * Marge d'erreur, en pixels, sous laquelle un débordement est considéré comme
 * inexistant. `scrollWidth` et `clientWidth` sont arrondis à l'entier alors que
 * la mise en page est sous-pixellaire : un conteneur qui tient exactement dans
 * sa largeur annonce régulièrement 1px de trop. Sans cette marge, un fondu
 * resterait allumé en permanence sur des écrans qui ne défilent pas.
 */
export const TOLERANCE_DEFILEMENT = 1;

/**
 * Déduit des mesures de défilement les deux côtés où du contenu reste caché.
 *
 * Fonction pure : elle accepte n'importe quel objet portant les trois mesures,
 * donc aussi bien un élément du DOM qu'un objet de test.
 */
export function calculerDebordement(
  mesures: MesuresDefilement,
  tolerance: number = TOLERANCE_DEFILEMENT,
): EtatDebordement {
  const { scrollLeft, scrollWidth, clientWidth } = mesures;
  const amplitude = scrollWidth - clientWidth;

  // Rien ne dépasse : aucun des deux fondus n'a lieu d'être.
  if (!Number.isFinite(amplitude) || amplitude <= tolerance) {
    return { peutDefilerGauche: false, peutDefilerDroite: false };
  }

  // Le rebond élastique (iOS) et la navigation par ancre poussent brièvement
  // `scrollLeft` hors de [0, amplitude] ; on le ramène dans ses bornes pour ne
  // pas faire clignoter les fondus pendant le rebond.
  const position = Math.min(Math.max(scrollLeft, 0), amplitude);

  return {
    peutDefilerGauche: position > tolerance,
    peutDefilerDroite: position < amplitude - tolerance,
  };
}

/* --------------------------------------------------------------------------
   Le composant
   -------------------------------------------------------------------------- */

export interface ZoneDefilanteProps {
  children: ReactNode;
  /**
   * Classes appliquées au cadre extérieur (arrondi, bordure, hauteur…).
   * Les marges intérieures sont à poser sur le contenu, pas ici : le cadre
   * sert de repère aux deux calques de fondu, qui s'alignent sur ses bords.
   */
  className?: string;
  /**
   * Couleur des points du fondu. Doit correspondre au fond du conteneur
   * parent, sinon la trame se voit au lieu de dissoudre le contenu.
   */
  couleurFondu?: string;
  /**
   * Sélecteur CSS d'un élément interne sur lequel centrer le défilement au
   * montage — par exemple la colonne du jour d'une heatmap :
   * `'[data-scroll-cible="true"]'`.
   */
  centrerSur?: string;
}

/**
 * `useLayoutEffect` positionne le défilement initial AVANT la peinture, sinon
 * la zone s'affiche une frame à l'origine puis saute. Il n'existe pas au rendu
 * serveur (React le signale bruyamment) : on retombe alors sur `useEffect`,
 * qui n'y sera de toute façon jamais exécuté.
 */
const useEffetAvantPeinture = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function ZoneDefilante({
  children,
  className = '',
  couleurFondu = '#ffffff',
  centrerSur,
}: ZoneDefilanteProps) {
  const refZone = useRef<HTMLDivElement>(null);
  const refFrame = useRef<number | null>(null);
  const [debordement, setDebordement] = useState<EtatDebordement>({
    peutDefilerGauche: false,
    peutDefilerDroite: false,
  });

  const mesurer = useCallback(() => {
    const zone = refZone.current;
    if (!zone) return;

    // Un élément du DOM porte déjà les trois mesures attendues.
    const suivant = calculerDebordement(zone);

    // On ne re-rend que si l'un des deux côtés a réellement basculé : pendant
    // un geste, l'immense majorité des frames ne change rien.
    setDebordement((precedent) =>
      precedent.peutDefilerGauche === suivant.peutDefilerGauche &&
      precedent.peutDefilerDroite === suivant.peutDefilerDroite
        ? precedent
        : suivant,
    );
  }, []);

  /**
   * `onScroll` tire plusieurs dizaines d'événements par geste, et lire
   * `scrollWidth`/`clientWidth` force le navigateur à recalculer la mise en
   * page. On n'autorise donc qu'une seule mesure par frame d'affichage.
   */
  const planifierMesure = useCallback(() => {
    if (refFrame.current !== null) return;
    refFrame.current = requestAnimationFrame(() => {
      refFrame.current = null;
      mesurer();
    });
  }, [mesurer]);

  useEffect(
    () => () => {
      if (refFrame.current !== null) cancelAnimationFrame(refFrame.current);
    },
    [],
  );

  // Centrage initial sur une cible interne, quand on en demande une.
  useEffetAvantPeinture(() => {
    const zone = refZone.current;
    if (!zone || !centrerSur) return;

    let cible: HTMLElement | null = null;
    try {
      cible = zone.querySelector<HTMLElement>(centrerSur);
    } catch {
      // Sélecteur invalide : on laisse la zone à son origine plutôt que de
      // faire tomber tout l'arbre de rendu.
      cible = null;
    }
    if (!cible) return;

    const cadreZone = zone.getBoundingClientRect();
    const cadreCible = cible.getBoundingClientRect();
    // On écrit `scrollLeft` plutôt que d'appeler `scrollIntoView` : ce dernier
    // fait aussi défiler tous les ancêtres, donc la page elle-même, ce qui
    // déplacerait l'écran au chargement. Le navigateur borne la valeur seul.
    zone.scrollLeft +=
      cadreCible.left - cadreZone.left - (cadreZone.width - cadreCible.width) / 2;

    mesurer();
  }, [centrerSur, mesurer]);

  // Redimensionnement de la fenêtre ou du bloc parent : la zone change de
  // largeur sans qu'aucun rendu React n'ait lieu. Un contenu qui débordait
  // peut se mettre à tenir, et inversement.
  useEffect(() => {
    const zone = refZone.current;
    if (!zone || typeof ResizeObserver === 'undefined') return;

    const observateur = new ResizeObserver(planifierMesure);
    observateur.observe(zone);
    return () => observateur.disconnect();
  }, [planifierMesure]);

  // Volontairement sans tableau de dépendances : le contenu peut changer de
  // largeur sans que la zone, elle, change de taille (une colonne ajoutée à un
  // tableau, un filtre qui retire des cartes). Le ResizeObserver posé sur la
  // zone ne voit rien dans ce cas, alors qu'un rendu a bien eu lieu. La mesure
  // est coalescée par frame et ne re-rend que si un booléen bascule.
  useEffect(planifierMesure);

  const { peutDefilerGauche, peutDefilerDroite } = debordement;
  const deborde = peutDefilerGauche || peutDefilerDroite;

  return (
    <div
      className={`${styles.racine} ${className}`.trim()}
      // La couleur voyage en variable CSS : la feuille de style reste statique
      // et les deux calques la lisent sans que le composant connaisse leur
      // sélecteur.
      style={{ '--zone-defilante-point': couleurFondu } as CSSProperties}
    >
      <div
        ref={refZone}
        className={styles.zone}
        onScroll={planifierMesure}
        // Rendre la zone focalisable, mais seulement quand elle déborde : sans
        // cela, un contenu non focalisable (une heatmap de <div>) serait
        // inatteignable au clavier, et avec, on ajouterait un arrêt de
        // tabulation inutile sur les zones qui tiennent dans leur largeur.
        tabIndex={deborde ? 0 : undefined}
      >
        {children}
      </div>

      {/* Décoratifs : ils n'annoncent rien à un lecteur d'écran, qui parcourt
          le contenu entier sans se soucier de ce qui est à l'écran. */}
      <div
        className={`${styles.fondu} ${styles.fonduGauche}`}
        data-visible={peutDefilerGauche}
        aria-hidden="true"
      />
      <div
        className={`${styles.fondu} ${styles.fonduDroite}`}
        data-visible={peutDefilerDroite}
        aria-hidden="true"
      />
    </div>
  );
}
