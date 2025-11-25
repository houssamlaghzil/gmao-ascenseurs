/**
 * Types et énumérations pour le domaine GMAO Ascenseurs
 * Architecture domain-driven avec règles métier strictes
 */

// ========== ENUMS ==========

// États globaux possibles d'un ascenseur (machine à états stricte)
export enum EtatGlobal {
  FONCTIONNEL = "fonctionnel",
  EN_PANNE = "en_panne",
  EN_COURS_DE_REPARATION = "en_cours_de_reparation",
}

// Sous-états quand etatGlobal = "en_panne"
export enum SousEtatPanne {
  EN_COURS_D_ATTRIBUTION = "en_cours_d_attribution",
  ATTRIBUE = "attribue",
}

// Types d'événements dans l'historique
export enum TypeEvenement {
  PANNE_DECLAREE = "panne_declaree",
  PANNE_ATTRIBUEE = "panne_attribuee",
  DEBUT_REPARATION = "debut_reparation",
  FIN_REPARATION = "fin_reparation",
  RETOUR_FONCTIONNEL = "retour_fonctionnel",
  COMMENTAIRE = "commentaire",
}

// Niveaux de risque pour la maintenance prédictive
export enum RiskLevel {
  FAIBLE = "faible",
  MODERE = "modere",
  ELEVE = "eleve",
}

// Type de parc (pour le calcul de risque)
export enum TypeParc {
  RESIDENTIEL = "residentiel",
  TERTIAIRE = "tertiaire",
  COMMERCIAL = "commercial",
}

// ========== ENTITES PRINCIPALES ==========

/**
 * Parc d'ascenseurs
 */
export interface ParcAscenseurs {
  id: string;
  nom: string;
  description: string;
  ville: string;
  adresse: string;
  type: TypeParc;
}

/**
 * Ascenseur avec machine à états stricte
 */
export interface Ascenseur {
  id: string;
  nom: string;
  referenceTechnique?: string;
  parcId: string;
  etatGlobal: EtatGlobal;
  
  // Propriétés conditionnelles selon l'état
  sousEtatPanne?: SousEtatPanne; // Requis si etatGlobal = "en_panne"
  technicienAttribueId?: string; // Requis si etatGlobal = "en_cours_de_reparation"
}

/**
 * Technicien
 */
export interface Technicien {
  id: string;
  nomComplet: string;
  specialite: string;
  disponible: boolean;
}

/**
 * Association Many-to-Many entre Parc et Technicien
 */
export interface ParcTechnicienAssignment {
  parcId: string;
  technicienId: string;
}

/**
 * Événement dans l'historique
 */
export interface EvenementHistorique {
  id: string;
  ascenseurId: string;
  typeEvenement: TypeEvenement;
  dateHeure: string; // ISO timestamp
  commentaire?: string;
  technicienId?: string;
}

// ========== TYPES DERIVES ==========

/**
 * Score de risque de panne (maintenance prédictive)
 */
export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  explication: string;
}

/**
 * Statistiques d'un parc
 */
export interface StatistiquesParc {
  parcId: string;
  totalAscenseurs: number;
  nombreFonctionnels: number;
  nombreEnPanne: number;
  nombreEnReparation: number;
}

/**
 * Résultat d'une transition d'état
 */
export interface TransitionResult {
  ascenseur: Ascenseur;
  evenements: EvenementHistorique[];
}

/**
 * Réponse API générique
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
