/**
 * Logique métier — transitions d'état
 *
 * Deux machines à états indépendantes (voir domain/types.ts) :
 *   - le statut de l'APPAREIL (changerStatutAppareil, simple setter) ;
 *   - le cycle de vie d'une INTERVENTION (creerIntervention → ... →
 *     validerIntervention), avec réattribution et rapports multiples.
 * Plus les transitions d'une RÉSERVE CTQ (planifierReserve → ... →
 * validerReserve, avec réouverture possible sur contre-visite négative).
 *
 * Chaque fonction garde une règle métier explicite (throw Error en
 * français si la transition est invalide) et retourne l'entité modifiée
 * accompagnée de l'événement/des événements produits, sans muter les
 * objets reçus en entrée.
 */

import {
  Ascenseur,
  StatutAppareil,
  ChampModifiable,
  EntreeJournalModification,
  AuteurModification,
  OrigineAction,
  DetailModeDegrade,
  Intervention,
  StatutIntervention,
  EtapeIntervention,
  TypeEtapeIntervention,
  Reaffectation,
  TypeCiblePlanning,
  MotifReattribution,
  MotifIntervention,
  NiveauUrgence,
  PrioriteIntervention,
  ReserveCTQ,
  StatutReserve,
  EvenementReserve,
  TypeEvenementReserve,
  ReferenceTraitement,
  ControleCTQ,
  StatutControleCTQ,
} from './types';

/**
 * Génère un ID unique simple pour la démo
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// STATUT DE L'APPAREIL
// ============================================================================

/**
 * Change le statut d'un appareil et journalise la modification. Le mode
 * dégradé (étage(s) concerné(s), commentaire) doit être fourni uniquement
 * lorsque `nouveauStatut = MODE_DEGRADE` ; il est retiré dans tous les
 * autres cas (la clôture de l'épisode précédent, si besoin d'en garder
 * l'historique, est à la charge de l'appelant).
 */
export function changerStatutAppareil(
  ascenseur: Ascenseur,
  nouveauStatut: StatutAppareil,
  auteur: AuteurModification,
  origine: OrigineAction,
  detailModeDegrade?: { etagesConcernes: string[]; commentaire?: string }
): { ascenseur: Ascenseur; entreeJournal: EntreeJournalModification; episodeModeDegrade?: DetailModeDegrade } {
  if (nouveauStatut === ascenseur.statutAppareil) {
    throw new Error("L'appareil est déjà dans ce statut");
  }
  if (nouveauStatut === StatutAppareil.MODE_DEGRADE && (!detailModeDegrade || detailModeDegrade.etagesConcernes.length === 0)) {
    throw new Error('Le mode dégradé nécessite de préciser au moins un étage concerné');
  }

  const dateModification = new Date().toISOString();
  let episodeModeDegrade: DetailModeDegrade | undefined;
  let ascenseurModifie: Ascenseur;

  if (nouveauStatut === StatutAppareil.MODE_DEGRADE && detailModeDegrade) {
    episodeModeDegrade = {
      id: generateId(),
      ascenseurId: ascenseur.id,
      etagesConcernes: detailModeDegrade.etagesConcernes,
      commentaire: detailModeDegrade.commentaire,
      dateDebut: dateModification,
      responsableChangement: auteur,
      actif: true,
    };
    ascenseurModifie = { ...ascenseur, statutAppareil: nouveauStatut, modeDegrade: episodeModeDegrade };
  } else {
    ascenseurModifie = { ...ascenseur, statutAppareil: nouveauStatut, modeDegrade: undefined };
  }

  const entreeJournal: EntreeJournalModification = {
    id: generateId(),
    ascenseurId: ascenseur.id,
    champModifie: ChampModifiable.STATUT_APPAREIL,
    libelleChamp: "Statut de l'appareil",
    ancienneValeur: ascenseur.statutAppareil,
    nouvelleValeur: nouveauStatut,
    auteur,
    dateModification,
    origine,
  };

  return { ascenseur: ascenseurModifie, entreeJournal, episodeModeDegrade };
}

