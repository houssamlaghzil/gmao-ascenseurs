/**
 * Conformité contractuelle — vérification du calcul du déficit.
 *
 * Ce calcul chiffre une pénalité contractuelle : il est vérifié sur des cas
 * construits à la main, indépendants du jeu de données de démo. Le cas
 * central est littéralement celui décrit par le client : un contrat mensuel
 * dont le calendrier annuel ne porte que 11 dates au lieu de 12.
 */

import { describe, it, expect, vi } from 'vitest';

/**
 * `cache()` n'est exporté par React que sous la condition d'export
 * `react-server` (contexte Server Components) : en environnement node, il est
 * `undefined` et le seul import du module sous test échouerait. Il est ici
 * remplacé par l'identité — les fonctions vérifiées plus bas sont pures et
 * n'ont de toute façon pas besoin de mémoïsation.
 */
vi.mock('react', async (importOriginal) => {
  const reactReel = await importOriginal<Record<string, unknown>>();
  return { ...reactReel, cache: <T>(fn: T): T => fn };
});

import {
  additionnerCompteurs,
  calculerConformiteAppareil,
  compteursVides,
  construireCompteurs,
  lireAnnee,
  quotaAnnuelDu,
  tauxConformitePourcent,
  QUOTA_ANNUEL_CABLE,
  QUOTA_ANNUEL_PARACHUTE,
  type CompteursCategorie,
} from './conformite-contractuelle';
import {
  Ascenseur,
  CategorieMaintenance,
  Contrat,
  DetenteurCles,
  FrequenceMaintenance,
  Maintenance,
  NiveauSla,
  StatutAppareil,
  StatutContrat,
  StatutMaintenance,
  StatutTelealarme,
} from '@/domain/types';

const ANNEE = 2026;
/** Date de référence figée : 8 mois écoulés, 4 restants. */
const MAINTENANT = new Date('2026-09-17T12:00:00.000Z');

const ascenseurTest: Ascenseur = {
  id: 'asc-conf-1',
  code: 'CONF-A1',
  parcId: 'parc-conf',
  clientId: 'cli-conf',
  contratId: 'ctr-conf',
  adresseComplete: '1 rue du Quota',
  ville: 'Lyon',
  statutAppareil: StatutAppareil.EN_SERVICE,
  ficheTechnique: {
    marque: 'Otis',
    modele: 'Gen2',
    dateInstallation: '2015-01-01',
    chargeUtileKg: 630,
    vitesseMs: 1.6,
    nombreNiveaux: 6,
    niveauxDesservis: [],
    telealarme: { present: true, statutFonctionnel: StatutTelealarme.NON_TESTEE },
    gestionCles: { detenteur: DetenteurCles.GARDIEN },
    accesLocalTechnique: { localisation: 'Local machinerie' },
  },
  dateCreationFiche: '2015-01-01',
};

function contratTest(surcharge: Partial<Contrat> = {}): Contrat {
  return {
    id: 'ctr-conf',
    numero: 'CTR-2024-0001',
    clientId: 'cli-conf',
    parcIds: ['parc-conf'],
    nombreAppareilsCouverts: 1,
    dateDebut: '2024-01-01T00:00:00.000Z',
    dateFin: '2028-01-01T00:00:00.000Z',
    frequenceMaintenance: FrequenceMaintenance.MENSUELLE,
    maintenanceCableIncluse: true,
    maintenanceParachuteIncluse: true,
    maintenanceNettoyageIncluse: true,
    niveauSla: NiveauSla.STANDARD,
    seuils: { dureeMinimaleInterventionMinutes: 20, tempsMinimumPresenceMaintenanceMinutes: 30 },
    responsablesClientIds: [],
    statut: StatutContrat.ACTIF,
    ...surcharge,
  };
}

let sequence = 0;

/** Une occurrence du calendrier : mois (1-12), catégories combinées, statut. */
function maintenance(
  mois: number,
  categories: CategorieMaintenance[],
  statut: StatutMaintenance,
  annee: number = ANNEE,
): Maintenance {
  sequence += 1;
  const datePrevue = `${annee}-${String(mois).padStart(2, '0')}-10T08:00:00.000Z`;
  return {
    id: `mnt-conf-${sequence}`,
    numero: `MNT-${annee}-${String(sequence).padStart(6, '0')}`,
    ascenseurId: ascenseurTest.id,
    contratId: 'ctr-conf',
    categories,
    datePrevue,
    dateRealisee: statut === StatutMaintenance.REALISEE ? datePrevue : undefined,
    statut,
    seuilDureeMinimaleMinutes: 30,
    avertissementDureeInsuffisante: false,
  };
}

