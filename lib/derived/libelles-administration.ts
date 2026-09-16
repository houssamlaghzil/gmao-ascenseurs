/**
 * Libellés français pour les enums de l'écran Administration (section 17).
 * StatutSynchronisation a déjà son propre badge (voir
 * components/StatusBadges.tsx) et RoleUtilisateur a déjà son libellé porté
 * par RoleDefinition.libelle (data/store.ts, getAllRolesDefinitions) — non
 * repris ici.
 */

import { CanalNotification, ModeAuthentification, Permission, StatutCompteUtilisateur, TypeEntiteAuditee, TypeRegleMetier } from '@/domain/types';

export const LIBELLE_STATUT_COMPTE_UTILISATEUR: Record<StatutCompteUtilisateur, string> = {
  [StatutCompteUtilisateur.ACTIF]: 'Actif',
  [StatutCompteUtilisateur.INACTIF]: 'Inactif',
  [StatutCompteUtilisateur.SUSPENDU]: 'Suspendu',
  [StatutCompteUtilisateur.EN_ATTENTE_ACTIVATION]: "En attente d'activation",
};

export const LIBELLE_MODE_AUTHENTIFICATION: Record<ModeAuthentification, string> = {
  [ModeAuthentification.LOCAL]: 'Local',
  [ModeAuthentification.SSO_ENTREPRISE]: 'SSO entreprise',
};

export const LIBELLE_PERMISSION: Record<Permission, string> = {
  [Permission.VOIR_PARC]: 'Voir le parc',
  [Permission.GERER_PARC]: 'Gérer le parc',
  [Permission.VOIR_INTERVENTIONS]: 'Voir les interventions',
  [Permission.GERER_INTERVENTIONS]: 'Gérer les interventions',
  [Permission.VOIR_MAINTENANCES]: 'Voir les maintenances',
  [Permission.GERER_MAINTENANCES]: 'Gérer les maintenances',
  [Permission.VOIR_RAPPORTS]: 'Voir les rapports',
  [Permission.VALIDER_RAPPORTS]: 'Valider les rapports',
  [Permission.VOIR_CTQ]: 'Voir les CTQ / réserves',
  [Permission.GERER_CTQ]: 'Gérer les CTQ / réserves',
  [Permission.VOIR_PLANNING]: 'Voir le planning',
  [Permission.GERER_PLANNING]: 'Gérer le planning',
  [Permission.VOIR_CONTRATS]: 'Voir les contrats',
  [Permission.GERER_CONTRATS]: 'Gérer les contrats',
  [Permission.VOIR_INTEGRATIONS]: 'Voir les intégrations',
  [Permission.GERER_INTEGRATIONS]: 'Gérer les intégrations',
  [Permission.VOIR_GEOLOCALISATION_TECHNICIENS]: 'Voir la géolocalisation des techniciens',
  [Permission.ADMINISTRER_UTILISATEURS]: 'Administrer les utilisateurs',
  [Permission.ADMINISTRER_REFERENTIELS]: 'Administrer les référentiels',
  [Permission.VOIR_AUDIT_LOGS]: "Voir les journaux d'audit",
  [Permission.EXPORTER_DONNEES]: 'Exporter des données',
};

export const LIBELLE_CANAL_NOTIFICATION: Record<CanalNotification, string> = {
  [CanalNotification.IN_APP]: 'Application',
  [CanalNotification.EMAIL]: 'E-mail',
  [CanalNotification.PUSH_MOBILE]: 'Push mobile',
  [CanalNotification.SMS]: 'SMS',
};

export const LIBELLE_TYPE_ENTITE_AUDITEE: Record<TypeEntiteAuditee, string> = {
  [TypeEntiteAuditee.APPAREIL]: 'Appareil',
  [TypeEntiteAuditee.PARC]: 'Parc',
  [TypeEntiteAuditee.CONTRAT]: 'Contrat',
  [TypeEntiteAuditee.UTILISATEUR]: 'Utilisateur',
  [TypeEntiteAuditee.INTERVENTION]: 'Intervention',
  [TypeEntiteAuditee.MAINTENANCE]: 'Maintenance',
  [TypeEntiteAuditee.RAPPORT]: 'Rapport',
  [TypeEntiteAuditee.RESERVE_CTQ]: 'Réserve CTQ',
  [TypeEntiteAuditee.INTEGRATION]: 'Intégration',
  [TypeEntiteAuditee.REFERENTIEL]: 'Référentiel',
};

export const LIBELLE_TYPE_REGLE_METIER: Record<TypeRegleMetier, string> = {
  [TypeRegleMetier.VALIDATION_SIGNATURE_CLIENT]: 'Validation signature client',
  [TypeRegleMetier.AUTRE]: 'Autre',
};
