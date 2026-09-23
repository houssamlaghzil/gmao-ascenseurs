import { describe, expect, it, vi } from 'vitest';
import {
  getDateDemo,
  getAllInterventions,
  updateIntervention,
  getAllEvenementsReserve,
  addEvenementReserve,
  getTicketsByInterventionId,
  reinitialiserDonneesDemo,
  rafraichirFraicheurScenarios,
} from './store';
import { interventions as interventionsInitiales } from './mockData';
import { StatutIntervention, MotifIntervention, type Intervention } from '@/domain/types';

/** Aucune étape franchie après la création : ni affectation, ni prise en charge, ni arrivée, ni fin, ni validation, ni clôture. */
const aucunJalonApresCreation = (i: Intervention): boolean =>
  !i.dateAffectation && !i.datePriseEnCharge && !i.dateArriveeSite && !i.dateTerminee && !i.dateValidation && !i.dateCloture;

describe('getDateDemo', () => {
  it("renvoie une date proche de l'heure réelle courante", () => {
    const avant = Date.now();
    const date = getDateDemo();
    const apres = Date.now();

    expect(date.getTime()).toBeGreaterThanOrEqual(avant);
    expect(date.getTime()).toBeLessThanOrEqual(apres);
  });
});

describe('reinitialiserDonneesDemo', () => {
  it('restaure une intervention mutée à son état initial', () => {
    const [premiere] = getAllInterventions();
    const statutOriginal = premiere.statut;
    const autreStatut =
      statutOriginal === StatutIntervention.CLOTURE ? StatutIntervention.A_AFFECTER : StatutIntervention.CLOTURE;

    updateIntervention({ ...premiere, statut: autreStatut });
    expect(getAllInterventions().find((i) => i.id === premiere.id)?.statut).toBe(autreStatut);

    reinitialiserDonneesDemo();
    expect(getAllInterventions().find((i) => i.id === premiere.id)?.statut).toBe(statutOriginal);
  });
});

describe('rafraichirFraicheurScenarios', () => {
  it("rafraîchit les interventions « personne bloquée » encore intactes pour qu'elles restent récentes, sans casser leur cohérence", () => {
    reinitialiserDonneesDemo();
    const maintenant = getDateDemo();
    const uneHeureMs = 60 * 60 * 1000;

    const personnesBloqueesIntactes = getAllInterventions().filter(
      (i) => i.motif === MotifIntervention.PERSONNE_BLOQUEE && aucunJalonApresCreation(i)
    );

    expect(personnesBloqueesIntactes.length).toBeGreaterThan(0);
    for (const intervention of personnesBloqueesIntactes) {
      const creation = new Date(intervention.dateCreation).getTime();
      expect(maintenant.getTime() - creation).toBeLessThan(uneHeureMs);

      // Fenêtre SLA préservée : le décompte démarre au plus tard à la création, l'échéance tombe après.
      expect(new Date(intervention.dateDebutDecompteSLA).getTime()).toBeLessThanOrEqual(creation);
      expect(new Date(intervention.dateLimiteSLA).getTime()).toBeGreaterThan(creation);

      // Le 1er ticket reste le point de départ du SLA, et aucun ticket n'est daté dans le futur.
      const ticketsIntervention = getTicketsByInterventionId(intervention.id);
      if (ticketsIntervention[0]) expect(ticketsIntervention[0].dateReception).toBe(intervention.dateDebutDecompteSLA);
      for (const ticket of ticketsIntervention) {
        expect(new Date(ticket.dateReception).getTime()).toBeLessThanOrEqual(maintenant.getTime());
      }
    }
  });

  it('laisse inchangées les interventions « personne bloquée » déjà engagées (affectées, en cours, terminées…)', () => {
    reinitialiserDonneesDemo();
    const origines = new Map(interventionsInitiales.map((i) => [i.id, i]));

    const dejaEngagees = getAllInterventions().filter(
      (i) => i.motif === MotifIntervention.PERSONNE_BLOQUEE && !aucunJalonApresCreation(i)
    );

    expect(dejaEngagees.length).toBeGreaterThan(0);
    for (const intervention of dejaEngagees) {
      expect(intervention.dateCreation).toBe(origines.get(intervention.id)?.dateCreation);
    }
  });

  it('ramène à l\'heure de démonstration tout événement de réserve daté dans le futur', () => {
    const [existant] = getAllEvenementsReserve();
    const futur = new Date(getDateDemo().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    addEvenementReserve({ ...existant, id: 'evt-test-futur', dateHeure: futur });

    rafraichirFraicheurScenarios();

    const evenement = getAllEvenementsReserve().find((e) => e.id === 'evt-test-futur');
    expect(evenement).toBeDefined();
    expect(new Date(evenement!.dateHeure).getTime()).toBeLessThanOrEqual(getDateDemo().getTime());
  });
});

describe("partage d'état entre « couches » Next.js (globalThis)", () => {
  it('une mutation faite via une première instance du module reste visible après réévaluation complète du module', async () => {
    const store1 = await import('./store');
    const [premiere] = store1.getAllInterventions();
    const autreStatut =
      premiere.statut === StatutIntervention.CLOTURE ? StatutIntervention.A_AFFECTER : StatutIntervention.CLOTURE;
    store1.updateIntervention({ ...premiere, statut: autreStatut });

    // vi.resetModules() force une réévaluation complète de data/store.ts (et de
    // data/mockData.ts) — exactement ce que fait Next.js en donnant à une
    // Server Action une instance de module séparée de celle des Server
    // Components. globalThis, lui, survit à cette réévaluation : c'est la
    // condition que ce test vérifie.
    vi.resetModules();
    const store2 = await import('./store');
    const relue = store2.getAllInterventions().find((i) => i.id === premiere.id);

    expect(relue?.statut).toBe(autreStatut);
  });
});
