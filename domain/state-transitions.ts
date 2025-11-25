/**
 * Logique métier - Transitions d'état des ascenseurs
 * Fonctions pures qui implémentent la machine à états stricte
 * 
 * Règles de transition :
 * - fonctionnel -> en_panne (déclarer panne)
 * - en_panne (en_cours_d_attribution) -> en_panne (attribue) via attribution technicien
 * - en_panne (attribue) -> en_cours_de_reparation (démarrer réparation)
 * - en_cours_de_reparation -> fonctionnel (clôturer réparation)
 * 
 * Toute autre transition est interdite et lève une erreur
 */

import {
  Ascenseur,
  EtatGlobal,
  SousEtatPanne,
  EvenementHistorique,
  TypeEvenement,
  Technicien,
  TransitionResult,
} from './types';

/**
 * Génère un ID unique pour un événement
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée un événement historique
 */
function createEvent(
  ascenseurId: string,
  type: TypeEvenement,
  technicienId?: string,
  commentaire?: string
): EvenementHistorique {
  return {
    id: generateEventId(),
    ascenseurId,
    typeEvenement: type,
    dateHeure: new Date().toISOString(),
    technicienId,
    commentaire,
  };
}

/**
 * TRANSITION 1: Déclarer une panne
 * 
 * Pré-conditions:
 * - etatGlobal doit être "fonctionnel"
 * 
 * Post-conditions:
 * - etatGlobal = "en_panne"
 * - sousEtatPanne = "en_cours_d_attribution"
 * - technicienAttribueId = undefined
 * - Crée un événement "panne_declaree"
 * 
 * @param ascenseur L'ascenseur actuellement fonctionnel
 * @param commentaire Description de la panne
 * @returns Le nouvel état et l'événement créé
 * @throws Error si la transition n'est pas autorisée
 */
export function declarerPanne(
  ascenseur: Ascenseur,
  commentaire: string
): TransitionResult {
  // Vérification stricte de la pré-condition
  if (ascenseur.etatGlobal !== EtatGlobal.FONCTIONNEL) {
    throw new Error(
      `Impossible de déclarer une panne: l'ascenseur doit être fonctionnel. État actuel: ${ascenseur.etatGlobal}`
    );
  }

  const nouvelAscenseur: Ascenseur = {
    ...ascenseur,
    etatGlobal: EtatGlobal.EN_PANNE,
    sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION,
    technicienAttribueId: undefined,
  };

  const evenement = createEvent(
    ascenseur.id,
    TypeEvenement.PANNE_DECLAREE,
    undefined,
    commentaire
  );

  return {
    ascenseur: nouvelAscenseur,
    evenements: [evenement],
  };
}

/**
 * TRANSITION 2: Attribuer un technicien à une panne
 * 
 * Pré-conditions:
 * - etatGlobal doit être "en_panne"
 * - sousEtatPanne doit être "en_cours_d_attribution"
 * 
 * Post-conditions:
 * - sousEtatPanne = "attribue"
 * - technicienAttribueId = technicienId
 * - Crée un événement "panne_attribuee"
 * 
 * @param ascenseur L'ascenseur en panne non attribué
 * @param technicienId L'ID du technicien à attribuer
 * @param technicien Les données du technicien (pour validation)
 * @returns Le nouvel état et l'événement créé
 * @throws Error si la transition n'est pas autorisée
 */
export function attribuerTechnicien(
  ascenseur: Ascenseur,
  technicienId: string,
  technicien: Technicien
): TransitionResult {
  // Vérifications strictes des pré-conditions
  if (ascenseur.etatGlobal !== EtatGlobal.EN_PANNE) {
    throw new Error(
      `Impossible d'attribuer un technicien: l'ascenseur doit être en panne. État actuel: ${ascenseur.etatGlobal}`
    );
  }

  if (ascenseur.sousEtatPanne !== SousEtatPanne.EN_COURS_D_ATTRIBUTION) {
    throw new Error(
      `Impossible d'attribuer un technicien: l'ascenseur doit être en attente d'attribution. Sous-état actuel: ${ascenseur.sousEtatPanne}`
    );
  }

  const nouvelAscenseur: Ascenseur = {
    ...ascenseur,
    sousEtatPanne: SousEtatPanne.ATTRIBUE,
    technicienAttribueId: technicienId,
  };

  const evenement = createEvent(
    ascenseur.id,
    TypeEvenement.PANNE_ATTRIBUEE,
    technicienId,
    `Panne attribuée à ${technicien.nomComplet}`
  );

  return {
    ascenseur: nouvelAscenseur,
    evenements: [evenement],
  };
}

/**
 * TRANSITION 3: Démarrer la réparation
 * 
 * Pré-conditions:
 * - etatGlobal doit être "en_panne"
 * - sousEtatPanne doit être "attribue"
 * - technicienAttribueId doit être défini
 * 
 * Post-conditions:
 * - etatGlobal = "en_cours_de_reparation"
 * - sousEtatPanne = undefined
 * - technicienAttribueId conservé
 * - Crée un événement "debut_reparation"
 * 
 * @param ascenseur L'ascenseur en panne avec technicien attribué
 * @returns Le nouvel état et l'événement créé
 * @throws Error si la transition n'est pas autorisée
 */