/**
 * Ajoute un commentaire libre à la fiche d'un appareil (remplace l'ancien
 * TypeEvenement.COMMENTAIRE par une EntreeJournalModification à champ AUTRE).
 */
export function ajouterCommentaireAppareil(
  ascenseurId: string,
  commentaire: string,
  auteur: AuteurModification,
  origine: OrigineAction
): EntreeJournalModification {
  return {
    id: generateId(),
    ascenseurId,
    champModifie: ChampModifiable.AUTRE,
    libelleChamp: 'Commentaire',
    ancienneValeur: '',
    nouvelleValeur: commentaire,
    auteur,
    dateModification: new Date().toISOString(),
    origine,
  };
}

// ============================================================================
// CYCLE DE VIE D'UNE INTERVENTION
// ============================================================================

/**
 * Crée une intervention à la réception du premier ticket (section 7/8).
 * Le décompte SLA démarre à `dateReceptionPremierTicket`, jamais à la date
 * de création de l'intervention elle-même.
 */
export function creerIntervention(
  ascenseurId: string,
  motif: MotifIntervention,
  niveauUrgence: NiveauUrgence,
  priorite: PrioriteIntervention,
  delaiContractuelMinutes: number,
  dateReceptionPremierTicket: string,
  contratId?: string,
  motifDetail?: string
): { intervention: Intervention; etape: EtapeIntervention } {
  const dateCreation = new Date().toISOString();
  const dateLimiteSLA = new Date(
    new Date(dateReceptionPremierTicket).getTime() + delaiContractuelMinutes * 60_000
  ).toISOString();

  const intervention: Intervention = {
    id: generateId(),
    numero: `INT-${new Date(dateCreation).getFullYear()}-${generateId().slice(-6)}`,
    ascenseurId,
    contratId,
    motif,
    motifDetail,
    niveauUrgence,
    priorite,
    statut: StatutIntervention.NOUVEAU,
    delaiContractuelMinutes,
    dateDebutDecompteSLA: dateReceptionPremierTicket,
    dateLimiteSLA,
    dateCreation,
  };

  const etape: EtapeIntervention = {
    id: generateId(),
    interventionId: intervention.id,
    type: TypeEtapeIntervention.INTERVENTION_CREEE,
    dateHeure: dateCreation,
    origine: OrigineAction.SYSTEME,
  };

  return { intervention, etape };
}

/** Confirmation par le dispatch (NOUVEAU → A_AFFECTER), avant désignation d'un technicien. */
export function confirmerPourAffectation(
  intervention: Intervention
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.NOUVEAU) {
    throw new Error('Seule une intervention nouvelle peut être confirmée pour affectation');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.A_AFFECTER },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.COMMENTAIRE,
      dateHeure,
      commentaire: "Confirmée par le dispatch, en attente d'affectation",
      origine: OrigineAction.WEB,
    },
  };
}

/** Désigne un technicien (NOUVEAU ou A_AFFECTER → AFFECTE). */
export function affecterTechnicien(
  intervention: Intervention,
  technicienId: string,
  origine: OrigineAction = OrigineAction.WEB
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.NOUVEAU && intervention.statut !== StatutIntervention.A_AFFECTER) {
    throw new Error('Seule une intervention nouvelle ou à affecter peut recevoir un technicien');
  }
  const dateAffectation = new Date().toISOString();
  const intervention2: Intervention = {
    ...intervention,
    statut: StatutIntervention.AFFECTE,
    technicienId,
    dateAffectation,
  };
  const etape: EtapeIntervention = {
    id: generateId(),
    interventionId: intervention.id,
    type: TypeEtapeIntervention.TECHNICIEN_AFFECTE,
    dateHeure: dateAffectation,
    technicienId,
    origine,
  };
  return { intervention: intervention2, etape };
}

