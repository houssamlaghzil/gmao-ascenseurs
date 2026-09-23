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
import {
  interventions as interventionsInitiales,
  tickets as ticketsInitiaux,
  reaffectations as reaffectationsInitiales,
} from './mockData';
import {
  StatutIntervention,
  MotifIntervention,
  TypeCiblePlanning,
  TypeEtapeIntervention,
  type Intervention,
  type Reaffectation,
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

/** Réaffectations visant une intervention donnée, parmi `reaffectations`. */
const reaffectationsDe = (reaffectations: Reaffectation[], interventionId: string): Reaffectation[] =>
  reaffectations.filter((r) => r.cibleType === TypeCiblePlanning.INTERVENTION && r.cibleId === interventionId);

/**
 * Jalon le plus récent effectivement renseigné (ms), au pire la création —
 * réaffectations de l'intervention comprises, comme dans data/store.ts.
 */
const dernierJalonMs = (i: Intervention, reaffectations: Reaffectation[] = getAllReaffectations()): number =>
  Math.max(...jalonsRenseignesMs(i), ...reaffectationsDe(reaffectations, i.id).map((r) => ms(r.dateHeure)));

const estPersonneBloqueeOuverte = (i: Intervention): boolean =>
  i.motif === MotifIntervention.PERSONNE_BLOQUEE && i.statut !== StatutIntervention.CLOTURE;

/** Interventions référencées par un Rapport — seules exclues du recalage de fraîcheur. */
const interventionsAvecRapport = (rapports = getAllRapports()): Set<string> =>
  new Set(rapports.flatMap((r) => (r.interventionId ? [r.interventionId] : [])));

/** Interventions visées par au moins une Reaffectation. */
const interventionsReaffectees = (reaffectations = getAllReaffectations()): Set<string> =>
  new Set(reaffectations.filter((r) => r.cibleType === TypeCiblePlanning.INTERVENTION).map((r) => r.cibleId));

type LecturesStore = Pick<typeof import('./store'), 'getAllInterventions' | 'getAllReaffectations' | 'getAllRapports'>;

/**
 * Ancienneté (ms) du jalon le plus récent — réaffectations comprises — de
 * chaque urgence « personne bloquée » rafraîchissable (ouverte, sans Rapport).
 * C'est ce qui décide de l'aspect « récent » de l'aperçu « Personne bloquée »
 * du tableau de bord (lib/derived/dashboard.ts).
 */
const ancienneteDesUrgencesRafraichissables = (store: LecturesStore, maintenantMs: number) => {
  const reaffectations = store.getAllReaffectations();
  const avecRapport = interventionsAvecRapport(store.getAllRapports());
  return store
    .getAllInterventions()
    .filter((i) => estPersonneBloqueeOuverte(i) && !avecRapport.has(i.id))
    .map((intervention) => ({ intervention, ancienneteMs: maintenantMs - dernierJalonMs(intervention, reaffectations) }));
};

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
    const avecRapport = interventionsAvecRapport();
    const reaffectees = interventionsReaffectees();

    const engagees = getAllInterventions().filter(
      (i) => estPersonneBloqueeOuverte(i) && !avecRapport.has(i.id) && i.dateAffectation !== undefined
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

    // Cas type : une urgence seulement affectée (ni réaffectée, ni plus avancée) — l'affectation
    // devient récente, et la création la précède exactement du même écart qu'à l'origine.
    const seulementAffectees = engagees.filter(
      (i) =>
        !reaffectees.has(i.id) &&
        !i.datePriseEnCharge &&
        !i.dateArriveeSite &&
        !i.dateTerminee &&
        !i.dateValidation &&
        !i.dateCloture
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

  it('décale les urgences « personne bloquée » déjà réaffectées du même bloc que leurs réaffectations', () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();
    const origines = new Map(interventionsInitiales.map((i) => [i.id, i]));
    const avecRapport = interventionsAvecRapport();
    const reaffectees = interventionsReaffectees();

    // Jeu de données réel : ces urgences (qui ont les échéances SLA les plus anciennes, donc la
    // tête de l'aperçu du tableau de bord) sont rafraîchies, réaffectations comprises.
    const reaffecteesOuvertes = getAllInterventions().filter(
      (i) => estPersonneBloqueeOuverte(i) && reaffectees.has(i.id) && !avecRapport.has(i.id)
    );
    expect(reaffecteesOuvertes.length).toBeGreaterThan(0);
    for (const intervention of reaffecteesOuvertes) {
      const origine = origines.get(intervention.id)!;
      const decalageMs = ms(intervention.dateCreation) - ms(origine.dateCreation);
      expect(decalageMs).toBeGreaterThan(0);

      // Un seul et même décalage pour chaque horodatage renseigné de l'intervention…
      for (const champ of [...JALONS, 'dateDebutDecompteSLA', 'dateLimiteSLA'] as const) {
        const valeurOrigine = origine[champ];
        if (valeurOrigine === undefined) expect(intervention[champ]).toBeUndefined();
        else expect(ms(intervention[champ]!) - ms(valeurOrigine)).toBe(decalageMs);
      }
      // … et pour le dateHeure de chacune de ses réaffectations.
      const reaffectationsOrigine = reaffectationsDe(reaffectationsInitiales, intervention.id);
      const reaffectationsDecalees = reaffectationsDe(getAllReaffectations(), intervention.id);
      expect(reaffectationsDecalees).toHaveLength(reaffectationsOrigine.length);
      for (const reaffectation of reaffectationsDecalees) {
        const reaffectationOrigine = reaffectationsOrigine.find((r) => r.id === reaffectation.id)!;
        expect(ms(reaffectation.dateHeure) - ms(reaffectationOrigine.dateHeure)).toBe(decalageMs);
        // Seul l'horodatage bouge.
        expect({ ...reaffectation, dateHeure: reaffectationOrigine.dateHeure }).toEqual(reaffectationOrigine);
        // Chaque réaffectation reste postérieure aux jalons qui la précédaient à l'origine.
        for (const champ of JALONS) {
          const valeurOrigine = origine[champ];
          if (valeurOrigine !== undefined && ms(valeurOrigine) <= ms(reaffectationOrigine.dateHeure)) {
            expect(ms(reaffectation.dateHeure)).toBeGreaterThanOrEqual(ms(intervention[champ]!));
          }
        }
        expect(ms(reaffectation.dateHeure)).toBeLessThanOrEqual(maintenantMs);
      }

      // Le jalon le plus récent, réaffectations comprises, date de moins d'une heure, jamais du futur.
      const ancienneteMs = maintenantMs - dernierJalonMs(intervention);
      expect(ancienneteMs).toBeGreaterThanOrEqual(0);
      expect(ancienneteMs).toBeLessThan(uneHeureMs);
    }

    // Cas construit : une urgence vieillie de 10 jours, puis réaffectée 2 h après son dernier jalon
    // (donc toujours 10 jours plus tôt). Tout est rajeuni ensemble, et la réaffectation, devenue
    // le jalon le plus récent, atterrit juste avant maintenant sans dépasser.
    const candidate = getAllInterventions().find(
      (i) => estPersonneBloqueeOuverte(i) && !avecRapport.has(i.id) && !reaffectees.has(i.id) && i.dateAffectation !== undefined
    )!;
    const dixJoursMs = 10 * 24 * uneHeureMs;
    const vieillie = reculer(candidate, dixJoursMs);
    updateIntervention(vieillie);
    const dateReaffectationVieillie = new Date(dernierJalonMs(vieillie, []) + 2 * uneHeureMs).toISOString();
    const modeleReaffectation = getAllReaffectations().find((r) => r.cibleType === TypeCiblePlanning.INTERVENTION)!;
    addReaffectation({
      ...modeleReaffectation,
      id: 'reaf-test-decalee',
      cibleId: candidate.id,
      dateHeure: dateReaffectationVieillie,
    });

    rafraichirFraicheurScenarios();

    const rafraichie = getInterventionById(candidate.id)!;
    const reaffectation = getAllReaffectations().find((r) => r.id === 'reaf-test-decalee')!;
    const decalageMs = ms(rafraichie.dateCreation) - ms(vieillie.dateCreation);
    expect(decalageMs).toBeGreaterThan(9 * 24 * uneHeureMs);
    expect(ms(reaffectation.dateHeure) - ms(dateReaffectationVieillie)).toBe(decalageMs);
    const maintenantApresMs = getDateDemo().getTime();
    for (const jalon of jalonsRenseignesMs(rafraichie)) {
      expect(jalon).toBeLessThan(ms(reaffectation.dateHeure));
    }
    expect(ms(reaffectation.dateHeure)).toBeLessThanOrEqual(maintenantApresMs);
    expect(maintenantApresMs - ms(reaffectation.dateHeure)).toBeLessThan(uneHeureMs);
  });

  it('laisse intactes les urgences « personne bloquée » auxquelles un Rapport est rattaché', () => {
    reinitialiserDonneesDemo();
    const origines = new Map(interventionsInitiales.map((i) => [i.id, i]));
    const ticketsOrigine = new Map(ticketsInitiaux.map((t) => [t.id, t]));
    const reaffectationsOrigine = new Map(reaffectationsInitiales.map((r) => [r.id, r]));
    const avecRapport = interventionsAvecRapport();

    // Jeu de données réel : le cas d'exclusion est présent, et garde ses dates d'origine.
    const avecRapportOuvertes = getAllInterventions().filter((i) => estPersonneBloqueeOuverte(i) && avecRapport.has(i.id));
    expect(avecRapportOuvertes.length).toBeGreaterThan(0);
    for (const intervention of avecRapportOuvertes) {
      expect(intervention).toEqual(origines.get(intervention.id));
      for (const ticket of getTicketsByInterventionId(intervention.id)) {
        expect(ticket).toEqual(ticketsOrigine.get(ticket.id));
      }
      for (const reaffectation of reaffectationsDe(getAllReaffectations(), intervention.id)) {
        expect(reaffectation).toEqual(reaffectationsOrigine.get(reaffectation.id));
      }
    }

    // Cas construit : une urgence rafraîchissable, vieillie de 10 jours et réaffectée, devient
    // intouchable — réaffectation comprise — dès qu'un rapport la référence.
    const [pourRapport] = getAllInterventions().filter((i) => estPersonneBloqueeOuverte(i) && !avecRapport.has(i.id));
    const dixJoursMs = 10 * 24 * uneHeureMs;
    const vieillieAvecRapport = reculer(pourRapport, dixJoursMs);
    updateIntervention(vieillieAvecRapport);
    const modeleReaffectation = getAllReaffectations().find((r) => r.cibleType === TypeCiblePlanning.INTERVENTION)!;
    const reaffectationFigee: Reaffectation = {
      ...modeleReaffectation,
      id: 'reaf-test-fige',
      cibleId: pourRapport.id,
      dateHeure: new Date(dernierJalonMs(vieillieAvecRapport, []) + uneHeureMs).toISOString(),
    };
    addReaffectation(reaffectationFigee);
    const modeleRapport = getAllRapports().find((r) => r.interventionId !== undefined)!;
    addRapport({ ...modeleRapport, id: 'rap-test-fige', interventionId: pourRapport.id });

    rafraichirFraicheurScenarios();

    expect(getInterventionById(pourRapport.id)).toEqual(vieillieAvecRapport);
    expect(getAllReaffectations().find((r) => r.id === 'reaf-test-fige')).toEqual(reaffectationFigee);
  });

  it("après réinitialisation, le jalon le plus récent (réaffectations comprises) de chaque urgence « personne bloquée » sans rapport date de moins d'une heure", () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();
    const reaffectees = interventionsReaffectees();

    const mesures = ancienneteDesUrgencesRafraichissables(
      { getAllInterventions, getAllReaffectations, getAllRapports },
      maintenantMs
    );

    expect(mesures.length).toBeGreaterThan(0);
    // Couvre bien les urgences déjà engagées sur le terrain (en cours, en attente de pièce, à reprendre…), pas seulement les NOUVEAU…
    expect(mesures.some(({ intervention }) => intervention.dateArriveeSite !== undefined)).toBe(true);
    // … et les urgences déjà réaffectées, qui dominaient la tête de l'aperçu du tableau de bord.
    expect(mesures.some(({ intervention }) => reaffectees.has(intervention.id))).toBe(true);
    for (const { ancienneteMs } of mesures) {
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

  it('laisse inchangée une date de planification de réserve future, tout en plafonnant une date de validation restée dans le futur', () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();
    // Reflète le jeu de données réel : des réserves PLANIFIEE / EN_COURS portent
    // un rendez-vous planifié à une date future légitime (planifierReserve).
    const reservePlanifieeAuFutur = getAllReservesCTQ().find(
      (r) => r.datePlanification !== undefined && ms(r.datePlanification) > maintenantMs
    );
    expect(reservePlanifieeAuFutur).toBeDefined();
    const datePlanificationAvant = reservePlanifieeAuFutur!.datePlanification;

    const reservePourValidation = getAllReservesCTQ().find((r) => r.id !== reservePlanifieeAuFutur!.id)!;
    const futur = new Date(maintenantMs + 30 * 24 * uneHeureMs).toISOString();
    updateReserveCTQ({ ...reservePourValidation, dateValidation: futur });

    rafraichirFraicheurScenarios();

    // datePlanification est un rendez-vous à venir, pas un horodatage de fait
    // accompli : rafraichirFraicheurScenarios() ne doit pas y toucher.
    expect(getReserveCTQById(reservePlanifieeAuFutur!.id)?.datePlanification).toBe(datePlanificationAvant);
    // dateValidation enregistre elle un événement passé : elle reste plafonnée à « maintenant ».
    expect(ms(getReserveCTQById(reservePourValidation.id)!.dateValidation!)).toBeLessThanOrEqual(getDateDemo().getTime());
  });

  it("après réinitialisation, aucune réserve n'est traitée ni validée dans le futur, et aucune n'est validée avant d'être traitée", () => {
    reinitialiserDonneesDemo();
    const maintenantMs = getDateDemo().getTime();

    for (const reserve of getAllReservesCTQ()) {
      // datePlanification est exclue : c'est un rendez-vous planifié qui peut
      // légitimement rester dans le futur (cf. le test dédié ci-dessus).
      for (const date of [reserve.dateConstat, reserve.dateTraitement, reserve.dateValidation]) {
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

describe('rafraîchissement au premier chargement du module (démarrage du process)', () => {
  it("un process neuf voit d'emblée des urgences « personne bloquée » récentes, sans réinitialisation, et une réévaluation ultérieure du module ne les rafraîchit pas une seconde fois", async () => {
    const globalMagasin = globalThis as { __magasinManelift?: unknown };
    const magasinDuFichier = globalMagasin.__magasinManelift;
    expect(magasinDuFichier).toBeDefined();
    try {
      // Simule un process neuf : aucun magasin encore créé sur globalThis, puis
      // premier chargement du module (et de data/mockData.ts, aux dates brutes).
      delete globalMagasin.__magasinManelift;
      vi.resetModules();
      const storeNeuf = await import('./store');
      expect(globalMagasin.__magasinManelift).toBeDefined();
      expect(globalMagasin.__magasinManelift).not.toBe(magasinDuFichier);

      // Aucun appel à reinitialiserDonneesDemo() : la fraîcheur vient du seul chargement.
      const mesures = ancienneteDesUrgencesRafraichissables(storeNeuf, storeNeuf.getDateDemo().getTime());
      expect(mesures.length).toBeGreaterThan(0);
      for (const { ancienneteMs } of mesures) {
        expect(ancienneteMs).toBeGreaterThanOrEqual(0);
        expect(ancienneteMs).toBeLessThan(uneHeureMs);
      }

      // Une réévaluation du module (autre « couche » Next.js, hot reload) retrouve le
      // magasin existant et ne le rafraîchit pas à nouveau : une urgence volontairement
      // vieillie entre-temps reste vieillie.
      const cible = mesures[0].intervention;
      const vieillie = reculer(cible, 10 * 24 * uneHeureMs);
      storeNeuf.updateIntervention(vieillie);
      vi.resetModules();
      const storeReevalue = await import('./store');
      expect(storeReevalue).not.toBe(storeNeuf);
      expect(storeReevalue.getInterventionById(cible.id)).toEqual(vieillie);

      // La réinitialisation manuelle reste fonctionnelle ensuite : elle repart des
      // données brutes, et l'urgence vieillie redevient récente comme les autres.
      storeReevalue.reinitialiserDonneesDemo();
      expect(storeReevalue.getInterventionById(cible.id)).not.toEqual(vieillie);
      const apresReset = ancienneteDesUrgencesRafraichissables(storeReevalue, storeReevalue.getDateDemo().getTime());
      expect(apresReset).toHaveLength(mesures.length);
      for (const { ancienneteMs } of apresReset) {
        expect(ancienneteMs).toBeGreaterThanOrEqual(0);
        expect(ancienneteMs).toBeLessThan(uneHeureMs);
      }
    } finally {
      // Rend au reste du fichier le magasin sur lequel ses imports statiques travaillent.
      globalMagasin.__magasinManelift = magasinDuFichier;
      vi.resetModules();
    }
  });
});
