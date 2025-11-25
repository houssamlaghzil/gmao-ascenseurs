/**
 * Logique métier pour les transitions d'état des ascenseurs
 * Contient toutes les règles de validation et de transition
 */

import {
  Ascenseur,
  EtatGlobal,
  SousEtatPanne,
  TypeEvenement,
  EvenementHistorique,
  Technicien,
} from './types';

/**
 * Déclare une panne sur un ascenseur fonctionnel
 * @throws Error si l'ascenseur n'est pas fonctionnel
 */
export function declarerPanne(
  ascenseur: Ascenseur,
  commentaire?: string
): { ascenseur: Ascenseur; evenement: EvenementHistorique } {
  if (ascenseur.etatGlobal !== EtatGlobal.FONCTIONNEL) {
    throw new Error('Seul un ascenseur fonctionnel peut avoir une panne déclarée');
  }

  const ascenseurModifie: Ascenseur = {
    ...ascenseur,
    etatGlobal: EtatGlobal.EN_PANNE,
    sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION,
    technicienAttribueId: undefined,
  };

  const evenement: EvenementHistorique = {
    id: generateId(),
    ascenseurId: ascenseur.id,
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date().toISOString(),
    commentaire,
  };

  return { ascenseur: ascenseurModifie, evenement };
}

/**
 * Attribue un technicien à une panne
 * @throws Error si l'ascenseur n'est pas en panne ou si déjà attribué
 */
export function attribuerTechnicien(
  ascenseur: Ascenseur,
  technicienId: string,
  technicien: Technicien
): { ascenseur: Ascenseur; evenement: EvenementHistorique } {
  if (ascenseur.etatGlobal !== EtatGlobal.EN_PANNE) {
    throw new Error('Seul un ascenseur en panne peut avoir un technicien attribué');
  }

  if (ascenseur.sousEtatPanne !== SousEtatPanne.EN_COURS_D_ATTRIBUTION) {
    throw new Error('Cette panne a déjà un technicien attribué');
  }

  const ascenseurModifie: Ascenseur = {
    ...ascenseur,
    sousEtatPanne: SousEtatPanne.ATTRIBUE,
    technicienAttribueId: technicienId,
  };

  const evenement: EvenementHistorique = {
    id: generateId(),
    ascenseurId: ascenseur.id,
    typeEvenement: TypeEvenement.PANNE_ATTRIBUEE,
    dateHeure: new Date().toISOString(),
    commentaire: `Panne attribuée à ${technicien.nomComplet}`,
    technicienId,
  };

  return { ascenseur: ascenseurModifie, evenement };
}

/**
 * Démarre une réparation (passage à l'état "en_cours_de_reparation")
 * @throws Error si pas en panne ou si aucun technicien attribué
 */
export function demarrerReparation(
  ascenseur: Ascenseur
): { ascenseur: Ascenseur; evenement: EvenementHistorique } {
  if (ascenseur.etatGlobal !== EtatGlobal.EN_PANNE) {
    throw new Error('Seul un ascenseur en panne peut voir sa réparation démarrée');
  }

  if (ascenseur.sousEtatPanne !== SousEtatPanne.ATTRIBUE) {
    throw new Error('Un technicien doit être attribué avant de démarrer la réparation');
  }

  if (!ascenseur.technicienAttribueId) {
    throw new Error('Aucun technicien attribué');
  }

  const ascenseurModifie: Ascenseur = {
    ...ascenseur,
    etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION,
    sousEtatPanne: undefined,
  };

  const evenement: EvenementHistorique = {
    id: generateId(),
    ascenseurId: ascenseur.id,
    typeEvenement: TypeEvenement.DEBUT_REPARATION,
    dateHeure: new Date().toISOString(),
    commentaire: 'Début de la réparation',
    technicienId: ascenseur.technicienAttribueId,
  };

  return { ascenseur: ascenseurModifie, evenement };
}

/**
 * Clôture une réparation et remet l'ascenseur en service
 * @throws Error si l'ascenseur n'est pas en cours de réparation
 */
export function cloturerReparation(
  ascenseur: Ascenseur,
  commentaire?: string
): { ascenseur: Ascenseur; evenements: EvenementHistorique[] } {
  if (ascenseur.etatGlobal !== EtatGlobal.EN_COURS_DE_REPARATION) {
    throw new Error('Seul un ascenseur en cours de réparation peut être clôturé');
  }

  const technicienId = ascenseur.technicienAttribueId;

  const ascenseurModifie: Ascenseur = {
    ...ascenseur,
    etatGlobal: EtatGlobal.FONCTIONNEL,
    sousEtatPanne: undefined,
    technicienAttribueId: undefined,
  };

  const evenements: EvenementHistorique[] = [
    {
      id: generateId(),
      ascenseurId: ascenseur.id,
      typeEvenement: TypeEvenement.FIN_REPARATION,
      dateHeure: new Date().toISOString(),
      commentaire: commentaire || 'Réparation terminée',
      technicienId,
    },
    {
      id: generateId(),
      ascenseurId: ascenseur.id,
      typeEvenement: TypeEvenement.RETOUR_FONCTIONNEL,
      dateHeure: new Date().toISOString(),
      commentaire: 'Ascenseur remis en service',
    },
  ];

  return { ascenseur: ascenseurModifie, evenements };
}

/**
 * Ajoute un commentaire dans l'historique
 */
export function ajouterCommentaire(
  ascenseurId: string,
  commentaire: string,
  technicienId?: string
): EvenementHistorique {
  return {
    id: generateId(),
    ascenseurId,
    typeEvenement: TypeEvenement.COMMENTAIRE,
    dateHeure: new Date().toISOString(),
    commentaire,
    technicienId,
  };
}

/**
 * Génère un ID unique simple pour la démo
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