/** Le technicien accepte / se met en route (AFFECTE → PRIS_EN_CHARGE). */
export function prendreEnCharge(
  intervention: Intervention
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.AFFECTE) {
    throw new Error('Seule une intervention affectée peut être prise en charge');
  }
  if (!intervention.technicienId) {
    throw new Error('Aucun technicien affecté');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.PRIS_EN_CHARGE, datePriseEnCharge: dateHeure },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.PRISE_EN_CHARGE,
      dateHeure,
      technicienId: intervention.technicienId,
      origine: OrigineAction.MOBILE,
    },
  };
}

/**
 * Arrivée sur site (PRIS_EN_CHARGE → EN_COURS), section 24/25. Si l'accès
 * est refusé, `etatAppareilInitial` reste absent : on ne peut pas constater
 * un état qu'on n'a pas observé.
 */
export function demarrerIntervention(
  intervention: Intervention,
  accesRefuse: boolean,
  motifAccesRefuse?: string,
  etatAppareilInitial?: StatutAppareil
): { intervention: Intervention; etapes: EtapeIntervention[] } {
  if (intervention.statut !== StatutIntervention.PRIS_EN_CHARGE) {
    throw new Error('Seule une intervention prise en charge peut démarrer');
  }
  if (accesRefuse && !motifAccesRefuse) {
    throw new Error("Un motif de refus d'accès est requis");
  }

  const dateHeure = new Date().toISOString();
  const etapes: EtapeIntervention[] = [
    {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.ARRIVEE_SUR_SITE,
      dateHeure,
      technicienId: intervention.technicienId,
      origine: OrigineAction.MOBILE,
    },
  ];

  const intervention2: Intervention = accesRefuse
    ? { ...intervention, statut: StatutIntervention.EN_COURS, dateArriveeSite: dateHeure, accesRefuse: true, motifAccesRefuse }
    : { ...intervention, statut: StatutIntervention.EN_COURS, dateArriveeSite: dateHeure, etatAppareilInitial };

  if (accesRefuse) {
    etapes.push({
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.ACCES_REFUSE,
      dateHeure,
      commentaire: motifAccesRefuse,
      origine: OrigineAction.MOBILE,
    });
  } else if (etatAppareilInitial) {
    etapes.push({
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.ETAT_APPAREIL_CHANGE,
      dateHeure,
      etatAppareil: etatAppareilInitial,
      origine: OrigineAction.MOBILE,
    });
  }

  return { intervention: intervention2, etapes };
}

/** Travaux suspendus, pièce commandée (EN_COURS → EN_ATTENTE_DE_PIECE). */
export function mettreEnAttentePiece(
  intervention: Intervention,
  commentaire?: string
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.EN_COURS) {
    throw new Error('Seule une intervention en cours peut être mise en attente de pièce');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.EN_ATTENTE_DE_PIECE },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.MISE_EN_ATTENTE_PIECE,
      dateHeure,
      commentaire,
      origine: OrigineAction.MOBILE,
    },
  };
}

/** Pièce reçue ou rapport rejeté à corriger : reprise des travaux (→ EN_COURS). */
export function reprendreIntervention(
  intervention: Intervention
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.EN_ATTENTE_DE_PIECE && intervention.statut !== StatutIntervention.A_REPRENDRE) {
    throw new Error('Seule une intervention en attente de pièce ou à reprendre peut être relancée');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.EN_COURS },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.REPRISE,
      dateHeure,
      origine: OrigineAction.MOBILE,
    },
  };
}

