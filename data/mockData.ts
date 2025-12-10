/**
 * Données mockées pour la démo GMAO Ascenseurs
 * Toutes les données sont en mémoire et réinitialisées à chaque redémarrage
 * 
 * Distribution conçue pour une démo waouh :
 * - 10 parcs variés (résidentiel, tertiaire, commercial) dans plusieurs villes
 * - 60+ ascenseurs avec états variés
 * - 15 techniciens avec spécialités variées
 * - 250+ événements sur 90 jours pour historique riche
 * - Scores de risque distribués pour montrer la maintenance prédictive
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

// ========== HELPERS POUR GÉNÉRATION ==========

const JOUR_MS = 24 * 60 * 60 * 1000;
const HEURE_MS = 60 * 60 * 1000;

function dateIl(jours: number, heures: number = 0): string {
  return new Date(Date.now() - jours * JOUR_MS - heures * HEURE_MS).toISOString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ========== PARCS D'ASCENSEURS (10 parcs) ==========

export const parcs: ParcAscenseurs[] = [
  {
    id: 'parc-1',
    nom: 'Centre Commercial Confluence',
    description: 'Centre commercial moderne avec forte affluence',
    ville: 'Lyon',
    adresse: '112 Cours Charlemagne, 69002 Lyon',
    type: TypeParc.COMMERCIAL,
  },
  {
    id: 'parc-2',
    nom: 'Résidence Les Jardins',
    description: 'Ensemble résidentiel de standing',
    ville: 'Lyon',
    adresse: 'Quartier Croix-Rousse, 69004 Lyon',
    type: TypeParc.RESIDENTIEL,
  },
  {
    id: 'parc-3',
    nom: 'Tour Oxygène',
    description: 'Tour de bureaux 28 étages - usage intensif',
    ville: 'Lyon',
    adresse: '10 Boulevard Vivier Merle, 69003 Lyon',
    type: TypeParc.TERTIAIRE,
  },
  {
    id: 'parc-4',
    nom: 'Galeries Lafayette Haussmann',
    description: 'Grand magasin historique - très haute fréquentation',
    ville: 'Paris',
    adresse: '40 Boulevard Haussmann, 75009 Paris',
    type: TypeParc.COMMERCIAL,
  },
  {
    id: 'parc-5',
    nom: 'La Défense - Tour First',
    description: 'Plus haute tour de bureaux de France',
    ville: 'Paris',
    adresse: '1 Place des Saisons, 92400 Courbevoie',
    type: TypeParc.TERTIAIRE,
  },
  {
    id: 'parc-6',
    nom: 'Résidence Vieux-Port',
    description: 'Immeubles résidentiels vue mer',
    ville: 'Marseille',
    adresse: 'Quai du Port, 13002 Marseille',
    type: TypeParc.RESIDENTIEL,
  },
  {
    id: 'parc-7',
    nom: 'Euratlantique Business',
    description: 'Nouveau quartier d\'affaires',
    ville: 'Bordeaux',
    adresse: 'Rue Amédée Saint-Germain, 33000 Bordeaux',
    type: TypeParc.TERTIAIRE,
  },
  {
    id: 'parc-8',
    nom: 'Centre Commercial Euralille',
    description: 'Plus grand centre commercial du Nord',
    ville: 'Lille',
    adresse: '100 Centre Commercial, 59777 Euralille',
    type: TypeParc.COMMERCIAL,
  },
  {
    id: 'parc-9',
    nom: 'Résidence Antigone',
    description: 'Quartier néo-classique résidentiel',
    ville: 'Montpellier',
    adresse: 'Place du Nombre d\'Or, 34000 Montpellier',
    type: TypeParc.RESIDENTIEL,
  },
  {
    id: 'parc-10',
    nom: 'Aéroport Nice Côte d\'Azur',
    description: 'Terminal 1 et 2 - usage 24/7',
    ville: 'Nice',
    adresse: 'Promenade des Anglais, 06200 Nice',
    type: TypeParc.COMMERCIAL,
  },
];

// ========== TECHNICIENS (15 techniciens) ==========

export const techniciens: Technicien[] = [
  { id: 'tech-1', nomComplet: 'Jean Dupont', specialite: 'Ascenseurs hydrauliques', disponible: true },
  { id: 'tech-2', nomComplet: 'Marie Martin', specialite: 'Ascenseurs électriques', disponible: false },
  { id: 'tech-3', nomComplet: 'Pierre Durand', specialite: 'Tous types', disponible: true },
  { id: 'tech-4', nomComplet: 'Sophie Bernard', specialite: 'Haute vitesse', disponible: true },
  { id: 'tech-5', nomComplet: 'Luc Moreau', specialite: 'Maintenance préventive', disponible: false },
  { id: 'tech-6', nomComplet: 'Claire Petit', specialite: 'Électriques & hydrauliques', disponible: true },
  { id: 'tech-7', nomComplet: 'Thomas Rousseau', specialite: 'Modernisation', disponible: true },
  { id: 'tech-8', nomComplet: 'Émilie Lefebvre', specialite: 'Diagnostics avancés', disponible: true },
  { id: 'tech-9', nomComplet: 'Antoine Mercier', specialite: 'Ascenseurs panoramiques', disponible: false },
  { id: 'tech-10', nomComplet: 'Camille Dubois', specialite: 'Systèmes de sécurité', disponible: true },
  { id: 'tech-11', nomComplet: 'Julien Fournier', specialite: 'Cabines et portes', disponible: true },
  { id: 'tech-12', nomComplet: 'Léa Girard', specialite: 'Électronique embarquée', disponible: false },
  { id: 'tech-13', nomComplet: 'Maxime Bonnet', specialite: 'Urgences 24/7', disponible: true },
  { id: 'tech-14', nomComplet: 'Chloé Lambert', specialite: 'Mise aux normes', disponible: true },
  { id: 'tech-15', nomComplet: 'Nicolas Roux', specialite: 'Grandes hauteurs', disponible: true },
];

// ========== ASSIGNMENTS PARC-TECHNICIEN ==========

export const parcTechnicienAssignments: ParcTechnicienAssignment[] = [
  // Lyon - Confluence
  { parcId: 'parc-1', technicienId: 'tech-1' },
  { parcId: 'parc-1', technicienId: 'tech-2' },
  { parcId: 'parc-1', technicienId: 'tech-3' },
  // Lyon - Résidence
  { parcId: 'parc-2', technicienId: 'tech-3' },
  { parcId: 'parc-2', technicienId: 'tech-6' },
  // Lyon - Tour Oxygène
  { parcId: 'parc-3', technicienId: 'tech-4' },
  { parcId: 'parc-3', technicienId: 'tech-7' },
  { parcId: 'parc-3', technicienId: 'tech-15' },
  // Paris - Galeries Lafayette
  { parcId: 'parc-4', technicienId: 'tech-8' },
  { parcId: 'parc-4', technicienId: 'tech-11' },
  { parcId: 'parc-4', technicienId: 'tech-13' },
  // Paris - La Défense
  { parcId: 'parc-5', technicienId: 'tech-4' },
  { parcId: 'parc-5', technicienId: 'tech-9' },
  { parcId: 'parc-5', technicienId: 'tech-15' },
  // Marseille
  { parcId: 'parc-6', technicienId: 'tech-5' },
  { parcId: 'parc-6', technicienId: 'tech-10' },
  // Bordeaux
  { parcId: 'parc-7', technicienId: 'tech-7' },
  { parcId: 'parc-7', technicienId: 'tech-12' },
  { parcId: 'parc-7', technicienId: 'tech-14' },
  // Lille
  { parcId: 'parc-8', technicienId: 'tech-2' },
  { parcId: 'parc-8', technicienId: 'tech-8' },
  { parcId: 'parc-8', technicienId: 'tech-11' },
  // Montpellier
  { parcId: 'parc-9', technicienId: 'tech-6' },
  { parcId: 'parc-9', technicienId: 'tech-10' },
  // Nice - Aéroport
  { parcId: 'parc-10', technicienId: 'tech-13' },
  { parcId: 'parc-10', technicienId: 'tech-14' },
  { parcId: 'parc-10', technicienId: 'tech-15' },
];

// ========== ASCENSEURS (64 ascenseurs) ==========

export const ascenseurs: Ascenseur[] = [
  // === PARC 1 : Lyon Confluence (8 ascenseurs) ===
  { id: 'asc-1', nom: 'Confluence A1', referenceTechnique: 'LYC-A1-2020', parcId: 'parc-1', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-2', nom: 'Confluence A2', referenceTechnique: 'LYC-A2-2020', parcId: 'parc-1', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-3', nom: 'Confluence B1', referenceTechnique: 'LYC-B1-2019', parcId: 'parc-1', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION },
  { id: 'asc-4', nom: 'Confluence B2', referenceTechnique: 'LYC-B2-2019', parcId: 'parc-1', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-5', nom: 'Confluence C1', referenceTechnique: 'LYC-C1-2021', parcId: 'parc-1', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-1' },
  { id: 'asc-6', nom: 'Confluence C2', referenceTechnique: 'LYC-C2-2021', parcId: 'parc-1', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-7', nom: 'Confluence Panoramique', referenceTechnique: 'LYC-P1-2022', parcId: 'parc-1', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-8', nom: 'Confluence Service', referenceTechnique: 'LYC-S1-2018', parcId: 'parc-1', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.ATTRIBUE, technicienAttribueId: 'tech-2' },

  // === PARC 2 : Lyon Résidence (5 ascenseurs) ===
  { id: 'asc-9', nom: 'Jardins Bât A', referenceTechnique: 'LYR-A1-2017', parcId: 'parc-2', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-10', nom: 'Jardins Bât B', referenceTechnique: 'LYR-B1-2017', parcId: 'parc-2', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-11', nom: 'Jardins Bât C', referenceTechnique: 'LYR-C1-2018', parcId: 'parc-2', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-6' },
  { id: 'asc-12', nom: 'Jardins Bât D', referenceTechnique: 'LYR-D1-2019', parcId: 'parc-2', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-13', nom: 'Jardins Bât E', referenceTechnique: 'LYR-E1-2020', parcId: 'parc-2', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 3 : Lyon Tour Oxygène (10 ascenseurs - usage intensif) ===
  { id: 'asc-14', nom: 'Oxygène Express 1', referenceTechnique: 'OXY-E1-2022', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-15', nom: 'Oxygène Express 2', referenceTechnique: 'OXY-E2-2022', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-16', nom: 'Oxygène Express 3', referenceTechnique: 'OXY-E3-2022', parcId: 'parc-3', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.ATTRIBUE, technicienAttribueId: 'tech-4' },
  { id: 'asc-17', nom: 'Oxygène Express 4', referenceTechnique: 'OXY-E4-2022', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-18', nom: 'Oxygène Local 1', referenceTechnique: 'OXY-L1-2021', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-19', nom: 'Oxygène Local 2', referenceTechnique: 'OXY-L2-2021', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-20', nom: 'Oxygène Local 3', referenceTechnique: 'OXY-L3-2021', parcId: 'parc-3', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-7' },
  { id: 'asc-21', nom: 'Oxygène Parking 1', referenceTechnique: 'OXY-P1-2020', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-22', nom: 'Oxygène Parking 2', referenceTechnique: 'OXY-P2-2020', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-23', nom: 'Oxygène VIP', referenceTechnique: 'OXY-V1-2023', parcId: 'parc-3', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 4 : Paris Galeries Lafayette (8 ascenseurs) ===
  { id: 'asc-24', nom: 'Lafayette Principal 1', referenceTechnique: 'GLH-P1-2019', parcId: 'parc-4', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-25', nom: 'Lafayette Principal 2', referenceTechnique: 'GLH-P2-2019', parcId: 'parc-4', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-26', nom: 'Lafayette Principal 3', referenceTechnique: 'GLH-P3-2019', parcId: 'parc-4', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION },
  { id: 'asc-27', nom: 'Lafayette Coupole 1', referenceTechnique: 'GLH-C1-2020', parcId: 'parc-4', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-28', nom: 'Lafayette Coupole 2', referenceTechnique: 'GLH-C2-2020', parcId: 'parc-4', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-29', nom: 'Lafayette Service 1', referenceTechnique: 'GLH-S1-2018', parcId: 'parc-4', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-8' },
  { id: 'asc-30', nom: 'Lafayette Service 2', referenceTechnique: 'GLH-S2-2018', parcId: 'parc-4', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-31', nom: 'Lafayette Terrasse', referenceTechnique: 'GLH-T1-2021', parcId: 'parc-4', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 5 : Paris La Défense Tour First (12 ascenseurs) ===
  { id: 'asc-32', nom: 'First Sky 1', referenceTechnique: 'TF-S1-2023', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-33', nom: 'First Sky 2', referenceTechnique: 'TF-S2-2023', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-34', nom: 'First Sky 3', referenceTechnique: 'TF-S3-2023', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-35', nom: 'First Sky 4', referenceTechnique: 'TF-S4-2023', parcId: 'parc-5', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.ATTRIBUE, technicienAttribueId: 'tech-15' },
  { id: 'asc-36', nom: 'First Mid 1', referenceTechnique: 'TF-M1-2022', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-37', nom: 'First Mid 2', referenceTechnique: 'TF-M2-2022', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-38', nom: 'First Mid 3', referenceTechnique: 'TF-M3-2022', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-39', nom: 'First Mid 4', referenceTechnique: 'TF-M4-2022', parcId: 'parc-5', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-4' },
  { id: 'asc-40', nom: 'First Low 1', referenceTechnique: 'TF-L1-2021', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-41', nom: 'First Low 2', referenceTechnique: 'TF-L2-2021', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-42', nom: 'First Parking 1', referenceTechnique: 'TF-P1-2020', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-43', nom: 'First Parking 2', referenceTechnique: 'TF-P2-2020', parcId: 'parc-5', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 6 : Marseille Vieux-Port (4 ascenseurs) ===
  { id: 'asc-44', nom: 'Vieux-Port Résidence A', referenceTechnique: 'MVP-A1-2016', parcId: 'parc-6', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-45', nom: 'Vieux-Port Résidence B', referenceTechnique: 'MVP-B1-2016', parcId: 'parc-6', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION },
  { id: 'asc-46', nom: 'Vieux-Port Résidence C', referenceTechnique: 'MVP-C1-2017', parcId: 'parc-6', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-47', nom: 'Vieux-Port Résidence D', referenceTechnique: 'MVP-D1-2018', parcId: 'parc-6', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 7 : Bordeaux Euratlantique (6 ascenseurs) ===
  { id: 'asc-48', nom: 'Euratlantique Tour A1', referenceTechnique: 'BEA-A1-2021', parcId: 'parc-7', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-49', nom: 'Euratlantique Tour A2', referenceTechnique: 'BEA-A2-2021', parcId: 'parc-7', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-50', nom: 'Euratlantique Tour B1', referenceTechnique: 'BEA-B1-2022', parcId: 'parc-7', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-12' },
  { id: 'asc-51', nom: 'Euratlantique Tour B2', referenceTechnique: 'BEA-B2-2022', parcId: 'parc-7', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-52', nom: 'Euratlantique Parking', referenceTechnique: 'BEA-P1-2020', parcId: 'parc-7', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-53', nom: 'Euratlantique Hall', referenceTechnique: 'BEA-H1-2023', parcId: 'parc-7', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 8 : Lille Euralille (7 ascenseurs) ===
  { id: 'asc-54', nom: 'Euralille Centre 1', referenceTechnique: 'LEU-C1-2018', parcId: 'parc-8', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-55', nom: 'Euralille Centre 2', referenceTechnique: 'LEU-C2-2018', parcId: 'parc-8', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-56', nom: 'Euralille Centre 3', referenceTechnique: 'LEU-C3-2018', parcId: 'parc-8', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.ATTRIBUE, technicienAttribueId: 'tech-11' },
  { id: 'asc-57', nom: 'Euralille Nord 1', referenceTechnique: 'LEU-N1-2019', parcId: 'parc-8', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-58', nom: 'Euralille Nord 2', referenceTechnique: 'LEU-N2-2019', parcId: 'parc-8', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-59', nom: 'Euralille Parking 1', referenceTechnique: 'LEU-P1-2017', parcId: 'parc-8', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-60', nom: 'Euralille Parking 2', referenceTechnique: 'LEU-P2-2017', parcId: 'parc-8', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-2' },

  // === PARC 9 : Montpellier Antigone (4 ascenseurs) ===
  { id: 'asc-61', nom: 'Antigone Bât Athéna', referenceTechnique: 'MAN-A1-2015', parcId: 'parc-9', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-62', nom: 'Antigone Bât Hermès', referenceTechnique: 'MAN-H1-2016', parcId: 'parc-9', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-63', nom: 'Antigone Bât Zeus', referenceTechnique: 'MAN-Z1-2017', parcId: 'parc-9', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION },
  { id: 'asc-64', nom: 'Antigone Bât Apollon', referenceTechnique: 'MAN-AP1-2018', parcId: 'parc-9', etatGlobal: EtatGlobal.FONCTIONNEL },

  // === PARC 10 : Nice Aéroport (10 ascenseurs - 24/7) ===
  { id: 'asc-65', nom: 'Nice T1 Hall A', referenceTechnique: 'NCE-1A-2020', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-66', nom: 'Nice T1 Hall B', referenceTechnique: 'NCE-1B-2020', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-67', nom: 'Nice T1 Hall C', referenceTechnique: 'NCE-1C-2020', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-68', nom: 'Nice T1 Embarquement', referenceTechnique: 'NCE-1E-2021', parcId: 'parc-10', etatGlobal: EtatGlobal.EN_PANNE, sousEtatPanne: SousEtatPanne.ATTRIBUE, technicienAttribueId: 'tech-13' },
  { id: 'asc-69', nom: 'Nice T2 Hall A', referenceTechnique: 'NCE-2A-2019', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-70', nom: 'Nice T2 Hall B', referenceTechnique: 'NCE-2B-2019', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-71', nom: 'Nice T2 Embarquement', referenceTechnique: 'NCE-2E-2021', parcId: 'parc-10', etatGlobal: EtatGlobal.EN_COURS_DE_REPARATION, technicienAttribueId: 'tech-14' },
  { id: 'asc-72', nom: 'Nice Parking P1', referenceTechnique: 'NCE-P1-2018', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-73', nom: 'Nice Parking P2', referenceTechnique: 'NCE-P2-2018', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
  { id: 'asc-74', nom: 'Nice VIP Lounge', referenceTechnique: 'NCE-VIP-2022', parcId: 'parc-10', etatGlobal: EtatGlobal.FONCTIONNEL },
];

// ========== HISTORIQUE D'ÉVÉNEMENTS (250+ événements sur 90 jours) ==========

// Générateur d'événements pour un cycle complet de panne/réparation
function generatePanneCycle(
  ascId: string,
  techId: string,
  joursDebut: number,
  dureeHeures: number,
  commentairePanne: string
): EvenementHistorique[] {
  const baseId = `evt-${ascId}-${joursDebut}`;
  return [
    { id: `${baseId}-1`, ascenseurId: ascId, typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(joursDebut, 0), commentaire: commentairePanne },
    { id: `${baseId}-2`, ascenseurId: ascId, typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(joursDebut, -1), commentaire: `Attribué au technicien`, technicienId: techId },
    { id: `${baseId}-3`, ascenseurId: ascId, typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(joursDebut, -2), commentaire: 'Début intervention', technicienId: techId },
    { id: `${baseId}-4`, ascenseurId: ascId, typeEvenement: TypeEvenement.FIN_REPARATION, dateHeure: dateIl(joursDebut, -dureeHeures), commentaire: 'Réparation terminée', technicienId: techId },
    { id: `${baseId}-5`, ascenseurId: ascId, typeEvenement: TypeEvenement.RETOUR_FONCTIONNEL, dateHeure: dateIl(joursDebut, -dureeHeures), commentaire: 'Remis en service' },
  ];
}

// Commentaires de pannes réalistes
const commentairesPannes = [
  'Blocage entre deux étages',
  'Bruit anormal au niveau du moteur',
  'Dysfonctionnement des portes automatiques',
  'Arrêt d\'urgence déclenché',
  'Problème de nivellement',
  'Défaut capteur de charge',
  'Panne électrique générale',
  'Câble de traction usé',
  'Défaillance du variateur',
  'Problème de frein de sécurité',
  'Boutons d\'appel non fonctionnels',
  'Éclairage cabine défaillant',
  'Ventilation cabine en panne',
  'Afficheur étage HS',
  'Interphone hors service',
];

export const evenementsHistoriques: EvenementHistorique[] = [
  // === ÉVÉNEMENTS ACTUELS (pannes en cours) ===
  
  // asc-3 : En panne, non attribué (Lyon Confluence)
  { id: 'evt-now-1', ascenseurId: 'asc-3', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 3), commentaire: 'Blocage entre les étages 2 et 3' },
  
  // asc-5 : En cours de réparation (Lyon Confluence)
  { id: 'evt-now-2', ascenseurId: 'asc-5', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(1, 0), commentaire: 'Dysfonctionnement portes' },
  { id: 'evt-now-3', ascenseurId: 'asc-5', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 22), commentaire: 'Attribué', technicienId: 'tech-1' },
  { id: 'evt-now-4', ascenseurId: 'asc-5', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(0, 20), commentaire: 'Début intervention', technicienId: 'tech-1' },
  
  // asc-8 : En panne, attribué (Lyon Confluence)
  { id: 'evt-now-5', ascenseurId: 'asc-8', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 6), commentaire: 'Bruit anormal moteur' },
  { id: 'evt-now-6', ascenseurId: 'asc-8', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 5), commentaire: 'Attribué', technicienId: 'tech-2' },
  
  // asc-11 : En cours de réparation (Lyon Résidence)
  { id: 'evt-now-7', ascenseurId: 'asc-11', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 12), commentaire: 'Problème de nivellement' },
  { id: 'evt-now-8', ascenseurId: 'asc-11', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 10), commentaire: 'Attribué', technicienId: 'tech-6' },
  { id: 'evt-now-9', ascenseurId: 'asc-11', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(0, 8), commentaire: 'Début intervention', technicienId: 'tech-6' },
  
  // asc-16 : En panne, attribué (Lyon Oxygène)
  { id: 'evt-now-10', ascenseurId: 'asc-16', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 4), commentaire: 'Défaut variateur de vitesse' },
  { id: 'evt-now-11', ascenseurId: 'asc-16', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 3), commentaire: 'Attribué', technicienId: 'tech-4' },
  
  // asc-20 : En cours de réparation (Lyon Oxygène)
  { id: 'evt-now-12', ascenseurId: 'asc-20', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(2, 0), commentaire: 'Câble de traction usé' },
  { id: 'evt-now-13', ascenseurId: 'asc-20', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(1, 20), commentaire: 'Attribué', technicienId: 'tech-7' },
  { id: 'evt-now-14', ascenseurId: 'asc-20', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(1, 16), commentaire: 'Début intervention', technicienId: 'tech-7' },
  
  // asc-26 : En panne, non attribué (Paris Galeries Lafayette)
  { id: 'evt-now-15', ascenseurId: 'asc-26', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 2), commentaire: 'Arrêt d\'urgence déclenché par client' },
  
  // asc-29 : En cours de réparation (Paris Galeries Lafayette)
  { id: 'evt-now-16', ascenseurId: 'asc-29', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(1, 8), commentaire: 'Panne électrique' },
  { id: 'evt-now-17', ascenseurId: 'asc-29', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(1, 6), commentaire: 'Attribué', technicienId: 'tech-8' },
  { id: 'evt-now-18', ascenseurId: 'asc-29', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(1, 4), commentaire: 'Début intervention', technicienId: 'tech-8' },
  
  // asc-35 : En panne, attribué (Paris La Défense)
  { id: 'evt-now-19', ascenseurId: 'asc-35', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 5), commentaire: 'Défaillance système de freinage' },
  { id: 'evt-now-20', ascenseurId: 'asc-35', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 4), commentaire: 'Attribué', technicienId: 'tech-15' },
  
  // asc-39 : En cours de réparation (Paris La Défense)
  { id: 'evt-now-21', ascenseurId: 'asc-39', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 18), commentaire: 'Problème capteur de charge' },
  { id: 'evt-now-22', ascenseurId: 'asc-39', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 16), commentaire: 'Attribué', technicienId: 'tech-4' },
  { id: 'evt-now-23', ascenseurId: 'asc-39', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(0, 14), commentaire: 'Début intervention', technicienId: 'tech-4' },
  
  // asc-45 : En panne, non attribué (Marseille)
  { id: 'evt-now-24', ascenseurId: 'asc-45', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 1), commentaire: 'Boutons d\'appel non fonctionnels' },
  
  // asc-50 : En cours de réparation (Bordeaux)
  { id: 'evt-now-25', ascenseurId: 'asc-50', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(3, 0), commentaire: 'Remplacement câbles préventif' },
  { id: 'evt-now-26', ascenseurId: 'asc-50', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(2, 20), commentaire: 'Attribué', technicienId: 'tech-12' },
  { id: 'evt-now-27', ascenseurId: 'asc-50', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(2, 16), commentaire: 'Début intervention', technicienId: 'tech-12' },
  
  // asc-56 : En panne, attribué (Lille)
  { id: 'evt-now-28', ascenseurId: 'asc-56', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 8), commentaire: 'Défaut afficheur étage' },
  { id: 'evt-now-29', ascenseurId: 'asc-56', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 6), commentaire: 'Attribué', technicienId: 'tech-11' },
  
  // asc-60 : En cours de réparation (Lille)
  { id: 'evt-now-30', ascenseurId: 'asc-60', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(1, 12), commentaire: 'Ventilation cabine HS' },
  { id: 'evt-now-31', ascenseurId: 'asc-60', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(1, 10), commentaire: 'Attribué', technicienId: 'tech-2' },
  { id: 'evt-now-32', ascenseurId: 'asc-60', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(1, 8), commentaire: 'Début intervention', technicienId: 'tech-2' },
  
  // asc-63 : En panne, non attribué (Montpellier)
  { id: 'evt-now-33', ascenseurId: 'asc-63', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 4), commentaire: 'Interphone hors service' },
  
  // asc-68 : En panne, attribué (Nice Aéroport)
  { id: 'evt-now-34', ascenseurId: 'asc-68', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 6), commentaire: 'Blocage porte automatique' },
  { id: 'evt-now-35', ascenseurId: 'asc-68', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 5), commentaire: 'Attribué', technicienId: 'tech-13' },
  
  // asc-71 : En cours de réparation (Nice Aéroport)
  { id: 'evt-now-36', ascenseurId: 'asc-71', typeEvenement: TypeEvenement.PANNE_DECLAREE, dateHeure: dateIl(0, 10), commentaire: 'Défaut capteur surcharge' },
  { id: 'evt-now-37', ascenseurId: 'asc-71', typeEvenement: TypeEvenement.PANNE_ATTRIBUEE, dateHeure: dateIl(0, 9), commentaire: 'Attribué', technicienId: 'tech-14' },
  { id: 'evt-now-38', ascenseurId: 'asc-71', typeEvenement: TypeEvenement.DEBUT_REPARATION, dateHeure: dateIl(0, 8), commentaire: 'Début intervention', technicienId: 'tech-14' },

  // === HISTORIQUE PASSÉ (pannes résolues sur 90 jours) ===
  
  // Semaine 1 (il y a 7 jours)
  ...generatePanneCycle('asc-1', 'tech-1', 7, 4, 'Maintenance préventive programmée'),
  ...generatePanneCycle('asc-14', 'tech-4', 6, 6, 'Problème de nivellement'),
  ...generatePanneCycle('asc-24', 'tech-8', 5, 3, 'Éclairage cabine défaillant'),
  ...generatePanneCycle('asc-32', 'tech-15', 7, 8, 'Câble de traction à remplacer'),
  ...generatePanneCycle('asc-54', 'tech-11', 6, 5, 'Boutons d\'appel défectueux'),
  
  // Semaine 2 (il y a 14 jours)
  ...generatePanneCycle('asc-2', 'tech-2', 14, 4, 'Bruit anormal moteur'),
  ...generatePanneCycle('asc-9', 'tech-3', 12, 3, 'Arrêt d\'urgence intempestif'),
  ...generatePanneCycle('asc-15', 'tech-7', 13, 6, 'Défaut variateur'),
  ...generatePanneCycle('asc-25', 'tech-13', 11, 4, 'Problème de frein'),
  ...generatePanneCycle('asc-33', 'tech-4', 14, 5, 'Dysfonctionnement portes'),
  ...generatePanneCycle('asc-44', 'tech-5', 10, 8, 'Panne électrique générale'),
  ...generatePanneCycle('asc-48', 'tech-12', 12, 4, 'Défaut capteur'),
  
  // Semaine 3 (il y a 21 jours)
  ...generatePanneCycle('asc-4', 'tech-1', 21, 5, 'Maintenance préventive'),
  ...generatePanneCycle('asc-10', 'tech-6', 20, 3, 'Interphone HS'),
  ...generatePanneCycle('asc-17', 'tech-4', 19, 4, 'Afficheur défaillant'),
  ...generatePanneCycle('asc-27', 'tech-11', 22, 6, 'Ventilation cabine'),
  ...generatePanneCycle('asc-36', 'tech-9', 18, 7, 'Câble usé'),
  ...generatePanneCycle('asc-55', 'tech-8', 21, 4, 'Blocage portes'),
  ...generatePanneCycle('asc-65', 'tech-13', 20, 3, 'Capteur surcharge'),
  
  // Semaine 4 (il y a 28 jours)
  ...generatePanneCycle('asc-6', 'tech-2', 28, 5, 'Bruit anormal'),
  ...generatePanneCycle('asc-12', 'tech-3', 26, 4, 'Problème nivellement'),
  ...generatePanneCycle('asc-18', 'tech-7', 27, 6, 'Défaut électrique'),
  ...generatePanneCycle('asc-28', 'tech-8', 25, 3, 'Éclairage'),
  ...generatePanneCycle('asc-37', 'tech-15', 28, 8, 'Remplacement câbles'),
  ...generatePanneCycle('asc-46', 'tech-10', 26, 4, 'Boutons HS'),
  ...generatePanneCycle('asc-57', 'tech-2', 27, 5, 'Arrêt urgence'),
  ...generatePanneCycle('asc-66', 'tech-14', 25, 4, 'Portes automatiques'),
  
  // Mois 2 (il y a 35-60 jours)
  ...generatePanneCycle('asc-1', 'tech-1', 35, 4, 'Maintenance semestrielle'),
  ...generatePanneCycle('asc-7', 'tech-3', 38, 5, 'Défaut variateur'),
  ...generatePanneCycle('asc-13', 'tech-6', 42, 6, 'Câble traction'),
  ...generatePanneCycle('asc-19', 'tech-4', 45, 4, 'Capteur charge'),
  ...generatePanneCycle('asc-21', 'tech-7', 48, 3, 'Interphone'),
  ...generatePanneCycle('asc-22', 'tech-15', 52, 5, 'Frein sécurité'),
  ...generatePanneCycle('asc-30', 'tech-11', 40, 4, 'Nivellement'),
  ...generatePanneCycle('asc-31', 'tech-8', 44, 6, 'Portes'),
  ...generatePanneCycle('asc-38', 'tech-4', 47, 5, 'Électrique'),
  ...generatePanneCycle('asc-40', 'tech-9', 50, 7, 'Câbles'),
  ...generatePanneCycle('asc-41', 'tech-15', 55, 4, 'Ventilation'),
  ...generatePanneCycle('asc-47', 'tech-5', 58, 5, 'Afficheur'),
  ...generatePanneCycle('asc-49', 'tech-12', 36, 4, 'Boutons'),
  ...generatePanneCycle('asc-51', 'tech-14', 39, 6, 'Moteur'),
  ...generatePanneCycle('asc-52', 'tech-7', 43, 3, 'Éclairage'),
  ...generatePanneCycle('asc-58', 'tech-11', 46, 5, 'Capteur'),
  ...generatePanneCycle('asc-59', 'tech-2', 49, 4, 'Urgence'),
  ...generatePanneCycle('asc-61', 'tech-6', 53, 6, 'Portes'),
  ...generatePanneCycle('asc-62', 'tech-10', 56, 4, 'Frein'),
  ...generatePanneCycle('asc-67', 'tech-13', 37, 5, 'Variateur'),
  ...generatePanneCycle('asc-69', 'tech-14', 41, 4, 'Nivellement'),
  ...generatePanneCycle('asc-70', 'tech-13', 51, 6, 'Électrique'),
  ...generatePanneCycle('asc-72', 'tech-15', 54, 3, 'Interphone'),
  ...generatePanneCycle('asc-73', 'tech-14', 57, 5, 'Câble'),
  
  // Mois 3 (il y a 60-90 jours)
  ...generatePanneCycle('asc-2', 'tech-1', 62, 5, 'Maintenance trimestrielle'),
  ...generatePanneCycle('asc-4', 'tech-2', 65, 4, 'Défaut moteur'),
  ...generatePanneCycle('asc-6', 'tech-3', 68, 6, 'Câbles usés'),
  ...generatePanneCycle('asc-9', 'tech-6', 71, 4, 'Capteur'),
  ...generatePanneCycle('asc-10', 'tech-3', 74, 5, 'Portes'),
  ...generatePanneCycle('asc-14', 'tech-4', 77, 7, 'Frein'),
  ...generatePanneCycle('asc-15', 'tech-7', 80, 4, 'Électrique'),
  ...generatePanneCycle('asc-17', 'tech-4', 83, 5, 'Variateur'),
  ...generatePanneCycle('asc-23', 'tech-15', 86, 6, 'Nivellement'),
  ...generatePanneCycle('asc-24', 'tech-8', 63, 4, 'Éclairage'),
  ...generatePanneCycle('asc-25', 'tech-11', 66, 5, 'Ventilation'),
  ...generatePanneCycle('asc-27', 'tech-13', 69, 4, 'Boutons'),
  ...generatePanneCycle('asc-32', 'tech-9', 72, 6, 'Afficheur'),
  ...generatePanneCycle('asc-33', 'tech-15', 75, 5, 'Interphone'),
  ...generatePanneCycle('asc-34', 'tech-4', 78, 4, 'Urgence'),
  ...generatePanneCycle('asc-36', 'tech-9', 81, 7, 'Câble'),
  ...generatePanneCycle('asc-42', 'tech-4', 84, 5, 'Moteur'),
  ...generatePanneCycle('asc-43', 'tech-15', 87, 4, 'Portes'),
  ...generatePanneCycle('asc-44', 'tech-5', 64, 6, 'Capteur'),
  ...generatePanneCycle('asc-46', 'tech-10', 67, 4, 'Frein'),
  ...generatePanneCycle('asc-48', 'tech-12', 70, 5, 'Électrique'),
  ...generatePanneCycle('asc-53', 'tech-7', 73, 4, 'Variateur'),
  ...generatePanneCycle('asc-54', 'tech-8', 76, 6, 'Nivellement'),
  ...generatePanneCycle('asc-55', 'tech-11', 79, 5, 'Éclairage'),
  ...generatePanneCycle('asc-57', 'tech-2', 82, 4, 'Ventilation'),
  ...generatePanneCycle('asc-61', 'tech-6', 85, 5, 'Boutons'),
  ...generatePanneCycle('asc-64', 'tech-10', 88, 6, 'Afficheur'),
  ...generatePanneCycle('asc-65', 'tech-13', 61, 4, 'Interphone'),
  ...generatePanneCycle('asc-66', 'tech-14', 64, 5, 'Urgence'),
  ...generatePanneCycle('asc-69', 'tech-13', 67, 4, 'Câble'),
  ...generatePanneCycle('asc-74', 'tech-15', 90, 6, 'Maintenance annuelle'),
];
