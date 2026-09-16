/**
 * Tests unitaires pour la logique métier
 */

import { describe, it, expect } from 'vitest';
import {
  changerStatutAppareil,
  creerIntervention,
  confirmerPourAffectation,
  affecterTechnicien,
  prendreEnCharge,
  demarrerIntervention,
  mettreEnAttentePiece,
  reprendreIntervention,
  terminerIntervention,
  soumettrePourValidation,
  rejeterRapport,
  validerIntervention,
  reaffecter,
  planifierReserve,
  demarrerTraitementReserve,
  declarerReserveTraitee,
  soumettreReservePourControle,
  validerReserve,
  reouvrirReserve,
  calculerStatutControle,
  estReserveEnRetard,
} from './business-logic';
import {
  Ascenseur,
  StatutAppareil,
  TypeAuteurModification,
  OrigineAction,
  MotifIntervention,
  NiveauUrgence,
  PrioriteIntervention,
  StatutIntervention,
  MotifReattribution,
  ReserveCTQ,
  StatutReserve,
  GraviteReserve,
  ControleCTQ,
  StatutControleCTQ,
  TypeTraitementReserve,
} from './types';

const auteurTest = { type: TypeAuteurModification.UTILISATEUR_WEB, id: 'user-test', nomAffiche: 'Jean Test' };

const ascenseurTest: Ascenseur = {
  id: 'asc-test-1',
  code: 'TST-A1',
  parcId: 'parc-test',
  clientId: 'client-test',
  contratId: 'contrat-test',
  adresseComplete: '1 rue de Test',
  ville: 'Testville',
  statutAppareil: StatutAppareil.EN_SERVICE,
  ficheTechnique: {
    marque: 'Otis',
    modele: 'Gen2',
    dateInstallation: '2015-01-01',
    chargeUtileKg: 630,
    vitesseMs: 1.6,
    nombreNiveaux: 6,
    niveauxDesservis: [],
    telealarme: { present: true, statutFonctionnel: 'fonctionnelle' as never },
    gestionCles: { detenteur: 'gardien' as never },
    accesLocalTechnique: { localisation: 'Local machinerie' },
  },
  dateCreationFiche: '2015-01-01',
};

describe('changerStatutAppareil', () => {
  it('passe un appareil en panne et journalise la modification', () => {
    const { ascenseur, entreeJournal } = changerStatutAppareil(
      ascenseurTest,
      StatutAppareil.EN_PANNE,
      auteurTest,
      OrigineAction.WEB
    );
    expect(ascenseur.statutAppareil).toBe(StatutAppareil.EN_PANNE);
    expect(entreeJournal.ancienneValeur).toBe(StatutAppareil.EN_SERVICE);
    expect(entreeJournal.nouvelleValeur).toBe(StatutAppareil.EN_PANNE);
  });

  it('échoue si le statut est déjà celui demandé', () => {
    expect(() => changerStatutAppareil(ascenseurTest, StatutAppareil.EN_SERVICE, auteurTest, OrigineAction.WEB)).toThrow(
      "L'appareil est déjà dans ce statut"
    );
  });

  it('exige au moins un étage concerné pour le mode dégradé', () => {
    expect(() => changerStatutAppareil(ascenseurTest, StatutAppareil.MODE_DEGRADE, auteurTest, OrigineAction.WEB)).toThrow(
      'Le mode dégradé nécessite de préciser au moins un étage concerné'
    );
  });

  it('crée un épisode de mode dégradé quand les étages sont fournis', () => {
    const { ascenseur, episodeModeDegrade } = changerStatutAppareil(
      ascenseurTest,
      StatutAppareil.MODE_DEGRADE,
      auteurTest,
      OrigineAction.MOBILE,
      { etagesConcernes: ['3', '4'], commentaire: 'Portes palières 3e étage' }
    );
    expect(ascenseur.statutAppareil).toBe(StatutAppareil.MODE_DEGRADE);
    expect(episodeModeDegrade?.etagesConcernes).toEqual(['3', '4']);
    expect(episodeModeDegrade?.actif).toBe(true);
  });
});