/** Le technicien clôt son rapport terrain (EN_COURS → TERMINE). */
export function terminerIntervention(
  intervention: Intervention,
  rapportId: string,
  etatAppareilFinal: StatutAppareil,
  dureeInterventionMinutes: number
): { intervention: Intervention; etapes: EtapeIntervention[] } {
  if (intervention.statut !== StatutIntervention.EN_COURS) {
    throw new Error('Seule une intervention en cours peut être terminée');
  }
  const dateHeure = new Date().toISOString();
  const intervention2: Intervention = {
    ...intervention,
    statut: StatutIntervention.TERMINE,
    dateTerminee: dateHeure,
    etatAppareilFinal,
    dureeInterventionMinutes,
  };
  return {
    intervention: intervention2,
    etapes: [
      {
        id: generateId(),
        interventionId: intervention.id,
        type: TypeEtapeIntervention.RAPPORT_AJOUTE,
        dateHeure,
        rapportId,
        origine: OrigineAction.MOBILE,
      },
      {
        id: generateId(),
        interventionId: intervention.id,
        type: TypeEtapeIntervention.TERMINEE,
        dateHeure,
        origine: OrigineAction.MOBILE,
      },
    ],
  };
}

/** Transmission au back-office pour validation (TERMINE → A_VALIDER). */
export function soumettrePourValidation(
  intervention: Intervention
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.TERMINE) {
    throw new Error('Seule une intervention terminée peut être soumise à validation');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.A_VALIDER },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.COMMENTAIRE,
      dateHeure,
      commentaire: 'Transmise pour validation',
      origine: OrigineAction.SYSTEME,
    },
  };
}

/** Le superviseur rejette le rapport (A_VALIDER → A_REPRENDRE), à corriger sur le terrain. */
export function rejeterRapport(
  intervention: Intervention,
  commentaire: string
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.A_VALIDER) {
    throw new Error('Seule une intervention en attente de validation peut être rejetée');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.A_REPRENDRE },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.RAPPORT_REJETE,
      dateHeure,
      commentaire,
      origine: OrigineAction.WEB,
    },
  };
}

/**
 * Le superviseur valide le rapport : l'intervention est clôturée et
 * archivée (A_VALIDER → CLOTURE). CLOTURE signifie "validé", il n'y a pas
 * d'étape de clôture distincte de la validation.
 */
export function validerIntervention(
  intervention: Intervention
): { intervention: Intervention; etape: EtapeIntervention } {
  if (intervention.statut !== StatutIntervention.A_VALIDER) {
    throw new Error('Seule une intervention en attente de validation peut être clôturée');
  }
  const dateHeure = new Date().toISOString();
  return {
    intervention: { ...intervention, statut: StatutIntervention.CLOTURE, dateCloture: dateHeure, dateValidation: dateHeure },
    etape: {
      id: generateId(),
      interventionId: intervention.id,
      type: TypeEtapeIntervention.CLOTUREE,
      dateHeure,
      origine: OrigineAction.WEB,
    },
  };
}

/**
 * Réattribue une intervention à un autre technicien (bouton Web
 * "Réattribuer", section 8 ; mobile "Je ne peux pas traiter cette
 * intervention", section 34 ; drag & drop planning, section 11.2/11.3).
 */
export function reaffecter(
  intervention: Intervention,
  nouveauTechnicienId: string,
  motif: MotifReattribution,
  origine: OrigineAction,
  commentaire?: string,
  demandeurNom?: string
): { intervention: Intervention; reaffectation: Reaffectation; etape: EtapeIntervention } {
  if (intervention.statut === StatutIntervention.CLOTURE) {
    throw new Error('Une intervention clôturée ne peut plus être réaffectée');
  }

  const dateHeure = new Date().toISOString();
  const reaffectation: Reaffectation = {
    id: generateId(),
    cibleType: TypeCiblePlanning.INTERVENTION,
    cibleId: intervention.id,
    ancienTechnicienId: intervention.technicienId,
    nouveauTechnicienId,
    motif,
    commentaire,
    dateHeure,
    origine,
    demandeurNom,
  };

  // Un technicien déjà en cours de traitement retombe à AFFECTE : le nouveau
  // technicien doit reprendre à charge avant de continuer les travaux.
  const statutSuivant =
    intervention.statut === StatutIntervention.NOUVEAU
      ? StatutIntervention.A_AFFECTER
      : intervention.statut === StatutIntervention.AFFECTE || intervention.statut === StatutIntervention.PRIS_EN_CHARGE
        ? StatutIntervention.AFFECTE
        : intervention.statut;

  const intervention2: Intervention = { ...intervention, technicienId: nouveauTechnicienId, statut: statutSuivant };

  const etape: EtapeIntervention = {
    id: generateId(),
    interventionId: intervention.id,
    type: TypeEtapeIntervention.REATTRIBUEE,
    dateHeure,
    technicienId: nouveauTechnicienId,
    reaffectationId: reaffectation.id,
    origine,
  };

  return { intervention: intervention2, reaffectation, etape };
}

