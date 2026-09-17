/**
 * Garde-fou du calendrier mixte du tableau de bord (`getActiviteParJour`).
 *
 * Ce qui est vérifié ici tient à la lisibilité de la heatmap : une grille dont
 * les colonnes ne commencent pas un lundi, ou dont la dernière semaine est
 * tronquée, ment visuellement sans jamais lever d'erreur. Le prévisionnel est
 * couvert au même titre : y laisser passer une panne ou une maintenance déjà
 * réalisée afficherait de l'activité future imaginaire.
 *
 * Le magasin de données est simulé : la démo génère un jeu aléatoire à chaque
 * import, impossible d'en tirer des assertions stables.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CategorieMaintenance,
  Intervention,
  Maintenance,
  StatutMaintenance,
} from '@/domain/types';

const magasin = vi.hoisted(() => ({
  interventions: [] as Intervention[],
  maintenances: [] as Maintenance[],
}));

vi.mock('@/data/store', () => ({
  getAllInterventions: () => magasin.interventions,
  getAllMaintenances: () => magasin.maintenances,
  getAllAscenseurs: () => [],
  getAllIntegrationsExternes: () => [],
  getAllJournalEchangesIntegration: () => [],
  getAllEvenementsReserve: () => [],
  getAllTechniciens: () => [],
  getAllTickets: () => [],
  getAscenseurById: () => undefined,
  getEntreesJournalModificationByAscenseurId: () => [],
  getReserveCTQById: () => undefined,
  getRiskScoreForAscenseur: () => undefined,
  getTechnicienById: () => undefined,
}));

import { getActiviteParJour, getTopAscenseursRisque, type AscenseurAvecRisque, type JourActivite } from './dashboard';
import type { Ascenseur } from '@/domain/types';

/** Minuit local du jour courant — même référence que la fonction sous test. */
function aujourdhuiLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function decaler(jours: number): Date {
  const d = aujourdhuiLocal();
  d.setDate(d.getDate() + jours);
  return d;
}

/** Clé `yyyy-mm-dd` en heure locale (et non UTC comme `toISOString`). */
function cle(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
}

/**
 * Décalage de mois civils avec quantième borné : le 31 mai moins trois mois
 * vaut fin février, pas le 2 ou 3 mars (débordement naturel de `setMonth`).
 */
function decalerMoisBorne(deltaMois: number): Date {
  const depart = aujourdhuiLocal();
  const cible = new Date(depart.getFullYear(), depart.getMonth() + deltaMois, 1);
  const dernierJour = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  cible.setDate(Math.min(depart.getDate(), dernierJour));
  return cible;
}

const moisCivilsAvant = (n: number) => decalerMoisBorne(-n);
const moisCivilsApres = (n: number) => decalerMoisBorne(n);

function lireJourLocal(valeur: string): Date {
  const [annee, mois, jour] = valeur.split('-').map(Number);
  return new Date(annee, mois - 1, jour);
}

function maintenance(
  datePrevue: Date,
  statut: StatutMaintenance,
  options: { dateRealisee?: Date; categories?: CategorieMaintenance[] } = {},
): Maintenance {
  return {
    id: `m-${datePrevue.getTime()}-${statut}-${Math.random()}`,
    categories: options.categories ?? [CategorieMaintenance.PERIODIQUE],
    datePrevue: datePrevue.toISOString(),
    dateRealisee: options.dateRealisee?.toISOString(),
    statut,
  } as unknown as Maintenance;
}

function intervention(dateCreation: Date, ascenseurId = 'asc-heatmap'): Intervention {
  return { id: `i-${Math.random()}`, ascenseurId, dateCreation: dateCreation.toISOString() } as unknown as Intervention;
}

function jourDe(grille: JourActivite[], date: Date): JourActivite {
  const trouve = grille.find((j) => j.date === cle(date));
  if (!trouve) throw new Error(`jour absent de la grille : ${cle(date)}`);
  return trouve;
}

beforeEach(() => {
  magasin.interventions = [];
  magasin.maintenances = [];
});