describe('Cycle de vie d\'une intervention', () => {
  it('gère le cycle complet nouveau -> ... -> clôturé', () => {
    const { intervention: i0 } = creerIntervention(
      ascenseurTest.id,
      MotifIntervention.PERSONNE_BLOQUEE,
      NiveauUrgence.PERSONNE_BLOQUEE,
      PrioriteIntervention.CRITIQUE,
      45,
      new Date().toISOString(),
      'contrat-test'
    );
    expect(i0.statut).toBe(StatutIntervention.NOUVEAU);

    const { intervention: i1 } = confirmerPourAffectation(i0);
    expect(i1.statut).toBe(StatutIntervention.A_AFFECTER);

    const { intervention: i2 } = affecterTechnicien(i1, 'tech-1');
    expect(i2.statut).toBe(StatutIntervention.AFFECTE);
    expect(i2.technicienId).toBe('tech-1');

    const { intervention: i3 } = prendreEnCharge(i2);
    expect(i3.statut).toBe(StatutIntervention.PRIS_EN_CHARGE);

    const { intervention: i4 } = demarrerIntervention(i3, false, undefined, StatutAppareil.EN_PANNE);
    expect(i4.statut).toBe(StatutIntervention.EN_COURS);
    expect(i4.etatAppareilInitial).toBe(StatutAppareil.EN_PANNE);

    const { intervention: i5 } = mettreEnAttentePiece(i4, 'Câble à commander');
    expect(i5.statut).toBe(StatutIntervention.EN_ATTENTE_DE_PIECE);

    const { intervention: i6 } = reprendreIntervention(i5);
    expect(i6.statut).toBe(StatutIntervention.EN_COURS);

    const { intervention: i7 } = terminerIntervention(i6, 'rapport-1', StatutAppareil.EN_SERVICE, 42);
    expect(i7.statut).toBe(StatutIntervention.TERMINE);

    const { intervention: i8 } = soumettrePourValidation(i7);
    expect(i8.statut).toBe(StatutIntervention.A_VALIDER);

    const { intervention: i9 } = validerIntervention(i8);
    expect(i9.statut).toBe(StatutIntervention.CLOTURE);
    expect(i9.dateCloture).toBeDefined();
  });

  it('permet un rejet de rapport puis une reprise', () => {
    const { intervention: i0 } = creerIntervention(
      ascenseurTest.id,
      MotifIntervention.BRUIT_ANORMAL,
      NiveauUrgence.STANDARD,
      PrioriteIntervention.NORMALE,
      120,
      new Date().toISOString()
    );
    const aValider = { ...i0, statut: StatutIntervention.A_VALIDER };

    const { intervention: rejetee } = rejeterRapport(aValider, 'Diagnostic incomplet');
    expect(rejetee.statut).toBe(StatutIntervention.A_REPRENDRE);

    const { intervention: reprise } = reprendreIntervention(rejetee);
    expect(reprise.statut).toBe(StatutIntervention.EN_COURS);
  });

  it('échoue si on tente de prendre en charge une intervention non affectée', () => {
    const { intervention } = creerIntervention(
      ascenseurTest.id,
      MotifIntervention.AUTRE,
      NiveauUrgence.NON_URGENT,
      PrioriteIntervention.BASSE,
      480,
      new Date().toISOString()
    );
    expect(() => prendreEnCharge(intervention)).toThrow('Seule une intervention affectée peut être prise en charge');
  });

  it('réaffecte une intervention prise en charge, qui retombe à AFFECTE', () => {
    const { intervention: i0 } = creerIntervention(
      ascenseurTest.id,
      MotifIntervention.PANNE_ARRET,
      NiveauUrgence.STANDARD,
      PrioriteIntervention.HAUTE,
      120,
      new Date().toISOString()
    );
    const { intervention: i1 } = affecterTechnicien(i0, 'tech-1');
    const { intervention: i2 } = prendreEnCharge(i1);

    const { intervention: reaffectee, reaffectation } = reaffecter(
      i2,
      'tech-2',
      MotifReattribution.INDISPONIBILITE_TECHNICIEN,
      OrigineAction.WEB,
      'Technicien indisponible'
    );
    expect(reaffectee.statut).toBe(StatutIntervention.AFFECTE);
    expect(reaffectee.technicienId).toBe('tech-2');
    expect(reaffectation.ancienTechnicienId).toBe('tech-1');
  });

  it('interdit la réaffectation d\'une intervention clôturée', () => {
    const { intervention: i0 } = creerIntervention(
      ascenseurTest.id,
      MotifIntervention.AUTRE,
      NiveauUrgence.NON_URGENT,
      PrioriteIntervention.BASSE,
      480,
      new Date().toISOString()
    );
    const cloturee = { ...i0, statut: StatutIntervention.CLOTURE };
    expect(() => reaffecter(cloturee, 'tech-2', MotifReattribution.AUTRE, OrigineAction.WEB)).toThrow(
      'Une intervention clôturée ne peut plus être réaffectée'
    );
  });
});

