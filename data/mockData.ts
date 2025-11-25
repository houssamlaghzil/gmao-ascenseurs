/**
 * Données mockées pour la démo GMAO Ascenseurs
 * Toutes les données sont en mémoire et réinitialisées à chaque redémarrage
 * 
 * Distribution conçue pour une démo waouh :
 * - 3 parcs variés (résidentiel, tertiaire, commercial)
 * - 15 ascenseurs avec états variés
 * - Scores de risque distribués pour montrer la maintenance prédictive
 * - Historique rempli pour le calcul de risque
 */

import {
  ParcAscenseurs,
  Ascenseur,
  Technicien,
  ParcTechnicienAssignment,
  EvenementHistorique,
  EtatGlobal,
  SousEtatPanne,
  TypeEvenement,
  TypeParc,
} from '@/domain/types';

// ========== PARCS D'ASCENSEURS ==========

export const parcs: ParcAscenseurs[] = [
  {
    id: 'parc-1',
    nom: 'Parc Centre Ville',
    description: 'Ensemble des ascenseurs du centre-ville commercial',
    ville: 'Lyon',
    adresse: '15 Place Bellecour, 69002 Lyon',
    type: TypeParc.COMMERCIAL,
  },
  {
    id: 'parc-2',
    nom: 'Parc Résidentiel Nord',
    description: 'Ascenseurs des résidences privées de la zone nord',
    ville: 'Lyon',
    adresse: 'Quartier Croix-Rousse, 69004 Lyon',
    type: TypeParc.RESIDENTIEL,
  },
  {
    id: 'parc-3',
    nom: 'Parc Tertiaire Part-Dieu',
    description: 'Tours de bureaux et immeubles professionnels',
    ville: 'Villeurbanne',
    adresse: 'Zone Part-Dieu, 69100 Villeurbanne',
    type: TypeParc.TERTIAIRE,
  },
];

// Techniciens
export const techniciens: Technicien[] = [
  {
    id: 'tech-1',
    nomComplet: 'Jean Dupont',
    specialite: 'Ascenseurs hydrauliques',
    disponible: true,
  },
  {
    id: 'tech-2',
    nomComplet: 'Marie Martin',
    specialite: 'Ascenseurs électriques',
    disponible: false,
  },
  {
    id: 'tech-3',
    nomComplet: 'Pierre Durand',
    specialite: 'Tous types d\'ascenseurs',
    disponible: true,
  },
  {
    id: 'tech-4',
    nomComplet: 'Sophie Bernard',
    specialite: 'Ascenseurs haute vitesse',
    disponible: true,
  },
  {
    id: 'tech-5',
    nomComplet: 'Luc Moreau',
    specialite: 'Maintenance préventive',
    disponible: false,
  },
  {
    id: 'tech-6',
    nomComplet: 'Claire Petit',
    specialite: 'Ascenseurs électriques et hydrauliques',
    disponible: true,
  },
  {
    id: 'tech-7',
    nomComplet: 'Thomas Rousseau',
    specialite: 'Modernisation et dépannage',
    disponible: true,
  },
];

// Assignments Parc-Technicien (many-to-many)
export const parcTechnicienAssignments: ParcTechnicienAssignment[] = [
  // Parc Centre Ville
  { parcId: 'parc-1', technicienId: 'tech-1' },
  { parcId: 'parc-1', technicienId: 'tech-2' },
  { parcId: 'parc-1', technicienId: 'tech-3' },
  // Parc Résidentiel
  { parcId: 'parc-2', technicienId: 'tech-3' },
  { parcId: 'parc-2', technicienId: 'tech-4' },
  { parcId: 'parc-2', technicienId: 'tech-5' },
  { parcId: 'parc-2', technicienId: 'tech-6' },
  // Parc Tertiaire
  { parcId: 'parc-3', technicienId: 'tech-2' },
  { parcId: 'parc-3', technicienId: 'tech-4' },
  { parcId: 'parc-3', technicienId: 'tech-7' },
];