/** Compteurs d'une catégorie donnée dans le bilan d'un appareil. */
function categorie(parCategorie: CompteursCategorie[], cible: CategorieMaintenance): CompteursCategorie {
  const trouve = parCategorie.find((c) => c.categorie === cible);
  if (!trouve) throw new Error(`Catégorie ${cible} absente du bilan`);
  return trouve;
}

describe('quotaAnnuelDu', () => {
  it('lit la cadence périodique sur le contrat', () => {
    expect(quotaAnnuelDu(contratTest(), CategorieMaintenance.PERIODIQUE, 0)).toBe(12);
    expect(
      quotaAnnuelDu(contratTest({ frequenceMaintenance: FrequenceMaintenance.BIMESTRIELLE }), CategorieMaintenance.PERIODIQUE, 0),
    ).toBe(6);
    expect(
      quotaAnnuelDu(contratTest({ frequenceMaintenance: FrequenceMaintenance.ANNUELLE }), CategorieMaintenance.PERIODIQUE, 0),
    ).toBe(1);
  });

  it('applique les cadences métier au câble et au parachute, et zéro hors contrat', () => {
    expect(quotaAnnuelDu(contratTest(), CategorieMaintenance.CABLE, 0)).toBe(QUOTA_ANNUEL_CABLE);
    expect(quotaAnnuelDu(contratTest(), CategorieMaintenance.PARACHUTE, 0)).toBe(QUOTA_ANNUEL_PARACHUTE);
    expect(quotaAnnuelDu(contratTest({ maintenanceCableIncluse: false }), CategorieMaintenance.CABLE, 5)).toBe(0);
    expect(quotaAnnuelDu(contratTest({ maintenanceParachuteIncluse: false }), CategorieMaintenance.PARACHUTE, 5)).toBe(0);
  });

  it('retombe sur le calendrier pour le nettoyage, l\'autre, et l\'appareil sans contrat', () => {
    expect(quotaAnnuelDu(contratTest(), CategorieMaintenance.NETTOYAGE, 4)).toBe(4);
    expect(quotaAnnuelDu(contratTest(), CategorieMaintenance.AUTRE, 1)).toBe(1);
    expect(quotaAnnuelDu(undefined, CategorieMaintenance.PERIODIQUE, 7)).toBe(7);
  });
});

describe('déficit prévisible — le « 11 au lieu de 12 »', () => {
  it('détecte la date jamais inscrite au calendrier annuel', () => {
    // Contrat mensuel = 12 visites dues. Le calendrier n'en porte que 11 :
    // 8 déjà réalisées (janvier à août), 3 encore planifiées (oct. à déc.).
    // Septembre n'a jamais été posé — la 12e visite n'existe nulle part.
    const calendrier = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((mois) =>
        maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE),
      ),
      ...[10, 11, 12].map((mois) => maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE)),
    ];

    const bilan = calculerConformiteAppareil(ascenseurTest, contratTest(), calendrier, ANNEE, MAINTENANT);
    const periodique = categorie(bilan.parCategorie, CategorieMaintenance.PERIODIQUE);

    expect(periodique.dues).toBe(12);
    expect(periodique.realisees).toBe(8);
    expect(periodique.planifieesRestantes).toBe(3);
    expect(periodique.inscritesAuCalendrier).toBe(11);
    expect(periodique.deficit).toBe(1);
    // La cause est le calendrier, pas l'exécution : rien n'a été annulé.
    expect(periodique.deficitCalendrier).toBe(1);
    expect(periodique.deficitExecution).toBe(0);
    expect(tauxConformitePourcent(periodique)).toBe(92);
  });

  it('ne compte aucun déficit quand les 12 dates sont au calendrier', () => {
    const calendrier = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((mois) =>
        maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE),
      ),
      ...[9, 10, 11, 12].map((mois) => maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE)),
    ];

    const periodique = categorie(
      calculerConformiteAppareil(ascenseurTest, contratTest(), calendrier, ANNEE, MAINTENANT).parCategorie,
      CategorieMaintenance.PERIODIQUE,
    );

    expect(periodique.dues).toBe(12);
    expect(periodique.deficit).toBe(0);
    expect(tauxConformitePourcent(periodique)).toBe(100);
  });

  it('impute à l\'exécution une occurrence inscrite puis annulée', () => {
    const calendrier = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((mois) =>
        maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE),
      ),
      maintenance(9, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.ANNULEE),
      ...[10, 11, 12].map((mois) => maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE)),
    ];

    const periodique = categorie(
      calculerConformiteAppareil(ascenseurTest, contratTest(), calendrier, ANNEE, MAINTENANT).parCategorie,
      CategorieMaintenance.PERIODIQUE,
    );

    expect(periodique.inscritesAuCalendrier).toBe(12);
    expect(periodique.annulees).toBe(1);
    expect(periodique.deficit).toBe(1);
    expect(periodique.deficitCalendrier).toBe(0);
    expect(periodique.deficitExecution).toBe(1);
  });

  it('compte une visite en retard comme restante, tout en la signalant', () => {
    // La visite de juin n'est toujours pas faite à la mi-septembre : elle
    // reste honorable d'ici décembre, donc pas encore un déficit — mais elle
    // doit remonter comme risque.
    const calendrier = [
      ...[1, 2, 3, 4, 5].map((mois) => maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE)),
      maintenance(6, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE),
      ...[7, 8, 9].map((mois) => maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE)),
      ...[10, 11, 12].map((mois) => maintenance(mois, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE)),
    ];

    const periodique = categorie(
      calculerConformiteAppareil(ascenseurTest, contratTest(), calendrier, ANNEE, MAINTENANT).parCategorie,
      CategorieMaintenance.PERIODIQUE,
    );

    expect(periodique.inscritesAuCalendrier).toBe(12);
    expect(periodique.planifieesRestantes).toBe(4);
    expect(periodique.enRetard).toBe(1);
    expect(periodique.deficit).toBe(0);
  });

  it('ignore les occurrences des autres années', () => {
    const calendrier = [
      maintenance(12, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE, ANNEE - 1),
      maintenance(1, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE, ANNEE + 1),
      maintenance(3, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE),
    ];

    const periodique = categorie(
      calculerConformiteAppareil(
        ascenseurTest,
        contratTest({ frequenceMaintenance: FrequenceMaintenance.TRIMESTRIELLE }),
        calendrier,
        ANNEE,
        MAINTENANT,
      ).parCategorie,
      CategorieMaintenance.PERIODIQUE,
    );

    expect(periodique.dues).toBe(4);
    expect(periodique.inscritesAuCalendrier).toBe(1);
    expect(periodique.deficit).toBe(3);
  });
});