describe('Cycle de vie d\'une réserve CTQ', () => {
  const reserveBase: ReserveCTQ = {
    id: 'res-1',
    numero: 'RES-2026-00001',
    controleId: 'ctq-1',
    pointDeControleId: 'point-1',
    appareilId: ascenseurTest.id,
    clientId: ascenseurTest.clientId,
    libelleBloc: 'Machinerie',
    description: 'Frein usé',
    actionDemandee: 'Remplacer la garniture de frein',
    gravite: GraviteReserve.MAJEURE,
    statut: StatutReserve.A_TRAITER,
    dateConstat: '2026-01-01',
    photosConstatIds: ['photo-1'],
    photosTraitementIds: [],
  };

  it('gère le cycle à_traiter -> ... -> validée', () => {
    const { reserve: r1 } = planifierReserve(reserveBase, 'tech-1', '2026-02-01');
    expect(r1.statut).toBe(StatutReserve.PLANIFIEE);

    const { reserve: r2 } = demarrerTraitementReserve(r1);
    expect(r2.statut).toBe(StatutReserve.EN_COURS);

    const { reserve: r3 } = declarerReserveTraitee(
      r2,
      { type: TypeTraitementReserve.MAINTENANCE, id: 'maint-1' },
      ['photo-2']
    );
    expect(r3.statut).toBe(StatutReserve.TRAITEE);

    const { reserve: r4 } = soumettreReservePourControle(r3);
    expect(r4.statut).toBe(StatutReserve.A_CONTROLER);

    const { reserve: r5 } = validerReserve(r4, 'Bureau Alpha');
    expect(r5.statut).toBe(StatutReserve.VALIDEE);
  });

  it('exige au moins une photo de traitement', () => {
    const enCours = { ...reserveBase, statut: StatutReserve.EN_COURS };
    expect(() =>
      declarerReserveTraitee(enCours, { type: TypeTraitementReserve.INTERVENTION, id: 'int-1' }, [])
    ).toThrow('Au moins une photo "après traitement" est requise pour une réserve CTQ');
  });

  it('permet une réouverture sur contre-visite négative', () => {
    const aControler = { ...reserveBase, statut: StatutReserve.A_CONTROLER };
    const { reserve } = reouvrirReserve(aControler, 'Frein toujours défaillant');
    expect(reserve.statut).toBe(StatutReserve.EN_COURS);
  });

  it('calcule le statut agrégé d\'un contrôle depuis ses réserves', () => {
    const controle: ControleCTQ = {
      id: 'ctq-1',
      numero: 'CTQ-2026-0001',
      appareilId: ascenseurTest.id,
      clientId: ascenseurTest.clientId,
      bureauEtudesId: 'bureau-1',
      dateVisite: '2026-01-01',
      dateProchainControle: '2031-01-01',
      statut: StatutControleCTQ.RESERVES_A_TRAITER,
      nombreReserves: 1,
      nombreReservesSoldees: 0,
      blocs: [],
    };
    expect(calculerStatutControle(controle, [reserveBase])).toBe(StatutControleCTQ.RESERVES_A_TRAITER);
    expect(calculerStatutControle(controle, [{ ...reserveBase, statut: StatutReserve.VALIDEE }])).toBe(
      StatutControleCTQ.SOLDE
    );
    expect(calculerStatutControle(controle, [])).toBe(StatutControleCTQ.REALISE_SANS_RESERVE);
  });

  it('détermine si une réserve est en retard par rapport à son échéance', () => {
    const enRetard = { ...reserveBase, dateEcheance: '2020-01-01' };
    const aTemps = { ...reserveBase, dateEcheance: '2999-01-01' };
    const validee = { ...reserveBase, dateEcheance: '2020-01-01', statut: StatutReserve.VALIDEE };
    expect(estReserveEnRetard(enRetard)).toBe(true);
    expect(estReserveEnRetard(aTemps)).toBe(false);
    expect(estReserveEnRetard(validee)).toBe(false);
  });
});
