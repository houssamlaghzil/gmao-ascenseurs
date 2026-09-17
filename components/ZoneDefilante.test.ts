/**
 * Garde-fou du fondu en pointillé.
 *
 * Tout l'effet repose sur une seule question, reposée à chaque frame : de quel
 * côté reste-t-il du contenu caché ? `calculerDebordement` y répond à partir
 * des trois mesures de défilement, sans toucher au DOM — c'est donc testable
 * tel quel en environnement node.
 *
 * Les cas couverts ici sont ceux qui se voient à l'œil nu quand ils cassent :
 * un fondu allumé en permanence sur un écran qui ne défile pas, ou un fondu
 * qui clignote pendant le rebond élastique d'iOS.
 */

import { describe, it, expect } from 'vitest';
import { calculerDebordement, TOLERANCE_DEFILEMENT } from './ZoneDefilante';

describe('calculerDebordement', () => {
  it('n’allume aucun fondu quand le contenu tient dans la zone', () => {
    expect(calculerDebordement({ scrollLeft: 0, scrollWidth: 800, clientWidth: 800 })).toEqual({
      peutDefilerGauche: false,
      peutDefilerDroite: false,
    });
  });

  it('ignore un débordement d’un pixel, dû à l’arrondi de la mise en page', () => {
    // Sans la tolérance, ce cas très fréquent laisserait un fondu droit allumé
    // en permanence sur un tableau qui, visuellement, ne défile pas.
    expect(calculerDebordement({ scrollLeft: 0, scrollWidth: 801, clientWidth: 800 })).toEqual({
      peutDefilerGauche: false,
      peutDefilerDroite: false,
    });
  });

  it('n’annonce que la droite au chargement d’un contenu plus large', () => {
    expect(calculerDebordement({ scrollLeft: 0, scrollWidth: 1600, clientWidth: 800 })).toEqual({
      peutDefilerGauche: false,
      peutDefilerDroite: true,
    });
  });

  it('annonce les deux côtés au milieu du parcours', () => {
    expect(calculerDebordement({ scrollLeft: 400, scrollWidth: 1600, clientWidth: 800 })).toEqual({
      peutDefilerGauche: true,
      peutDefilerDroite: true,
    });
  });

  it('bascule sur la gauche seule une fois la butée droite atteinte', () => {
    expect(calculerDebordement({ scrollLeft: 800, scrollWidth: 1600, clientWidth: 800 })).toEqual({
      peutDefilerGauche: true,
      peutDefilerDroite: false,
    });
  });

  it('considère la butée droite atteinte au pixel près', () => {
    // Le défilement par inertie s'arrête couramment à une fraction de pixel de
    // la fin ; le fondu droit doit s'éteindre quand même.
    expect(calculerDebordement({ scrollLeft: 799.4, scrollWidth: 1600, clientWidth: 800 })).toEqual({
      peutDefilerGauche: true,
      peutDefilerDroite: false,
    });
  });

  it('traite un rebond élastique vers la gauche comme le début du parcours', () => {
    // iOS autorise un `scrollLeft` négatif pendant le rebond : sans bornage, la
    // comparaison resterait juste ici mais deviendrait fausse côté droit.
    expect(calculerDebordement({ scrollLeft: -60, scrollWidth: 1600, clientWidth: 800 })).toEqual({
      peutDefilerGauche: false,
      peutDefilerDroite: true,
    });
  });

  it('traite un rebond élastique vers la droite comme la fin du parcours', () => {
    expect(calculerDebordement({ scrollLeft: 860, scrollWidth: 1600, clientWidth: 800 })).toEqual({
      peutDefilerGauche: true,
      peutDefilerDroite: false,
    });
  });

  it('accepte une tolérance plus large', () => {
    const mesures = { scrollLeft: 8, scrollWidth: 1600, clientWidth: 800 };

    expect(calculerDebordement(mesures).peutDefilerGauche).toBe(true);
    expect(calculerDebordement(mesures, 16).peutDefilerGauche).toBe(false);
  });

  it('reste muet devant des mesures inexploitables', () => {
    // Avant la première mise en page, une zone peut annoncer 0 partout.
    expect(calculerDebordement({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 })).toEqual({
      peutDefilerGauche: false,
      peutDefilerDroite: false,
    });
    expect(calculerDebordement({ scrollLeft: 0, scrollWidth: NaN, clientWidth: 800 })).toEqual({
      peutDefilerGauche: false,
      peutDefilerDroite: false,
    });
  });

  it('garde une tolérance par défaut d’un pixel', () => {
    expect(TOLERANCE_DEFILEMENT).toBe(1);
  });
});