export function demarrerReparation(ascenseur: Ascenseur): TransitionResult {
  // Vérifications strictes des pré-conditions
  if (ascenseur.etatGlobal !== EtatGlobal.EN_PANNE) {
    throw new Error(
      `Impossible de démarrer la réparation: l'ascenseur doit être en panne. État actuel: ${ascenseur.etatGlobal}`
    );
  }

  if (ascenseur.sousEtatPanne !== SousEtatPanne.ATTRIBUE) {
    throw new Error(
      `Impossible de démarrer la réparation: un technicien doit être attribué. Sous-état actuel: ${ascenseur.sousEtatPanne}`
    );
  }

  if (!ascenseur.technicienAttribueId) {
    throw new Error(
      `Impossible de démarrer la réparation: aucun technicien attribué`
    );
  }

  const nouvelAscenseur: Ascenseur = {
    ...ascenseur,
    etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION,
    sousEtatPanne: undefined,
    technicienAttribueId: ascenseur.technicienAttribueId, // Conservé
  };

  const evenement = createEvent(
    ascenseur.id,
    TypeEvenement.DEBUT_REPARATION,
    ascenseur.technicienAttribueId,
    'Début de la réparation'
  );

  return {
    ascenseur: nouvelAscenseur,
    evenements: [evenement],
  };
}

/**
 * TRANSITION 4: Clôturer la réparation et remettre en service
 * 
 * Pré-conditions:
 * - etatGlobal doit être "en_cours_de_reparation"
 * - technicienAttribueId doit être défini
 * 
 * Post-conditions:
 * - etatGlobal = "fonctionnel"
 * - sousEtatPanne = undefined
 * - technicienAttribueId = undefined
 * - Crée deux événements: "fin_reparation" et "retour_fonctionnel"
 * 
 * @param ascenseur L'ascenseur en cours de réparation
 * @param commentaire Commentaire de clôture optionnel
 * @returns Le nouvel état et les événements créés
 * @throws Error si la transition n'est pas autorisée
 */
export function cloturerReparation(
  ascenseur: Ascenseur,
  commentaire?: string
): TransitionResult {
  // Vérifications strictes des pré-conditions
  if (ascenseur.etatGlobal !== EtatGlobal.EN_COURS_DE_REPARATION) {
    throw new Error(
      `Impossible de clôturer la réparation: l'ascenseur doit être en cours de réparation. État actuel: ${ascenseur.etatGlobal}`
    );
  }

  if (!ascenseur.technicienAttribueId) {
    throw new Error(
      `Impossible de clôturer la réparation: aucun technicien assigné`
    );
  }

  const technicienId = ascenseur.technicienAttribueId;

  const nouvelAscenseur: Ascenseur = {
    ...ascenseur,
    etatGlobal: EtatGlobal.FONCTIONNEL,
    sousEtatPanne: undefined,
    technicienAttribueId: undefined,
  };

  const evenements: EvenementHistorique[] = [
    createEvent(
      ascenseur.id,
      TypeEvenement.FIN_REPARATION,
      technicienId,
      commentaire || 'Réparation terminée'
    ),
    createEvent(
      ascenseur.id,
      TypeEvenement.RETOUR_FONCTIONNEL,
      technicienId,
      'Ascenseur remis en service'
    ),
  ];

  return {
    ascenseur: nouvelAscenseur,
    evenements,
  };
}

/**
 * Vérifie si une transition d'état est possible
 * 
 * @param ascenseur L'ascenseur
 * @param nouvelEtatGlobal L'état cible
 * @returns true si la transition est autorisée
 */
export function canTransitionTo(
  ascenseur: Ascenseur,
  nouvelEtatGlobal: EtatGlobal
): boolean {
  const etat = ascenseur.etatGlobal;

  // Fonctionnel -> En panne
  if (etat === EtatGlobal.FONCTIONNEL && nouvelEtatGlobal === EtatGlobal.EN_PANNE) {
    return true;
  }

  // En panne (attribue) -> En cours de réparation
  if (
    etat === EtatGlobal.EN_PANNE &&
    nouvelEtatGlobal === EtatGlobal.EN_COURS_DE_REPARATION &&
    ascenseur.sousEtatPanne === SousEtatPanne.ATTRIBUE &&
    ascenseur.technicienAttribueId
  ) {
    return true;
  }

  // En cours de réparation -> Fonctionnel
  if (
    etat === EtatGlobal.EN_COURS_DE_REPARATION &&
    nouvelEtatGlobal === EtatGlobal.FONCTIONNEL &&
    ascenseur.technicienAttribueId
  ) {
    return true;
  }

  return false;
}

/**
 * Retourne le message d'erreur approprié pour une transition interdite
 * 
 * @param ascenseur L'ascenseur
 * @param nouvelEtatGlobal L'état cible
 * @returns Message d'erreur explicite
 */
export function getTransitionErrorMessage(
  ascenseur: Ascenseur,
  nouvelEtatGlobal: EtatGlobal
): string {
  const etat = ascenseur.etatGlobal;

  if (etat === nouvelEtatGlobal) {
    return `L'ascenseur est déjà à l'état: ${etat}`;
  }

  if (etat === EtatGlobal.EN_PANNE && nouvelEtatGlobal === EtatGlobal.EN_COURS_DE_REPARATION) {
    if (ascenseur.sousEtatPanne !== SousEtatPanne.ATTRIBUE) {
      return 'Un technicien doit d\'abord être attribué à cette panne';
    }
    if (!ascenseur.technicienAttribueId) {
      return 'Aucun technicien n\'est attribué';
    }
  }

  return `Transition interdite de ${etat} vers ${nouvelEtatGlobal}`;
}