describe('catégories combinées et quotas annexes', () => {
  it('compte un passage combiné pour chacune de ses catégories', () => {
    const calendrier = [
      maintenance(5, [CategorieMaintenance.PERIODIQUE, CategorieMaintenance.CABLE], StatutMaintenance.REALISEE),
      maintenance(11, [CategorieMaintenance.PERIODIQUE, CategorieMaintenance.CABLE], StatutMaintenance.PLANIFIEE),
    ];

    const bilan = calculerConformiteAppareil(
      ascenseurTest,
      contratTest({ frequenceMaintenance: FrequenceMaintenance.SEMESTRIELLE }),
      calendrier,
      ANNEE,
      MAINTENANT,
    );

    const periodique = categorie(bilan.parCategorie, CategorieMaintenance.PERIODIQUE);
    const cable = categorie(bilan.parCategorie, CategorieMaintenance.CABLE);

    expect(periodique.dues).toBe(2);
    expect(periodique.deficit).toBe(0);
    expect(cable.dues).toBe(QUOTA_ANNUEL_CABLE);
    expect(cable.realisees).toBe(1);
    expect(cable.planifieesRestantes).toBe(1);
    expect(cable.deficit).toBe(0);
  });

  it('signale le parachute jamais inscrit au calendrier', () => {
    const bilan = calculerConformiteAppareil(ascenseurTest, contratTest(), [], ANNEE, MAINTENANT);
    const parachute = categorie(bilan.parCategorie, CategorieMaintenance.PARACHUTE);

    expect(parachute.dues).toBe(1);
    expect(parachute.inscritesAuCalendrier).toBe(0);
    expect(parachute.deficit).toBe(1);
    expect(parachute.deficitCalendrier).toBe(1);
  });

  it('ne déclare aucun déficit de nettoyage tant que rien n\'est annulé', () => {
    const calendrier = [
      maintenance(2, [CategorieMaintenance.NETTOYAGE], StatutMaintenance.REALISEE),
      maintenance(8, [CategorieMaintenance.NETTOYAGE], StatutMaintenance.REALISEE),
      maintenance(10, [CategorieMaintenance.NETTOYAGE], StatutMaintenance.PLANIFIEE),
    ];

    const nettoyage = categorie(
      calculerConformiteAppareil(ascenseurTest, contratTest(), calendrier, ANNEE, MAINTENANT).parCategorie,
      CategorieMaintenance.NETTOYAGE,
    );

    // Le quota est déduit du calendrier faute de cadence contractuelle typée.
    expect(nettoyage.dues).toBe(3);
    expect(nettoyage.deficit).toBe(0);

    const avecAnnulation = categorie(
      calculerConformiteAppareil(
        ascenseurTest,
        contratTest(),
        [...calendrier, maintenance(12, [CategorieMaintenance.NETTOYAGE], StatutMaintenance.ANNULEE)],
        ANNEE,
        MAINTENANT,
      ).parCategorie,
      CategorieMaintenance.NETTOYAGE,
    );

    expect(avecAnnulation.dues).toBe(4);
    expect(avecAnnulation.deficit).toBe(1);
    expect(avecAnnulation.deficitExecution).toBe(1);
  });

  it('n\'expose pas les catégories hors contrat et hors calendrier', () => {
    const bilan = calculerConformiteAppareil(
      ascenseurTest,
      contratTest({ maintenanceCableIncluse: false, maintenanceParachuteIncluse: false }),
      [maintenance(3, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE)],
      ANNEE,
      MAINTENANT,
    );

    expect(bilan.parCategorie.map((c) => c.categorie)).toEqual([CategorieMaintenance.PERIODIQUE]);
  });
});

