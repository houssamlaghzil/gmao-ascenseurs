import { describe, expect, it, vi } from 'vitest';
import {
  getDateDemo,
  getAllInterventions,
  getInterventionById,
  updateIntervention,
  getAllEvenementsReserve,
  addEvenementReserve,
  getTicketsByInterventionId,
  getAllReaffectations,
  addReaffectation,
  getAllRapports,
  addRapport,
  getEtapesInterventionParId,
  getAllReservesCTQ,
  getReserveCTQById,
  updateReserveCTQ,
  reinitialiserDonneesDemo,
  rafraichirFraicheurScenarios,
} from './store';
import { interventions as interventionsInitiales, tickets as ticketsInitiaux } from './mockData';
import {
  StatutIntervention,
  MotifIntervention,
  TypeCiblePlanning,
  TypeEtapeIntervention,
  type Intervention,
} from '@/domain/types';

const uneHeureMs = 60 * 60 * 1000;

/** Aucune étape franchie après la création : ni affectation, ni prise en charge, ni arrivée, ni fin, ni validation, ni clôture. */
const aucunJalonApresCreation = (i: Intervention): boolean =>
  !i.dateAffectation && !i.datePriseEnCharge && !i.dateArriveeSite && !i.dateTerminee && !i.dateValidation && !i.dateCloture;

/** Jalons du cycle de vie, dans l'ordre chronologique de l'interface Intervention. */
const JALONS = [
  'dateCreation',
  'dateAffectation',
  'datePriseEnCharge',
  'dateArriveeSite',
  'dateTerminee',
  'dateValidation',
  'dateCloture',
] as const;

const ms = (dateISO: string): number => new Date(dateISO).getTime();

/** Horodatages (ms) des jalons effectivement renseignés, dans l'ordre de l'interface. */
const jalonsRenseignesMs = (i: Intervention): number[] =>
  JALONS.map((champ) => i[champ]).filter((d): d is string => d !== undefined).map(ms);

/** Jalon le plus récent effectivement renseigné (ms), au pire la création. */
const dernierJalonMs = (i: Intervention): number => Math.max(...jalonsRenseignesMs(i));

const estPersonneBloqueeOuverte = (i: Intervention): boolean =>
  i.motif === MotifIntervention.PERSONNE_BLOQUEE && i.statut !== StatutIntervention.CLOTURE;

/** Interventions référencées par une Reaffectation ou un Rapport — exclues du recalage de fraîcheur. */
const interventionsAvecHistoriqueFige = (): Set<string> =>
  new Set([
    ...getAllReaffectations().filter((r) => r.cibleType === TypeCiblePlanning.INTERVENTION).map((r) => r.cibleId),
    ...getAllRapports().flatMap((r) => (r.interventionId ? [r.interventionId] : [])),
  ]);

