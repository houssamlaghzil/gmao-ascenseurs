import { describe, expect, it } from 'vitest';
import { construireIndexes, type DonneesSources } from './indexes';
import { TypeCiblePlanning, type Contrat, type Reaffectation, type ReserveCTQ } from '@/domain/types';

/** Jeu de données minimal : tous les tableaux vides sauf ceux que le test peuple explicitement. */
function donneesVides(): DonneesSources {
  return {
    secteursGeographiques: [],
    techniciens: [],
    tournees: [],
    clients: [],
    contrats: [],
    parcs: [],
    ascenseurs: [],
    entreesJournalModification: [],
    interventions: [],
    tickets: [],
    reaffectations: [],
    rapports: [],
    photosRapport: [],
    maintenances: [],
    typesMaintenanceRef: [],
    absencesTechnicien: [],
    bureauxEtudes: [],
    controlesCTQ: [],
    reservesCTQ: [],
    evenementsReserve: [],
    utilisateurs: [],
    integrationsExternes: [],
    journalEchangesIntegration: [],
    sessionsTechnicien: [],
    elementsFileSynchronisation: [],
    appareilsTelechargesLocalement: [],
    etatsPTITechnicien: [],
    positionsTechnicien: [],
    zonesGeographiques: [],
    tourneesDuJour: [],
    tachesAsynchrones: [],
    notifications: [],
    entreesAudit: [],
  };
}

describe('construireIndexes', () => {
  it('indexe un ascenseur par id, code et chaque clé étrangère', () => {
    const donnees = donneesVides();
    donnees.ascenseurs = [
      {
        id: 'asc-1',
        code: 'A-001',
        parcId: 'parc-1',
        clientId: 'client-1',
        contratId: 'contrat-1',
        technicienAffecteId: 'tech-1',
        tourneeId: 'tournee-1',
      } as unknown as DonneesSources['ascenseurs'][number],
    ];
    const index = construireIndexes(donnees);

    expect(index.ascenseurs.byId.get('asc-1')?.code).toBe('A-001');
    expect(index.ascenseurs.byCode.get('A-001')?.id).toBe('asc-1');
    expect(index.ascenseurs.byParcId.get('parc-1')).toHaveLength(1);
    expect(index.ascenseurs.byClientId.get('client-1')).toHaveLength(1);
    expect(index.ascenseurs.byContratId.get('contrat-1')).toHaveLength(1);
    expect(index.ascenseurs.byTechnicienId.get('tech-1')).toHaveLength(1);
    expect(index.ascenseurs.byTourneeId.get('tournee-1')).toHaveLength(1);
  });

  it("exclut un contratId vide du regroupement plutôt que de créer un groupe ''", () => {
    const donnees = donneesVides();
    donnees.ascenseurs = [
      { id: 'asc-1', code: 'A-001', parcId: 'p1', clientId: 'c1', contratId: '', tourneeId: 't1' } as unknown as DonneesSources['ascenseurs'][number],
    ];
    const index = construireIndexes(donnees);
    expect(index.ascenseurs.byContratId.has('')).toBe(false);
  });

  it('regroupe un contrat sous CHACUN des parcs de son tableau parcIds (relation n-n)', () => {
    const donnees = donneesVides();
    const contrat: Contrat = {
      id: 'contrat-1',
      clientId: 'client-1',
      parcIds: ['parc-1', 'parc-2'],
    } as unknown as Contrat;
    donnees.contrats = [contrat];
    const index = construireIndexes(donnees);

    expect(index.contrats.byParcId.get('parc-1')?.[0].id).toBe('contrat-1');
    expect(index.contrats.byParcId.get('parc-2')?.[0].id).toBe('contrat-1');
    expect(index.contrats.byClientId.get('client-1')).toHaveLength(1);
  });

  it('distingue deux réaffectations par la clé composite (cibleType, cibleId)', () => {
    const donnees = donneesVides();
    const versMaintenance: Reaffectation = {
      id: 'r1',
      cibleType: TypeCiblePlanning.MAINTENANCE,
      cibleId: 'x1',
      dateHeure: '2026-01-01T00:00:00.000Z',
    } as unknown as Reaffectation;
    const versIntervention: Reaffectation = {
      id: 'r2',
      cibleType: TypeCiblePlanning.INTERVENTION,
      cibleId: 'x1',
      dateHeure: '2026-01-02T00:00:00.000Z',
    } as unknown as Reaffectation;
    donnees.reaffectations = [versMaintenance, versIntervention];
    const index = construireIndexes(donnees);

    expect(index.reaffectations.byCible.get('maintenance:x1')).toHaveLength(1);
    expect(index.reaffectations.byCible.get('intervention:x1')).toHaveLength(1);
    expect(index.reaffectations.byCible.get('maintenance:x1')?.[0].id).toBe('r1');
  });

  it('indexe les réserves CTQ par appareilId (et non par un ascenseurId qui n’existe pas sur ce type)', () => {
    const donnees = donneesVides();
    const reserve: ReserveCTQ = { id: 'res-1', controleId: 'ctrl-1', appareilId: 'asc-1' } as unknown as ReserveCTQ;
    donnees.reservesCTQ = [reserve];
    const index = construireIndexes(donnees);

    expect(index.reservesCTQ.byAppareilId.get('asc-1')).toHaveLength(1);
    expect(index.reservesCTQ.byControleId.get('ctrl-1')).toHaveLength(1);
  });

  it('reconstruit un jeu d’index vide sans erreur quand toutes les entités sont vides', () => {
    const index = construireIndexes(donneesVides());
    expect(index.ascenseurs.byId.size).toBe(0);
    expect(index.interventions.byStatut.size).toBe(0);
  });
});
