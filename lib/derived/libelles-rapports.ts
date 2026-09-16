/**
 * Libellés français pour les enums propres au module Rapports (section 9)
 * sans équivalent déjà exposé ailleurs. TypeRapport et OrigineAction ont
 * déjà leur libellé dans lib/derived/libelles-parc.ts (réutilisés tels
 * quels) ; StatutValidationRapport a son propre badge (voir
 * components/StatusBadges.tsx).
 */

import { CategoriePhoto, LocalDiagnostic, MotifNonAcces, OrigineDiagnostic, RattachementRapport, StatutSignatureClient } from '@/domain/types';

export const LIBELLE_ORIGINE_DIAGNOSTIC: Record<OrigineDiagnostic, string> = {
  [OrigineDiagnostic.VETUSTE]: 'Vétusté',
  [OrigineDiagnostic.USURE]: 'Usure',
  [OrigineDiagnostic.VANDALISME]: 'Vandalisme',
  [OrigineDiagnostic.DEFAUT_ELECTRIQUE]: 'Défaut électrique',
  [OrigineDiagnostic.DEFAUT_MECANIQUE]: 'Défaut mécanique',
  [OrigineDiagnostic.AUTRE]: 'Autre',
};

export const LIBELLE_LOCAL_DIAGNOSTIC: Record<LocalDiagnostic, string> = {
  [LocalDiagnostic.CABINE]: 'Cabine',
  [LocalDiagnostic.GAINE]: 'Gaine',
  [LocalDiagnostic.TOIT_CABINE]: 'Toit de cabine',
  [LocalDiagnostic.FOSSE]: 'Fosse',
  [LocalDiagnostic.LOCAL_MACHINERIE]: 'Local machinerie',
  [LocalDiagnostic.PORTES_PALIERES]: 'Portes palières',
  [LocalDiagnostic.ARMOIRE_COMMANDE]: 'Armoire de commande',
  [LocalDiagnostic.AUTRE]: 'Autre',
};

export const LIBELLE_MOTIF_NON_ACCES: Record<MotifNonAcces, string> = {
  [MotifNonAcces.CLIENT_ABSENT]: 'Client absent',
  [MotifNonAcces.LOCAL_FERME]: 'Local fermé',
  [MotifNonAcces.CLES_INDISPONIBLES]: 'Clés indisponibles',
  [MotifNonAcces.DIGICODE_INCONNU]: 'Digicode inconnu',
  [MotifNonAcces.ACCES_BLOQUE]: 'Accès bloqué',
  [MotifNonAcces.AUTRE]: 'Autre',
};

export const LIBELLE_CATEGORIE_PHOTO: Record<CategoriePhoto, string> = {
  [CategoriePhoto.ETAT_GENERAL]: 'État général',
  [CategoriePhoto.AVANT_INTERVENTION]: 'Avant intervention',
  [CategoriePhoto.APRES_INTERVENTION]: 'Après intervention',
  [CategoriePhoto.PIECE_CASSEE]: 'Pièce cassée',
  [CategoriePhoto.RESERVE_CTQ]: 'Réserve CTQ',
  [CategoriePhoto.SIGNALETIQUE]: 'Signalétique',
  [CategoriePhoto.AUTRE]: 'Autre',
};

export const LIBELLE_STATUT_SIGNATURE_CLIENT: Record<StatutSignatureClient, string> = {
  [StatutSignatureClient.SIGNE]: 'Signé',
  [StatutSignatureClient.ABSENT]: 'Absent',
  [StatutSignatureClient.INDISPONIBLE]: 'Indisponible',
};

export const LIBELLE_RATTACHEMENT_RAPPORT: Record<RattachementRapport, string> = {
  [RattachementRapport.INTERVENTION]: 'Intervention',
  [RattachementRapport.MAINTENANCE]: 'Maintenance',
  [RattachementRapport.ISOLE]: 'Isolé',
};
