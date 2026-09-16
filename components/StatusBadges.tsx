/**
 * Badges de statut secondaires, regroupés dans un seul fichier pour garder
 * une palette et une forme cohérentes (voir components/StatusBadge.tsx et
 * components/StatutInterventionBadge.tsx pour les deux badges principaux).
 */

import {
  StatutMaintenance,
  CategorieMaintenance,
  StatutReserve,
  StatutControleCTQ,
  EtatSLA,
  PrioriteIntervention,
  GraviteReserve,
  StatutSynchronisation,
  StatutTacheAsynchrone,
  StatutConnexionIntegration,
  StatutContrat,
  StatutValidationRapport,
  StatutSignatureClient,
  PrioriteAffichageMaintenance,
  TypeEtapeIntervention,
  EtatPointControle,
  EtatConnexionMobile,
  StatutPresenceTechnicien,
  StatutSessionTechnicien,
  StatutAbsence,
  TypeAbsence,
} from '@/domain/types';

type Tone = { bg: string; text: string; border: string; label: string };

function Pill({ tone }: { tone: Tone }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${tone.bg} ${tone.text} ${tone.border}`}>
      {tone.label}
    </span>
  );
}

const MAINTENANCE: Record<StatutMaintenance, Tone> = {
  [StatutMaintenance.PLANIFIEE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Planifiée' },
  [StatutMaintenance.EN_COURS_DE_REALISATION]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En cours' },
  [StatutMaintenance.REALISEE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Réalisée' },
  [StatutMaintenance.ANNULEE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Annulée' },
};
export function StatutMaintenanceBadge({ statut }: { statut: StatutMaintenance }) {
  return <Pill tone={MAINTENANCE[statut]} />;
}

const CATEGORIE_MAINTENANCE: Record<CategorieMaintenance, Tone> = {
  [CategorieMaintenance.PERIODIQUE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Périodique' },
  [CategorieMaintenance.CABLE]: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Câble' },
  [CategorieMaintenance.PARACHUTE]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Parachute' },
  [CategorieMaintenance.NETTOYAGE]: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Nettoyage' },
  [CategorieMaintenance.AUTRE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Autre' },
};
export function CategorieMaintenanceBadge({ categorie }: { categorie: CategorieMaintenance }) {
  return <Pill tone={CATEGORIE_MAINTENANCE[categorie]} />;
}

const CONTRAT: Record<StatutContrat, Tone> = {
  [StatutContrat.EN_NEGOCIATION]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'En négociation' },
  [StatutContrat.ACTIF]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Actif' },
  [StatutContrat.EN_RENOUVELLEMENT]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En renouvellement' },
  [StatutContrat.SUSPENDU]: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Suspendu' },
  [StatutContrat.EXPIRE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Expiré' },
  [StatutContrat.RESILIE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Résilié' },
};
export function StatutContratBadge({ statut }: { statut: StatutContrat }) {
  return <Pill tone={CONTRAT[statut]} />;
}

const RESERVE: Record<StatutReserve, Tone> = {
  [StatutReserve.A_TRAITER]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'À traiter' },
  [StatutReserve.PLANIFIEE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Planifiée' },
  [StatutReserve.EN_COURS]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En cours' },
  [StatutReserve.TRAITEE]: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Traitée' },
  [StatutReserve.A_CONTROLER]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'À contrôler' },
  [StatutReserve.VALIDEE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Validée' },
};
export function StatutReserveBadge({ statut }: { statut: StatutReserve }) {
  return <Pill tone={RESERVE[statut]} />;
}

const CONTROLE_CTQ: Record<StatutControleCTQ, Tone> = {
  [StatutControleCTQ.PLANIFIE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Planifié' },
  [StatutControleCTQ.REALISE_SANS_RESERVE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Réalisé sans réserve' },
  [StatutControleCTQ.RESERVES_A_TRAITER]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Réserves à traiter' },
  [StatutControleCTQ.RESERVES_EN_COURS]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Réserves en cours' },
  [StatutControleCTQ.RESERVES_A_CONTROLER]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Réserves à contrôler' },
  [StatutControleCTQ.SOLDE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Soldé' },
};
export function StatutControleCTQBadge({ statut }: { statut: StatutControleCTQ }) {
  return <Pill tone={CONTROLE_CTQ[statut]} />;
}

const SLA: Record<EtatSLA, Tone> = {
  [EtatSLA.DANS_LES_DELAIS]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Dans les délais' },
  [EtatSLA.BIENTOT_DEPASSE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Bientôt dépassé' },
  [EtatSLA.DEPASSE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Dépassé' },
  [EtatSLA.NON_APPLICABLE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Non applicable' },
};
export function EtatSLABadge({ etat }: { etat: EtatSLA }) {
  return <Pill tone={SLA[etat]} />;
}

const PRIORITE: Record<PrioriteIntervention, Tone> = {
  [PrioriteIntervention.CRITIQUE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Critique' },
  [PrioriteIntervention.HAUTE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Haute' },
  [PrioriteIntervention.NORMALE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Normale' },
  [PrioriteIntervention.BASSE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Basse' },
};
export function PrioriteInterventionBadge({ priorite }: { priorite: PrioriteIntervention }) {
  return <Pill tone={PRIORITE[priorite]} />;
}

const GRAVITE: Record<GraviteReserve, Tone> = {
  [GraviteReserve.MINEURE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Mineure' },
  [GraviteReserve.MAJEURE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Majeure' },
  [GraviteReserve.CRITIQUE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Critique' },
};
export function GraviteReserveBadge({ gravite }: { gravite: GraviteReserve }) {
  return <Pill tone={GRAVITE[gravite]} />;
}

const SYNCHRONISATION: Record<StatutSynchronisation, Tone> = {
  [StatutSynchronisation.BROUILLON]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Brouillon' },
  [StatutSynchronisation.EN_ATTENTE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En attente' },
  [StatutSynchronisation.ENVOI_EN_COURS]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Envoi en cours' },
  [StatutSynchronisation.SYNCHRONISE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Synchronisé' },
  [StatutSynchronisation.ECHEC]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Échec' },
};
export function StatutSynchronisationBadge({ statut }: { statut: StatutSynchronisation }) {
  return <Pill tone={SYNCHRONISATION[statut]} />;
}

const TACHE_ASYNCHRONE: Record<StatutTacheAsynchrone, Tone> = {
  [StatutTacheAsynchrone.EN_ATTENTE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'En attente' },
  [StatutTacheAsynchrone.EN_COURS]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'En cours' },
  [StatutTacheAsynchrone.TERMINE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Terminé' },
  [StatutTacheAsynchrone.ECHEC]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Échec' },
};
export function StatutTacheAsynchroneBadge({ statut }: { statut: StatutTacheAsynchrone }) {
  return <Pill tone={TACHE_ASYNCHRONE[statut]} />;
}

const CONNEXION_INTEGRATION: Record<StatutConnexionIntegration, Tone> = {
  [StatutConnexionIntegration.CONNECTEE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Connectée' },
  [StatutConnexionIntegration.DECONNECTEE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Déconnectée' },
};
export function StatutConnexionIntegrationBadge({ statut }: { statut: StatutConnexionIntegration }) {
  return <Pill tone={CONNEXION_INTEGRATION[statut]} />;
}

const VALIDATION_RAPPORT: Record<StatutValidationRapport, Tone> = {
  [StatutValidationRapport.EN_ATTENTE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En attente' },
  [StatutValidationRapport.VALIDE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Validé' },
  [StatutValidationRapport.REFUSE_A_CORRIGER]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Refusé — à corriger' },
};
export function StatutValidationRapportBadge({ statut }: { statut: StatutValidationRapport }) {
  return <Pill tone={VALIDATION_RAPPORT[statut]} />;
}

const PRIORITE_AFFICHAGE_MAINTENANCE: Record<PrioriteAffichageMaintenance, Tone> = {
  [PrioriteAffichageMaintenance.EN_RETARD]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'En retard' },
  [PrioriteAffichageMaintenance.CETTE_SEMAINE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Cette semaine' },
  [PrioriteAffichageMaintenance.A_VENIR]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'À venir' },
};
export function PrioriteAffichageMaintenanceBadge({ priorite }: { priorite: PrioriteAffichageMaintenance }) {
  return <Pill tone={PRIORITE_AFFICHAGE_MAINTENANCE[priorite]} />;
}

const TYPE_ETAPE_INTERVENTION: Record<TypeEtapeIntervention, Tone> = {
  [TypeEtapeIntervention.SIGNALEMENT_RECU]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Signalement reçu' },
  [TypeEtapeIntervention.INTERVENTION_CREEE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Intervention créée' },
  [TypeEtapeIntervention.TICKET_RATTACHE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Ticket rattaché' },
  [TypeEtapeIntervention.TECHNICIEN_AFFECTE]: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Technicien affecté' },
  [TypeEtapeIntervention.REATTRIBUEE]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Réattribuée' },
  [TypeEtapeIntervention.PRISE_EN_CHARGE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Prise en charge' },
  [TypeEtapeIntervention.ARRIVEE_SUR_SITE]: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'Arrivée sur site' },
  [TypeEtapeIntervention.ACCES_REFUSE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Accès refusé' },
  [TypeEtapeIntervention.RAPPORT_AJOUTE]: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Rapport ajouté' },
  [TypeEtapeIntervention.ETAT_APPAREIL_CHANGE]: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: "État de l'appareil constaté" },
  [TypeEtapeIntervention.MISE_EN_ATTENTE_PIECE]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Mise en attente de pièce' },
  [TypeEtapeIntervention.REPRISE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Reprise' },
  [TypeEtapeIntervention.RAPPORT_REJETE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rapport rejeté' },
  [TypeEtapeIntervention.TERMINEE]: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Terminée' },
  [TypeEtapeIntervention.VALIDEE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Validée' },
  [TypeEtapeIntervention.CLOTUREE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Clôturée' },
  [TypeEtapeIntervention.COMMENTAIRE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Commentaire' },
};
export function TypeEtapeInterventionBadge({ type }: { type: TypeEtapeIntervention }) {
  return <Pill tone={TYPE_ETAPE_INTERVENTION[type]} />;
}

const SIGNATURE_CLIENT: Record<StatutSignatureClient, Tone> = {
  [StatutSignatureClient.SIGNE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Signé' },
  [StatutSignatureClient.ABSENT]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Absent' },
  [StatutSignatureClient.INDISPONIBLE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Indisponible' },
};
export function StatutSignatureClientBadge({ statut }: { statut: StatutSignatureClient }) {
  return <Pill tone={SIGNATURE_CLIENT[statut]} />;
}

const ETAT_POINT_CONTROLE: Record<EtatPointControle, Tone> = {
  [EtatPointControle.CONFORME]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Conforme' },
  [EtatPointControle.NON_CONFORME]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Non conforme' },
  [EtatPointControle.NON_APPLICABLE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Non applicable' },
  [EtatPointControle.NON_VERIFIE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Non vérifié' },
};
export function EtatPointControleBadge({ etat }: { etat: EtatPointControle }) {
  return <Pill tone={ETAT_POINT_CONTROLE[etat]} />;
}

const CONNEXION_MOBILE: Record<EtatConnexionMobile, Tone> = {
  [EtatConnexionMobile.EN_LIGNE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'En ligne' },
  [EtatConnexionMobile.HORS_LIGNE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Hors ligne' },
  [EtatConnexionMobile.SYNCHRONISATION_EN_COURS]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Synchronisation en cours' },
};
export function EtatConnexionMobileBadge({ etat }: { etat: EtatConnexionMobile }) {
  return <Pill tone={CONNEXION_MOBILE[etat]} />;
}

const PRESENCE_TECHNICIEN: Record<StatutPresenceTechnicien, Tone> = {
  [StatutPresenceTechnicien.EN_LIGNE]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'En ligne' },
  [StatutPresenceTechnicien.EN_PAUSE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En pause' },
  [StatutPresenceTechnicien.HORS_LIGNE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Hors ligne' },
};
export function StatutPresenceTechnicienBadge({ statut }: { statut: StatutPresenceTechnicien }) {
  return <Pill tone={PRESENCE_TECHNICIEN[statut]} />;
}

const SESSION_TECHNICIEN: Record<StatutSessionTechnicien, Tone> = {
  [StatutSessionTechnicien.EN_COURS]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Session en cours' },
  [StatutSessionTechnicien.TERMINEE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Session terminée' },
};
export function StatutSessionTechnicienBadge({ statut }: { statut: StatutSessionTechnicien }) {
  return <Pill tone={SESSION_TECHNICIEN[statut]} />;
}

const ABSENCE: Record<StatutAbsence, Tone> = {
  [StatutAbsence.PLANIFIEE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Planifiée' },
  [StatutAbsence.EN_COURS]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En cours' },
  [StatutAbsence.TERMINEE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Terminée' },
};
export function StatutAbsenceBadge({ statut }: { statut: StatutAbsence }) {
  return <Pill tone={ABSENCE[statut]} />;
}

const TYPE_ABSENCE: Record<TypeAbsence, Tone> = {
  [TypeAbsence.CONGE]: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Congé' },
  [TypeAbsence.MALADIE]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Maladie' },
  [TypeAbsence.FORMATION]: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Formation' },
  [TypeAbsence.AUTRE]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Autre' },
};
export function TypeAbsenceBadge({ type }: { type: TypeAbsence }) {
  return <Pill tone={TYPE_ABSENCE[type]} />;
}