/** Recule de `decalageMs` tous les horodatages renseignés d'une intervention (jalons et fenêtre SLA). */
const reculer = (i: Intervention, decalageMs: number): Intervention => {
  const reculee: Intervention = {
    ...i,
    dateDebutDecompteSLA: new Date(ms(i.dateDebutDecompteSLA) - decalageMs).toISOString(),
    dateLimiteSLA: new Date(ms(i.dateLimiteSLA) - decalageMs).toISOString(),
  };
  for (const champ of JALONS) {
    const valeur = i[champ];
    if (valeur) reculee[champ] = new Date(ms(valeur) - decalageMs).toISOString();
  }
  return reculee;
};

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

  it("rafraîchit aussi les urgences « personne bloquée » déjà engagées, en décalant tous leurs horodatages d'un même bloc", () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();
    const origines = new Map(interventionsInitiales.map((i) => [i.id, i]));
    const figees = interventionsAvecHistoriqueFige();

    const engagees = getAllInterventions().filter(
      (i) => estPersonneBloqueeOuverte(i) && !figees.has(i.id) && i.dateAffectation !== undefined
    );

    expect(engagees.length).toBeGreaterThan(0);
    for (const intervention of engagees) {
      const origine = origines.get(intervention.id)!;
      const decalageMs = ms(intervention.dateCreation) - ms(origine.dateCreation);

      // Un seul et même décalage pour chaque horodatage renseigné ; un jalon absent reste absent.
      for (const champ of [...JALONS, 'dateDebutDecompteSLA', 'dateLimiteSLA'] as const) {
        const valeurOrigine = origine[champ];
        if (valeurOrigine === undefined) {
          expect(intervention[champ]).toBeUndefined();
        } else {
          expect(ms(intervention[champ]!) - ms(valeurOrigine)).toBe(decalageMs);
        }
      }
      expect(intervention.dureeInterventionMinutes).toBe(origine.dureeInterventionMinutes);

      // Le jalon le plus récent atterrit dans l'heure écoulée, jamais dans le futur, et l'ordre des jalons est intact.
      const dernier = dernierJalonMs(intervention);
      expect(dernier).toBeLessThanOrEqual(maintenantMs);
      expect(maintenantMs - dernier).toBeLessThan(uneHeureMs);
      const jalons = jalonsRenseignesMs(intervention);
      for (let k = 1; k < jalons.length; k++) expect(jalons[k]).toBeGreaterThanOrEqual(jalons[k - 1]);

      // Le 1er ticket reste le point de départ du SLA, et aucun ticket n'est daté dans le futur.
      const ticketsIntervention = getTicketsByInterventionId(intervention.id);
      if (ticketsIntervention[0]) expect(ticketsIntervention[0].dateReception).toBe(intervention.dateDebutDecompteSLA);
      for (const ticket of ticketsIntervention) {
        expect(ms(ticket.dateReception)).toBeLessThanOrEqual(maintenantMs);
        if (ticket.dateRapprochement) expect(ms(ticket.dateRapprochement)).toBeLessThanOrEqual(maintenantMs);
      }
    }

    // Cas type : une urgence seulement affectée — l'affectation devient récente, et la
    // création la précède exactement du même écart qu'à l'origine.
    const seulementAffectees = engagees.filter(
      (i) => !i.datePriseEnCharge && !i.dateArriveeSite && !i.dateTerminee && !i.dateValidation && !i.dateCloture
    );
    expect(seulementAffectees.length).toBeGreaterThan(0);
    for (const intervention of seulementAffectees) {
      const origine = origines.get(intervention.id)!;
      expect(maintenantMs - ms(intervention.dateAffectation!)).toBeLessThan(uneHeureMs);
      expect(ms(intervention.dateAffectation!) - ms(intervention.dateCreation)).toBe(
        ms(origine.dateAffectation!) - ms(origine.dateCreation)
      );
    }
  });

  it('laisse intactes les urgences « personne bloquée » référencées par une Reaffectation ou un Rapport', () => {
    reinitialiserDonneesDemo();
    const origines = new Map(interventionsInitiales.map((i) => [i.id, i]));
    const ticketsOrigine = new Map(ticketsInitiaux.map((t) => [t.id, t]));
    const reaffectees = new Set(
      getAllReaffectations().filter((r) => r.cibleType === TypeCiblePlanning.INTERVENTION).map((r) => r.cibleId)
    );
    const avecRapport = new Set(getAllRapports().flatMap((r) => (r.interventionId ? [r.interventionId] : [])));

    // Jeu de données réel : les deux cas d'exclusion sont présents, et gardent leurs dates d'origine.
    const personnesBloqueesOuvertes = getAllInterventions().filter(estPersonneBloqueeOuverte);
    expect(personnesBloqueesOuvertes.some((i) => reaffectees.has(i.id))).toBe(true);
    expect(personnesBloqueesOuvertes.some((i) => avecRapport.has(i.id))).toBe(true);
    for (const intervention of personnesBloqueesOuvertes.filter((i) => reaffectees.has(i.id) || avecRapport.has(i.id))) {
      expect(intervention).toEqual(origines.get(intervention.id));
      for (const ticket of getTicketsByInterventionId(intervention.id)) {
        expect(ticket).toEqual(ticketsOrigine.get(ticket.id));
      }
    }

    // Cas construit : deux urgences rafraîchissables, vieillies de 10 jours, deviennent
    // intouchables dès qu'une réaffectation (resp. un rapport) les référence.
    const figees = interventionsAvecHistoriqueFige();
    const [pourReaffectation, pourRapport] = getAllInterventions().filter(
      (i) => estPersonneBloqueeOuverte(i) && !figees.has(i.id)
    );
    const dixJoursMs = 10 * 24 * uneHeureMs;
    const vieillieReaffectee = reculer(pourReaffectation, dixJoursMs);
    const vieillieAvecRapport = reculer(pourRapport, dixJoursMs);
    updateIntervention(vieillieReaffectee);
    updateIntervention(vieillieAvecRapport);
    const modeleReaffectation = getAllReaffectations().find((r) => r.cibleType === TypeCiblePlanning.INTERVENTION)!;
    addReaffectation({ ...modeleReaffectation, id: 'reaf-test-fige', cibleId: pourReaffectation.id });
    const modeleRapport = getAllRapports().find((r) => r.interventionId !== undefined)!;
    addRapport({ ...modeleRapport, id: 'rap-test-fige', interventionId: pourRapport.id });

    rafraichirFraicheurScenarios();

    expect(getInterventionById(pourReaffectation.id)).toEqual(vieillieReaffectee);
    expect(getInterventionById(pourRapport.id)).toEqual(vieillieAvecRapport);
  });

  it("après réinitialisation, le jalon le plus récent de chaque urgence « personne bloquée » rafraîchissable date de moins d'une heure", () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();
    const figees = interventionsAvecHistoriqueFige();

    const rafraichissables = getAllInterventions().filter((i) => estPersonneBloqueeOuverte(i) && !figees.has(i.id));

    expect(rafraichissables.length).toBeGreaterThan(0);
    // Couvre bien les urgences déjà engagées sur le terrain (en cours, en attente de pièce, à reprendre…), pas seulement les NOUVEAU.
    expect(rafraichissables.some((i) => i.dateArriveeSite !== undefined)).toBe(true);
    for (const intervention of rafraichissables) {
      const ancienneteMs = maintenantMs - dernierJalonMs(intervention);
      expect(ancienneteMs).toBeGreaterThanOrEqual(0);
      expect(ancienneteMs).toBeLessThan(uneHeureMs);
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

  it("ramène à l'heure de démonstration une date de validation de réserve située dans le futur, sans toucher une date passée", () => {
    reinitialiserDonneesDemo();
    const [reserveFuture, reservePassee] = getAllReservesCTQ();
    const futur = new Date(getDateDemo().getTime() + 30 * 24 * uneHeureMs).toISOString();
    const passe = new Date(getDateDemo().getTime() - 30 * 24 * uneHeureMs).toISOString();
    updateReserveCTQ({ ...reserveFuture, dateValidation: futur });
    updateReserveCTQ({ ...reservePassee, dateValidation: passe });

    rafraichirFraicheurScenarios();

    const dateValidation = getReserveCTQById(reserveFuture.id)?.dateValidation;
    expect(dateValidation).toBeDefined();
    expect(ms(dateValidation!)).toBeLessThanOrEqual(getDateDemo().getTime());
    expect(getReserveCTQById(reservePassee.id)?.dateValidation).toBe(passe);
  });

  it("après réinitialisation, aucune réserve n'est traitée ni validée dans le futur, et aucune n'est validée avant d'être traitée", () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();

    for (const reserve of getAllReservesCTQ()) {
      for (const date of [reserve.dateConstat, reserve.datePlanification, reserve.dateTraitement, reserve.dateValidation]) {
        if (date !== undefined) expect(ms(date)).toBeLessThanOrEqual(maintenantMs);
      }
      // Plafonner la validation seule la placerait avant un traitement resté dans le futur.
      if (reserve.dateTraitement !== undefined && reserve.dateValidation !== undefined) {
        expect(ms(reserve.dateValidation)).toBeGreaterThanOrEqual(ms(reserve.dateTraitement));
      }
    }
  });
});

describe("cache de la chronologie d'intervention", () => {
  it('reflète une réattribution faite après une première lecture de la chronologie', () => {
    reinitialiserDonneesDemo();
    const [intervention] = getAllInterventions();
    const avant = getEtapesInterventionParId(intervention.id); // remplit le cache

    const modele = getAllReaffectations().find((r) => r.cibleType === TypeCiblePlanning.INTERVENTION)!;
    addReaffectation({ ...modele, id: 'reaf-test-cache', cibleId: intervention.id, dateHeure: getDateDemo().toISOString() });

    const apres = getEtapesInterventionParId(intervention.id);
    expect(apres).toHaveLength(avant.length + 1);
    expect(
      apres.some((e) => e.type === TypeEtapeIntervention.REATTRIBUEE && e.reaffectationId === 'reaf-test-cache')
    ).toBe(true);
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
    // Précondition : sans nouvelle instance du module, le test ne prouverait rien.
    expect(store2).not.toBe(store1);
    const relue = store2.getAllInterventions().find((i) => i.id === premiere.id);

    expect(relue?.statut).toBe(autreStatut);
  });
});