describe('agrégation', () => {
  it('additionne le total d\'un appareil sur toutes ses catégories', () => {
    // 12 périodiques dues (aucune inscrite), 2 câbles dus, 1 parachute dû.
    const bilan = calculerConformiteAppareil(ascenseurTest, contratTest(), [], ANNEE, MAINTENANT);

    expect(bilan.total.dues).toBe(12 + QUOTA_ANNUEL_CABLE + QUOTA_ANNUEL_PARACHUTE);
    expect(bilan.total.deficit).toBe(15);
    expect(bilan.tauxConformitePourcent).toBe(0);
  });

  it('interdit à un appareil excédentaire de compenser un appareil déficitaire', () => {
    // Appareil A : 13 visites pour 12 dues (une visite de rattrapage).
    const excedentaire = calculerConformiteAppareil(
      ascenseurTest,
      contratTest({ maintenanceCableIncluse: false, maintenanceParachuteIncluse: false }),
      [
        ...Array.from({ length: 12 }, (_, i) =>
          maintenance(i + 1, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE),
        ),
        maintenance(12, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.PLANIFIEE),
      ],
      ANNEE,
      MAINTENANT,
    );

    // Appareil B : 11 visites pour 12 dues.
    const deficitaire = calculerConformiteAppareil(
      { ...ascenseurTest, id: 'asc-conf-2', code: 'CONF-A2' },
      contratTest({ maintenanceCableIncluse: false, maintenanceParachuteIncluse: false }),
      Array.from({ length: 11 }, (_, i) =>
        maintenance(i + 1, [CategorieMaintenance.PERIODIQUE], StatutMaintenance.REALISEE),
      ),
      ANNEE,
      MAINTENANT,
    );

    expect(excedentaire.total.deficit).toBe(0);
    expect(deficitaire.total.deficit).toBe(1);

    const contrat = compteursVides();
    additionnerCompteurs(contrat, excedentaire.total);
    additionnerCompteurs(contrat, deficitaire.total);

    expect(contrat.dues).toBe(24);
    expect(contrat.realisees + contrat.planifieesRestantes).toBe(24); // 13 + 11 : le compte y est « en moyenne »…
    expect(contrat.deficit).toBe(1); // … mais le déficit contractuel reste dû.
    expect(tauxConformitePourcent(contrat)).toBe(96);
  });
});

describe('construireCompteurs', () => {
  it('borne le déficit à zéro en cas d\'excédent', () => {
    const compteurs = construireCompteurs(4, { realisees: 5, planifieesRestantes: 1, enRetard: 0, annulees: 0 });
    expect(compteurs.deficit).toBe(0);
    expect(compteurs.deficitCalendrier).toBe(0);
    expect(compteurs.deficitExecution).toBe(0);
    expect(tauxConformitePourcent(compteurs)).toBe(100);
  });

  it('vaut 100 % quand rien n\'est dû', () => {
    expect(tauxConformitePourcent(compteursVides())).toBe(100);
  });
});

describe('lireAnnee', () => {
  it('accepte une année plausible et rejette le reste', () => {
    expect(lireAnnee('2025')).toBe(2025);
    expect(lireAnnee(['2024'])).toBe(2024);
    expect(lireAnnee('bidon')).toBe(new Date().getUTCFullYear());
    expect(lireAnnee(undefined)).toBe(new Date().getUTCFullYear());
    expect(lireAnnee('1789')).toBe(new Date().getUTCFullYear());
  });
});