// ============================================================================
// CYCLE DE VIE D'UNE RÉSERVE CTQ (section 10.3)
// ============================================================================

/** A_TRAITER → PLANIFIEE : un technicien et une date sont fixés. */
export function planifierReserve(
  reserve: ReserveCTQ,
  technicienAssigneId: string,
  datePlanification: string
): { reserve: ReserveCTQ; evenement: EvenementReserve } {
  if (reserve.statut !== StatutReserve.A_TRAITER) {
    throw new Error('Seule une réserve à traiter peut être planifiée');
  }
  const reserve2: ReserveCTQ = { ...reserve, statut: StatutReserve.PLANIFIEE, technicienAssigneId, datePlanification };
  return {
    reserve: reserve2,
    evenement: {
      id: generateId(),
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.RESERVE_PLANIFIEE,
      dateHeure: new Date().toISOString(),
      ancienStatut: reserve.statut,
      nouveauStatut: reserve2.statut,
      technicienId: technicienAssigneId,
    },
  };
}

/** PLANIFIEE → EN_COURS : le technicien démarre le traitement sur site. */
export function demarrerTraitementReserve(
  reserve: ReserveCTQ
): { reserve: ReserveCTQ; evenement: EvenementReserve } {
  if (reserve.statut !== StatutReserve.PLANIFIEE) {
    throw new Error('Seule une réserve planifiée peut démarrer son traitement');
  }
  const reserve2: ReserveCTQ = { ...reserve, statut: StatutReserve.EN_COURS };
  return {
    reserve: reserve2,
    evenement: {
      id: generateId(),
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.TRAITEMENT_DEMARRE,
      dateHeure: new Date().toISOString(),
      ancienStatut: reserve.statut,
      nouveauStatut: reserve2.statut,
      technicienId: reserve.technicienAssigneId,
    },
  };
}

/**
 * EN_COURS → TRAITEE : au moins une photo "après" est requise (section 29,
 * photo obligatoire pour réserve CTQ).
 */
export function declarerReserveTraitee(
  reserve: ReserveCTQ,
  traitement: ReferenceTraitement,
  photosTraitementIds: string[],
  commentaireTechnicien?: string
): { reserve: ReserveCTQ; evenement: EvenementReserve } {
  if (reserve.statut !== StatutReserve.EN_COURS) {
    throw new Error('Seule une réserve en cours peut être déclarée traitée');
  }
  if (photosTraitementIds.length === 0) {
    throw new Error('Au moins une photo "après traitement" est requise pour une réserve CTQ');
  }
  const dateTraitement = new Date().toISOString();
  const reserve2: ReserveCTQ = {
    ...reserve,
    statut: StatutReserve.TRAITEE,
    traitement,
    photosTraitementIds,
    commentaireTechnicien,
    dateTraitement,
  };
  return {
    reserve: reserve2,
    evenement: {
      id: generateId(),
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.RESERVE_TRAITEE,
      dateHeure: dateTraitement,
      ancienStatut: reserve.statut,
      nouveauStatut: reserve2.statut,
      technicienId: reserve.technicienAssigneId,
      commentaire: commentaireTechnicien,
    },
  };
}

