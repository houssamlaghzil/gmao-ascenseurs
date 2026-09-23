// lib/derived/maintenances-appareil.test.ts
import { describe, expect, it } from 'vitest';
import { CategorieMaintenance, StatutMaintenance, type Maintenance } from '@/domain/types';
import {
  estMaintenanceEnRetard,
  trouverDerniereMaintenanceRealisee,
  trouverProchaineMaintenancePlanifiee,
} from './maintenances-appareil';

function creerMaintenance(overrides: Partial<Maintenance> & Pick<Maintenance, 'id' | 'categories' | 'datePrevue' | 'statut'>): Maintenance {
  return {
    numero: 'MNT-2026-TEST',
    ascenseurId: 'asc-test',
    seuilDureeMinimaleMinutes: 15,
    avertissementDureeInsuffisante: false,
    ...overrides,
  };
}

describe('trouverProchaineMaintenancePlanifiee / trouverDerniereMaintenanceRealisee', () => {
  it(
    "ne recalcule jamais la date d'une maintenance encore planifiée à partir d'une autre catégorie déjà réalisée plus tard (règle capitale, domain/types.ts)",
    () => {
      const planifieeEnRetard = creerMaintenance({
        id: 'mnt-cable',
        categories: [CategorieMaintenance.CABLE],
        datePrevue: '2026-02-21T00:00:00.000Z',
        statut: StatutMaintenance.PLANIFIEE,
      });
      const realiseePlusTard = creerMaintenance({
        id: 'mnt-periodique',
        categories: [CategorieMaintenance.PERIODIQUE],
        datePrevue: '2026-02-01T00:00:00.000Z',
        dateRealisee: '2026-03-15T00:00:00.000Z',
        statut: StatutMaintenance.REALISEE,
      });

      const maintenances = [planifieeEnRetard, realiseePlusTard];
      const maintenant = new Date('2026-03-20T00:00:00.000Z');
      const prochaine = trouverProchaineMaintenancePlanifiee(maintenances, maintenant);
      const derniereRealisee = trouverDerniereMaintenanceRealisee(maintenances);

      // La maintenance "câble" reste la prochaine planifiée, avec sa date
      // d'origine inchangée, même si une autre catégorie a déjà été réalisée
      // après elle : ce test fige ce comportement voulu pour ne pas le
      // régresser en l'outillant par erreur (ex. un futur "recalcul de la
      // prochaine visite depuis la dernière réalisée" — précisément ce que le
      // commentaire "RÈGLE CAPITALE" de domain/types.ts interdit).
      expect(prochaine?.id).toBe('mnt-cable');
      expect(prochaine?.datePrevue).toBe('2026-02-21T00:00:00.000Z');
      expect(derniereRealisee?.id).toBe('mnt-periodique');
      expect(estMaintenanceEnRetard(planifieeEnRetard, maintenant)).toBe(true);
    }
  );
});