describe('alignement du calendrier', () => {
  it('commence un lundi et finit un dimanche', () => {
    const grille = getActiviteParJour();
    expect(lireJourLocal(grille[0].date).getDay()).toBe(1);
    expect(lireJourLocal(grille[grille.length - 1].date).getDay()).toBe(0);
  });

  it('ne tronque aucune semaine : la longueur est un multiple de 7', () => {
    const grille = getActiviteParJour();
    expect(grille.length % 7).toBe(0);
  });

  it('place chaque case sur la bonne ligne de la semaine', () => {
    const grille = getActiviteParJour();
    // Ligne 0 = lundi, ligne 6 = dimanche : c'est exactement ce que l'ancienne
    // découpe « par paquets de 7 depuis le premier jour » ne garantissait pas.
    const lignes = [1, 2, 3, 4, 5, 6, 0]; // lundi -> dimanche, au format getDay()
    grille.forEach((jour, index) => {
      expect(lireJourLocal(jour.date).getDay()).toBe(lignes[index % 7]);
    });
  });

  it('enchaîne les jours sans trou ni doublon', () => {
    const grille = getActiviteParJour();
    const attendu = lireJourLocal(grille[0].date);
    for (const jour of grille) {
      expect(jour.date).toBe(cle(attendu));
      attendu.setDate(attendu.getDate() + 1);
    }
  });

  it('couvre bien trois mois écoulés et trois mois à venir', () => {
    const grille = getActiviteParJour();
    const dansLaPlage = grille.filter((j) => !j.horsPlage);

    expect(dansLaPlage[0].date).toBe(cle(moisCivilsAvant(3)));
    expect(dansLaPlage[dansLaPlage.length - 1].date).toBe(cle(moisCivilsApres(3)));
    // ~183 jours : deux fois trois mois civils autour d'aujourd'hui.
    expect(dansLaPlage.length).toBeGreaterThan(178);
    expect(dansLaPlage.length).toBeLessThan(188);
  });

  it("garde l'ancien argument sans effet (appelants existants non cassés)", () => {
    expect(getActiviteParJour(90)).toEqual(getActiviteParJour());
  });
});

describe('bornes de plage sur une date piégeuse', () => {
  afterEach(() => vi.useRealTimers());

  it('borne le quantième au lieu de déborder sur le mois suivant', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 31, 14, 30)); // dimanche 31 mai 2026
    const dansLaPlage = getActiviteParJour().filter((j) => !j.horsPlage);

    // 31 février n'existe pas : la borne tombe au 28 et non au 3 mars.
    expect(dansLaPlage[0].date).toBe('2026-02-28');
    expect(dansLaPlage[dansLaPlage.length - 1].date).toBe('2026-08-31');
  });

  it('reste aligné lundi/dimanche quelle que soit la date du jour', () => {
    vi.useFakeTimers();
    for (const jourDuMois of [1, 15, 28, 31]) {
      vi.setSystemTime(new Date(2026, 0, Math.min(jourDuMois, 31), 9, 0));
      const grille = getActiviteParJour();
      expect(lireJourLocal(grille[0].date).getDay()).toBe(1);
      expect(lireJourLocal(grille[grille.length - 1].date).getDay()).toBe(0);
      expect(grille.length % 7).toBe(0);
    }
  });
});

describe("repère d'aujourd'hui", () => {
  it("marque un et un seul jour comme « aujourd'hui », à la bonne date", () => {
    const grille = getActiviteParJour();
    const marques = grille.filter((j) => j.temporalite === 'aujourdhui');
    expect(marques).toHaveLength(1);
    expect(marques[0].date).toBe(cle(aujourdhuiLocal()));
    expect(marques[0].horsPlage).toBe(false);
  });

  it('range tout ce qui précède en passé et tout ce qui suit en futur', () => {
    const grille = getActiviteParJour();
    const index = grille.findIndex((j) => j.temporalite === 'aujourdhui');
    expect(grille.slice(0, index).every((j) => j.temporalite === 'passe')).toBe(true);
    expect(grille.slice(index + 1).every((j) => j.temporalite === 'futur')).toBe(true);
  });
});

describe('réalisé (passé et aujourd’hui)', () => {
  it('compte les interventions créées et les maintenances réalisées', () => {
    const hier = decaler(-1);
    magasin.interventions = [intervention(hier), intervention(hier)];
    magasin.maintenances = [maintenance(hier, StatutMaintenance.REALISEE, { dateRealisee: hier })];

    const jour = jourDe(getActiviteParJour(), hier);
    expect(jour.temporalite).toBe('passe');
    expect(jour.pannes).toBe(2);
    expect(jour.reparations).toBe(1);
    expect(jour.count).toBe(3);
    expect(jour.planifiees).toBe(0);
  });

  it("ne compte pas comme prévisionnel une maintenance en retard (prévue dans le passé)", () => {
    const ilYA10Jours = decaler(-10);
    magasin.maintenances = [maintenance(ilYA10Jours, StatutMaintenance.PLANIFIEE)];

    const jour = jourDe(getActiviteParJour(), ilYA10Jours);
    expect(jour.planifiees).toBe(0);
    expect(jour.count).toBe(0);
  });

  it("compte aujourd'hui comme du réalisé, pas comme du prévisionnel", () => {
    const aujourdhui = aujourdhuiLocal();
    magasin.interventions = [intervention(aujourdhui)];
    magasin.maintenances = [maintenance(aujourdhui, StatutMaintenance.PLANIFIEE)];

    const jour = jourDe(getActiviteParJour(), aujourdhui);
    expect(jour.temporalite).toBe('aujourdhui');
    expect(jour.pannes).toBe(1);
    expect(jour.count).toBe(1);
    expect(jour.planifiees).toBe(0);
  });
});

