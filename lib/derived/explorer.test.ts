/**
 * Garde-fou de la grammaire d'exploration.
 *
 * Ce qui est vérifié ici, c'est la mécanique qui fait tenir tout le parcours :
 * les critères voyagent dans l'URL sans se perdre, se retirent un par un, et
 * la répartition d'états compte juste. Une régression sur l'un de ces points
 * casse silencieusement la descente « du général au nucléaire » sur les sept
 * dimensions à la fois.
 *
 * Les fonctions d'agrégation mémoïsées (`listerGroupes`…) ne sont pas
 * couvertes ici : `cache()` de React exige un contexte de rendu et lève hors
 * de React. Elles sont vérifiées par le parcours HTTP de bout en bout.
 */

import { describe, it, expect } from 'vitest';
import { StatutAppareil } from '@/domain/types';
import {
  calculerRepartition,
  estStatutProbleme,
  lienAppareil,
  lienDimension,
  lienGroupe,
  lireFiltres,
  listerCriteresActifs,
  serialiserFiltres,
  DIMENSIONS,
  estDimension,
  type FiltresExploration,
} from './explorer';
import { LIBELLE_STATUT_APPAREIL } from './libelles-parc';

const appareil = (statut: StatutAppareil) => ({ statutAppareil: statut }) as never;

describe('répartition des états', () => {
  it('compte « pose problème » comme en panne + à l’arrêt, sans le mode dégradé', () => {
    const r = calculerRepartition([
      appareil(StatutAppareil.EN_SERVICE),
      appareil(StatutAppareil.EN_PANNE),
      appareil(StatutAppareil.A_L_ARRET),
      appareil(StatutAppareil.MODE_DEGRADE),
      appareil(StatutAppareil.ARRET_TRAVAUX),
    ]);

    expect(r.total).toBe(5);
    expect(r.problemes).toBe(2);
    expect(r.parStatut[StatutAppareil.MODE_DEGRADE]).toBe(1);
    expect(r.disponibilitePourcent).toBe(20);
  });

  it('ne divise pas par zéro sur un groupe vide', () => {
    const r = calculerRepartition([]);
    expect(r.total).toBe(0);
    expect(r.disponibilitePourcent).toBe(0);
    expect(r.problemes).toBe(0);
  });

  it('classe chaque statut du domaine comme problématique ou non', () => {
    expect(estStatutProbleme(StatutAppareil.EN_PANNE)).toBe(true);
    expect(estStatutProbleme(StatutAppareil.A_L_ARRET)).toBe(true);
    expect(estStatutProbleme(StatutAppareil.EN_SERVICE)).toBe(false);
    expect(estStatutProbleme(StatutAppareil.MODE_DEGRADE)).toBe(false);
  });
});

describe('propagation des critères dans l’URL', () => {
  it('fait un aller-retour sans rien perdre', () => {
    const filtres: FiltresExploration = {
      statut: StatutAppareil.EN_PANNE,
      probleme: true,
      modeDegrade: true,
      recherche: 'confluence',
    };
    const params = Object.fromEntries(new URLSearchParams(serialiserFiltres(filtres).slice(1)));
    expect(lireFiltres(params)).toEqual(filtres);
  });

  it('ne sérialise rien quand aucun critère n’est actif', () => {
    expect(serialiserFiltres({})).toBe('');
  });

  it('ignore un statut inconnu au lieu de le propager', () => {
    expect(lireFiltres({ statut: 'en_vacances' }).statut).toBeUndefined();
  });

  it('accepte les paramètres répétés que produit une URL', () => {
    expect(lireFiltres({ statut: [StatutAppareil.EN_PANNE, StatutAppareil.EN_SERVICE] }).statut).toBe(
      StatutAppareil.EN_PANNE,
    );
  });
});

describe('retrait d’un critère', () => {
  const libelle = (s: StatutAppareil) => LIBELLE_STATUT_APPAREIL[s];

  it('conserve les autres critères quand on en retire un', () => {
    const filtres: FiltresExploration = { statut: StatutAppareil.EN_PANNE, recherche: 'lyon' };
    const criteres = listerCriteresActifs(filtres, libelle);

    const statut = criteres.find((c) => c.cle === 'statut');
    expect(statut?.libelle).toBe('En panne');
    expect(statut?.sansCeCritere.statut).toBeUndefined();
    expect(statut?.sansCeCritere.recherche).toBe('lyon');
  });

  it('ne liste aucun critère quand le parcours est vierge', () => {
    expect(listerCriteresActifs({}, libelle)).toEqual([]);
  });
});

describe('construction des liens', () => {
  it('produit les trois paliers de la descente', () => {
    expect(lienDimension('parc', { statut: StatutAppareil.EN_PANNE })).toBe('/explorer/parc?statut=en_panne');
    expect(lienGroupe('technicien', 'tech-027')).toBe('/explorer/technicien/tech-027');
    expect(lienAppareil('asc-0042')).toBe('/appareils/asc-0042');
  });

  it('échappe les valeurs de groupe qui ne sont pas des identifiants', () => {
    // La dimension « ville » a le nom pour clé : il peut contenir espaces et accents.
    expect(lienGroupe('ville', 'Saint-Étienne')).toBe('/explorer/ville/Saint-%C3%89tienne');
  });
});

describe('dimensions', () => {
  it('reconnaît les sept axes de décomposition et rejette le reste', () => {
    expect(DIMENSIONS).toHaveLength(7);
    for (const dimension of DIMENSIONS) expect(estDimension(dimension)).toBe(true);
    expect(estDimension('appareil')).toBe(false);
  });
});
