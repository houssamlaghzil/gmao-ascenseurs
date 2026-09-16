/**
 * Libellés français pour les enums affichés dans les écrans Parc (section
 * 4) sans équivalent déjà exposé ailleurs (les statuts principaux ont leur
 * propre badge : voir components/StatusBadge.tsx et StatusBadges.tsx).
 */

import {
  StatutAppareil,
  CategorieMaintenance,
  MotifIntervention,
  TypeRapport,
  OrigineAction,
  TypeAuteurModification,
  DetenteurCles,
  TypeLigneTelealarme,
  StatutTelealarme,
} from '@/domain/types';

export const LIBELLE_STATUT_APPAREIL: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_SERVICE]: 'En service',
  [StatutAppareil.EN_PANNE]: 'En panne',
  [StatutAppareil.A_L_ARRET]: "À l'arrêt",
  [StatutAppareil.MODE_DEGRADE]: 'Mode dégradé',
  [StatutAppareil.ARRET_TRAVAUX]: 'Arrêt travaux',
};

export const LIBELLE_CATEGORIE_MAINTENANCE: Record<CategorieMaintenance, string> = {
  [CategorieMaintenance.PERIODIQUE]: 'Périodique',
  [CategorieMaintenance.CABLE]: 'Câble',
  [CategorieMaintenance.PARACHUTE]: 'Parachute',
  [CategorieMaintenance.NETTOYAGE]: 'Nettoyage',
  [CategorieMaintenance.AUTRE]: 'Autre',
};

export const LIBELLE_MOTIF_INTERVENTION: Record<MotifIntervention, string> = {
  [MotifIntervention.PERSONNE_BLOQUEE]: 'Personne bloquée',
  [MotifIntervention.PANNE_ARRET]: 'Panne / Arrêt',
  [MotifIntervention.BRUIT_ANORMAL]: 'Bruit anormal',
  [MotifIntervention.PORTE_DEFAILLANTE]: 'Porte défaillante',
  [MotifIntervention.ARRET_ETAGE]: "Arrêt à l'étage",
  [MotifIntervention.ALARME_DECLENCHEE]: 'Alarme déclenchée',
  [MotifIntervention.DEGRADATION_VANDALISME]: 'Dégradation / Vandalisme',
  [MotifIntervention.AUTRE]: 'Autre',
};

export const LIBELLE_TYPE_RAPPORT: Record<TypeRapport, string> = {
  [TypeRapport.DEPANNAGE]: 'Dépannage',
  [TypeRapport.MAINTENANCE]: 'Maintenance',
  [TypeRapport.DIVERS]: 'Divers',
};

export const LIBELLE_ORIGINE_ACTION: Record<OrigineAction, string> = {
  [OrigineAction.WEB]: 'Web',
  [OrigineAction.MOBILE]: 'Mobile',
  [OrigineAction.API]: 'API',
  [OrigineAction.SYSTEME]: 'Système',
};

export const LIBELLE_TYPE_AUTEUR: Record<TypeAuteurModification, string> = {
  [TypeAuteurModification.TECHNICIEN]: 'Technicien',
  [TypeAuteurModification.UTILISATEUR_WEB]: 'Utilisateur web',
  [TypeAuteurModification.SYSTEME]: 'Système',
};

export const LIBELLE_DETENTEUR_CLES: Record<DetenteurCles, string> = {
  [DetenteurCles.GARDIEN]: 'Gardien',
  [DetenteurCles.CLIENT_SUR_SITE]: 'Client sur site',
  [DetenteurCles.BOITE_A_CLES]: 'Boîte à clés',
  [DetenteurCles.AGENCE_MANEI_LIFT]: 'Agence Manei-Lift',
  [DetenteurCles.AUCUNE_REQUISE]: 'Aucune requise',
};

export const LIBELLE_TYPE_LIGNE_TELEALARME: Record<TypeLigneTelealarme, string> = {
  [TypeLigneTelealarme.RTC]: 'RTC',
  [TypeLigneTelealarme.GSM]: 'GSM',
  [TypeLigneTelealarme.IP]: 'IP',
};

export const LIBELLE_STATUT_TELEALARME: Record<StatutTelealarme, string> = {
  [StatutTelealarme.FONCTIONNELLE]: 'Fonctionnelle',
  [StatutTelealarme.DEFAILLANTE]: 'Défaillante',
  [StatutTelealarme.NON_TESTEE]: 'Non testée',
};