/** TRAITEE → A_CONTROLER : soumis à la contre-visite du bureau d'études. */
export function soumettreReservePourControle(
  reserve: ReserveCTQ
): { reserve: ReserveCTQ; evenement: EvenementReserve } {
  if (reserve.statut !== StatutReserve.TRAITEE) {
    throw new Error('Seule une réserve traitée peut être soumise pour contre-visite');
  }
  const reserve2: ReserveCTQ = { ...reserve, statut: StatutReserve.A_CONTROLER };
  return {
    reserve: reserve2,
    evenement: {
      id: generateId(),
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.RESERVE_A_CONTROLER,
      dateHeure: new Date().toISOString(),
      ancienStatut: reserve.statut,
      nouveauStatut: reserve2.statut,
    },
  };
}

/** A_CONTROLER → VALIDEE : contre-visite positive, réserve définitivement levée. */
export function validerReserve(
  reserve: ReserveCTQ,
  validePar: string,
  commentaireValidation?: string
): { reserve: ReserveCTQ; evenement: EvenementReserve } {
  if (reserve.statut !== StatutReserve.A_CONTROLER) {
    throw new Error('Seule une réserve soumise à contre-visite peut être validée');
  }
  const dateValidation = new Date().toISOString();
  const reserve2: ReserveCTQ = { ...reserve, statut: StatutReserve.VALIDEE, validePar, commentaireValidation, dateValidation };
  return {
    reserve: reserve2,
    evenement: {
      id: generateId(),
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.RESERVE_VALIDEE,
      dateHeure: dateValidation,
      ancienStatut: reserve.statut,
      nouveauStatut: reserve2.statut,
      commentaire: commentaireValidation,
    },
  };
}

/** A_CONTROLER → EN_COURS : contre-visite négative, la réserve rouvre. */
export function reouvrirReserve(
  reserve: ReserveCTQ,
  commentaire: string
): { reserve: ReserveCTQ; evenement: EvenementReserve } {
  if (reserve.statut !== StatutReserve.A_CONTROLER) {
    throw new Error('Seule une réserve en contre-visite peut être rouverte');
  }
  const reserve2: ReserveCTQ = { ...reserve, statut: StatutReserve.EN_COURS };
  return {
    reserve: reserve2,
    evenement: {
      id: generateId(),
      reserveId: reserve.id,
      typeEvenement: TypeEvenementReserve.RESERVE_REOUVERTE,
      dateHeure: new Date().toISOString(),
      ancienStatut: reserve.statut,
      nouveauStatut: reserve2.statut,
      commentaire,
    },
  };
}

/** Statut agrégé d'un contrôle CTQ, TOUJOURS dérivé de ses réserves (jamais saisi à la main). */
export function calculerStatutControle(controle: ControleCTQ, reserves: ReserveCTQ[]): StatutControleCTQ {
  const reservesLiees = reserves.filter((r) => r.controleId === controle.id);
  if (reservesLiees.length === 0) return StatutControleCTQ.REALISE_SANS_RESERVE;
  if (reservesLiees.every((r) => r.statut === StatutReserve.VALIDEE)) return StatutControleCTQ.SOLDE;
  if (reservesLiees.some((r) => r.statut === StatutReserve.A_CONTROLER)) return StatutControleCTQ.RESERVES_A_CONTROLER;
  if (reservesLiees.some((r) => r.statut === StatutReserve.EN_COURS || r.statut === StatutReserve.PLANIFIEE)) {
    return StatutControleCTQ.RESERVES_EN_COURS;
  }
  return StatutControleCTQ.RESERVES_A_TRAITER;
}

/** Une réserve validée n'est jamais en retard ; sinon comparée à son échéance. */
export function estReserveEnRetard(reserve: ReserveCTQ, maintenant: Date = new Date()): boolean {
  if (reserve.statut === StatutReserve.VALIDEE) return false;
  if (!reserve.dateEcheance) return false;
  return new Date(reserve.dateEcheance) < maintenant;
}
