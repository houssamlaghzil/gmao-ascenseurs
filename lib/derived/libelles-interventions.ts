/**
 * Libellés français pour les enums des écrans Interventions (sections 7 et
 * 8). MotifIntervention a déjà son libellé dans
 * lib/derived/libelles-parc.ts (réutilisé tel quel). StatutIntervention,
 * PrioriteIntervention et EtatSLA ont chacun leur propre badge (voir
 * components/StatutInterventionBadge.tsx et components/StatusBadges.tsx) —
 * les libellés ci-dessous reprennent le même texte, pour les options des
 * formulaires de filtre (`<select>`) qui n'affichent pas de pastille.
 */

import { EtatSLA, MotifReattribution, NiveauUrgence, PrioriteIntervention, SourceTicket, StatutIntervention, StatutTicket } from '@/domain/types';

export const LIBELLE_STATUT_INTERVENTION: Record<StatutIntervention, string> = {
  [StatutIntervention.NOUVEAU]: 'Nouveau',
  [StatutIntervention.A_AFFECTER]: 'À affecter',
  [StatutIntervention.AFFECTE]: 'Affecté',
  [StatutIntervention.PRIS_EN_CHARGE]: 'Pris en charge',
  [StatutIntervention.EN_COURS]: 'En cours',
  [StatutIntervention.EN_ATTENTE_DE_PIECE]: 'En attente de pièce',
  [StatutIntervention.A_REPRENDRE]: 'À reprendre',
  [StatutIntervention.TERMINE]: 'Terminé',
  [StatutIntervention.A_VALIDER]: 'À valider',
  [StatutIntervention.CLOTURE]: 'Clôturé',
};

export const LIBELLE_PRIORITE_INTERVENTION: Record<PrioriteIntervention, string> = {
  [PrioriteIntervention.CRITIQUE]: 'Critique',
  [PrioriteIntervention.HAUTE]: 'Haute',
  [PrioriteIntervention.NORMALE]: 'Normale',
  [PrioriteIntervention.BASSE]: 'Basse',
};

export const LIBELLE_ETAT_SLA: Record<EtatSLA, string> = {
  [EtatSLA.DANS_LES_DELAIS]: 'Dans les délais',
  [EtatSLA.BIENTOT_DEPASSE]: 'Bientôt dépassé',
  [EtatSLA.DEPASSE]: 'Dépassé',
  [EtatSLA.NON_APPLICABLE]: 'Non applicable',
};

export const LIBELLE_SOURCE_TICKET: Record<SourceTicket, string> = {
  [SourceTicket.APPEL_CLIENT]: 'Appel client',
  [SourceTicket.SERENITE]: 'Sérénité',
  [SourceTicket.GETRALINE]: 'Getraline',
  [SourceTicket.SAISIE_INTERNE]: 'Saisie interne',
  [SourceTicket.AUTRE_API]: 'Autre API',
};

export const LIBELLE_STATUT_TICKET: Record<StatutTicket, string> = {
  [StatutTicket.NON_RAPPROCHE]: 'Non rapproché',
  [StatutTicket.RAPPROCHE]: 'Rapproché',
  [StatutTicket.IGNORE]: 'Ignoré',
};

export const LIBELLE_MOTIF_REATTRIBUTION: Record<MotifReattribution, string> = {
  [MotifReattribution.INDISPONIBILITE_TECHNICIEN]: 'Indisponibilité du technicien',
  [MotifReattribution.COMPETENCE_INSUFFISANTE]: 'Compétence insuffisante',
  [MotifReattribution.SURCHARGE_TOURNEE]: 'Surcharge de tournée',
  [MotifReattribution.PROXIMITE_GEOGRAPHIQUE]: 'Proximité géographique',
  [MotifReattribution.ABSENCE]: 'Absence',
  [MotifReattribution.DEMANDE_CLIENT]: 'Demande client',
  [MotifReattribution.ACCES_IMPOSSIBLE]: 'Accès impossible',
  [MotifReattribution.AUTRE]: 'Autre',
};

export const LIBELLE_NIVEAU_URGENCE: Record<NiveauUrgence, string> = {
  [NiveauUrgence.PERSONNE_BLOQUEE]: 'Personne bloquée',
  [NiveauUrgence.STANDARD]: 'Standard',
  [NiveauUrgence.NON_URGENT]: 'Non urgent',
};