// Ascenseurs
export const ascenseurs: Ascenseur[] = [
  // Parc Centre Ville (parc-1)
  {
    id: 'asc-1',
    nom: 'Ascenseur A1',
    referenceTechnique: 'CV-A1-2020',
    parcId: 'parc-1',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-2',
    nom: 'Ascenseur A2',
    referenceTechnique: 'CV-A2-2019',
    parcId: 'parc-1',
    etatGlobal: EtatGlobal.EN_PANNE,
    sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION,
  },
  {
    id: 'asc-3',
    nom: 'Ascenseur B1',
    referenceTechnique: 'CV-B1-2021',
    parcId: 'parc-1',
    etatGlobal: EtatGlobal.EN_PANNE,
    sousEtatPanne: SousEtatPanne.ATTRIBUE,
    technicienAttribueId: 'tech-2',
  },
  {
    id: 'asc-4',
    nom: 'Ascenseur B2',
    referenceTechnique: 'CV-B2-2018',
    parcId: 'parc-1',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-5',
    nom: 'Ascenseur C1',
    referenceTechnique: 'CV-C1-2022',
    parcId: 'parc-1',
    etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION,
    technicienAttribueId: 'tech-1',
  },

  // Parc Résidentiel (parc-2)
  {
    id: 'asc-6',
    nom: 'Résidence A - Asc 1',
    referenceTechnique: 'RES-A1-2017',
    parcId: 'parc-2',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-7',
    nom: 'Résidence A - Asc 2',
    referenceTechnique: 'RES-A2-2017',
    parcId: 'parc-2',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-8',
    nom: 'Résidence B - Asc 1',
    referenceTechnique: 'RES-B1-2020',
    parcId: 'parc-2',
    etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION,
    technicienAttribueId: 'tech-5',
  },
  {
    id: 'asc-9',
    nom: 'Résidence C - Asc 1',
    referenceTechnique: 'RES-C1-2019',
    parcId: 'parc-2',
    etatGlobal: EtatGlobal.EN_PANNE,
    sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION,
  },
  {
    id: 'asc-10',
    nom: 'Résidence D - Asc 1',
    referenceTechnique: 'RES-D1-2021',
    parcId: 'parc-2',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },

  // Parc Tertiaire (parc-3)
  {
    id: 'asc-11',
    nom: 'Tour A - Ascenseur 1',
    referenceTechnique: 'TER-A1-2023',
    parcId: 'parc-3',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-12',
    nom: 'Tour A - Ascenseur 2',
    referenceTechnique: 'TER-A2-2023',
    parcId: 'parc-3',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-13',
    nom: 'Tour B - Ascenseur 1',
    referenceTechnique: 'TER-B1-2022',
    parcId: 'parc-3',
    etatGlobal: EtatGlobal.EN_PANNE,
    sousEtatPanne: SousEtatPanne.ATTRIBUE,
    technicienAttribueId: 'tech-7',
  },
  {
    id: 'asc-14',
    nom: 'Tour B - Ascenseur 2',
    referenceTechnique: 'TER-B2-2022',
    parcId: 'parc-3',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
  {
    id: 'asc-15',
    nom: 'Immeuble C - Ascenseur 1',
    referenceTechnique: 'TER-C1-2020',
    parcId: 'parc-3',
    etatGlobal: EtatGlobal.FONCTIONNEL,
  },
];

// Historique d'événements prérempli
export const evenementsHistoriques: EvenementHistorique[] = [
  // Historique pour asc-2 (en panne, non attribué)
  {
    id: 'evt-1',
    ascenseurId: 'asc-2',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
    commentaire: 'Blocage entre les étages 3 et 4',
  },

  // Historique pour asc-3 (en panne, attribué)
  {
    id: 'evt-2',
    ascenseurId: 'asc-3',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Il y a 5h
    commentaire: 'Bruit anormal au niveau du moteur',
  },
  {
    id: 'evt-3',
    ascenseurId: 'asc-3',
    typeEvenement: TypeEvenement.PANNE_ATTRIBUEE,
    dateHeure: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Il y a 4h
    commentaire: 'Panne attribuée à Marie Martin',
    technicienId: 'tech-2',
  },

  // Historique pour asc-5 (en cours de réparation)
  {
    id: 'evt-4',
    ascenseurId: 'asc-5',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Il y a 24h
    commentaire: 'Dysfonctionnement des portes automatiques',
  },
  {
    id: 'evt-5',
    ascenseurId: 'asc-5',
    typeEvenement: TypeEvenement.PANNE_ATTRIBUEE,
    dateHeure: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // Il y a 23h
    commentaire: 'Panne attribuée à Jean Dupont',
    technicienId: 'tech-1',
  },
  {
    id: 'evt-6',
    ascenseurId: 'asc-5',
    typeEvenement: TypeEvenement.DEBUT_REPARATION,
    dateHeure: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // Il y a 22h
    commentaire: 'Début de la réparation',
    technicienId: 'tech-1',
  },

  // Historique pour asc-8 (en cours de réparation)
  {
    id: 'evt-7',
    ascenseurId: 'asc-8',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // Il y a 8h
    commentaire: 'Problème électrique',
  },
  {
    id: 'evt-8',
    ascenseurId: 'asc-8',
    typeEvenement: TypeEvenement.PANNE_ATTRIBUEE,
    dateHeure: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // Il y a 7h
    commentaire: 'Panne attribuée à Luc Moreau',
    technicienId: 'tech-5',
  },
  {
    id: 'evt-9',
    ascenseurId: 'asc-8',
    typeEvenement: TypeEvenement.DEBUT_REPARATION,
    dateHeure: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // Il y a 6h
    commentaire: 'Début de la réparation',
    technicienId: 'tech-5',
  },

  // Historique pour asc-9 (en panne, non attribué)
  {
    id: 'evt-10',
    ascenseurId: 'asc-9',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Il y a 1h
    commentaire: 'Arrêt d\'urgence activé suite à une anomalie',
  },

  // Historique pour asc-13 (en panne, attribué)
  {
    id: 'evt-11',
    ascenseurId: 'asc-13',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Il y a 3h
    commentaire: 'Vitesse anormalement lente',
  },
  {
    id: 'evt-12',
    ascenseurId: 'asc-13',
    typeEvenement: TypeEvenement.PANNE_ATTRIBUEE,
    dateHeure: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    commentaire: 'Panne attribuée à Thomas Rousseau',
    technicienId: 'tech-7',
  },

  // Historique d'un ascenseur fonctionnel avec historique de réparation passée
  {
    id: 'evt-13',
    ascenseurId: 'asc-1',
    typeEvenement: TypeEvenement.PANNE_DECLAREE,
    dateHeure: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
    commentaire: 'Maintenance préventive programmée',
  },
  {
    id: 'evt-14',
    ascenseurId: 'asc-1',
    typeEvenement: TypeEvenement.PANNE_ATTRIBUEE,
    dateHeure: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    commentaire: 'Panne attribuée à Jean Dupont',
    technicienId: 'tech-1',
  },
  {
    id: 'evt-15',
    ascenseurId: 'asc-1',
    typeEvenement: TypeEvenement.DEBUT_REPARATION,
    dateHeure: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    commentaire: 'Début de la réparation',
    technicienId: 'tech-1',
  },
  {
    id: 'evt-16',
    ascenseurId: 'asc-1',
    typeEvenement: TypeEvenement.FIN_REPARATION,
    dateHeure: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    commentaire: 'Réparation terminée',
    technicienId: 'tech-1',
  },
  {
    id: 'evt-17',
    ascenseurId: 'asc-1',
    typeEvenement: TypeEvenement.RETOUR_FONCTIONNEL,
    dateHeure: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    commentaire: 'Ascenseur remis en service',
  },
];