describe('prévisionnel (dès demain)', () => {
  it('ne compte que les maintenances prévues encore à faire', () => {
    const dans10Jours = decaler(10);
    magasin.maintenances = [
      maintenance(dans10Jours, StatutMaintenance.PLANIFIEE),
      maintenance(dans10Jours, StatutMaintenance.EN_COURS_DE_REALISATION),
      maintenance(dans10Jours, StatutMaintenance.REALISEE, { dateRealisee: dans10Jours }),
      maintenance(dans10Jours, StatutMaintenance.ANNULEE),
    ];

    const jour = jourDe(getActiviteParJour(), dans10Jours);
    expect(jour.temporalite).toBe('futur');
    expect(jour.planifiees).toBe(2);
    expect(jour.count).toBe(2);
    expect(jour.reparations).toBe(0);
  });

  it('ne prévoit jamais de panne : aucune intervention dans le futur', () => {
    const dans5Jours = decaler(5);
    magasin.interventions = [intervention(dans5Jours)];

    const jour = jourDe(getActiviteParJour(), dans5Jours);
    expect(jour.pannes).toBe(0);
    expect(jour.count).toBe(0);
  });

  it('remonte les catégories distinctes des maintenances prévues', () => {
    const dans3Jours = decaler(3);
    magasin.maintenances = [
      maintenance(dans3Jours, StatutMaintenance.PLANIFIEE, {
        categories: [CategorieMaintenance.CABLE, CategorieMaintenance.PERIODIQUE],
      }),
      maintenance(dans3Jours, StatutMaintenance.PLANIFIEE, {
        categories: [CategorieMaintenance.CABLE, CategorieMaintenance.PARACHUTE],
      }),
    ];

    const jour = jourDe(getActiviteParJour(), dans3Jours);
    expect(jour.planifiees).toBe(2);
    expect([...jour.categoriesPlanifiees].sort()).toEqual(
      [CategorieMaintenance.CABLE, CategorieMaintenance.PARACHUTE, CategorieMaintenance.PERIODIQUE].sort(),
    );
  });
});

describe('tendance 7 jours (getTopAscenseursRisque)', () => {
  function ascenseurAvecRisque(id: string): AscenseurAvecRisque {
    return {
      ascenseur: { id, code: id } as unknown as Ascenseur,
      risk: { score: 50, level: 'moyen', explication: '' } as never,
    };
  }

  it('attribue une intervention à son jour CIVIL LOCAL, pas à son jour UTC', () => {
    // Repère le bug historique : `toDayKey` passait par `.toISOString()` (UTC).
    // Sous un fuseau en avance sur UTC (Paris), une intervention créée tard le
    // soir local retombait sur le jour UTC précédent — un jour trop tôt.
    // 23h locales fixes, quel que soit le fuseau du poste qui exécute le test
    // (`getHours`/`setHours` restent locaux, contrairement à `toISOString`).
    const hierSoir = decaler(-1);
    hierSoir.setHours(23, 0, 0, 0);

    magasin.interventions = [intervention(hierSoir, 'asc-test')];

    const [top] = getTopAscenseursRisque([ascenseurAvecRisque('asc-test')]);
    // tendance7j[5] = hier (index 6 = aujourd'hui, 6 jours en arrière = index 0).
    expect(top.tendance7j[5]).toBe(1);
    expect(top.tendance7j[6]).toBe(0);
    expect(top.tendance7j.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('place chaque jour de la fenêtre à son propre index, sans décalage', () => {
    magasin.interventions = [intervention(decaler(-6), 'asc-test'), intervention(decaler(0), 'asc-test')];

    const [top] = getTopAscenseursRisque([ascenseurAvecRisque('asc-test')]);
    expect(top.tendance7j).toEqual([1, 0, 0, 0, 0, 0, 1]);
  });
});

describe('cases de complément de grille', () => {
  it('existent, restent neutres et ne comptent rien', () => {
    const grilleVide = getActiviteParJour();
    const complements = grilleVide.filter((j) => j.horsPlage);
    // Bornes de plage alignées pile sur un lundi/dimanche : aucun complément à
    // vérifier ce jour-là, le reste du test n'aurait pas de sujet.
    if (complements.length === 0) return;

    const jourComplement = lireJourLocal(complements[complements.length - 1].date);
    magasin.maintenances = [maintenance(jourComplement, StatutMaintenance.PLANIFIEE)];
    magasin.interventions = [intervention(jourComplement)];

    const jour = jourDe(getActiviteParJour(), jourComplement);
    expect(jour.horsPlage).toBe(true);
    expect(jour.count).toBe(0);
    expect(jour.planifiees).toBe(0);
    expect(jour.pannes).toBe(0);
  });
});
