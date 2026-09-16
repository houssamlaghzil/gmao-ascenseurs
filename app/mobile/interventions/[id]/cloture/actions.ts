'use server';

/**
 * Validation de la clôture d'intervention (section 27-30). Complète le
 * Rapport BROUILLON créé à l'étape diagnostic (voir ../diagnostic/actions.ts)
 * s'il existe, sinon en crée un complet (cas d'un accès direct par lien
 * profond, sans être passé par le diagnostic). Appelle
 * domain/business-logic.terminerIntervention pour faire progresser
 * l'intervention (EN_COURS → TERMINE), puis fige le Rapport avec toutes les
 * saisies de l'écran (état de clôture, compte-rendu, photos, signatures) en
 * statutSynchronisation EN_ATTENTE (section 35).
 *
 * Ne redirige PAS elle-même : le composant client affiche d'abord l'état de
 * confirmation (section 44, "Rapport enregistré" / "Enregistré sur
 * l'appareil — en attente de synchronisation") avant de renvoyer vers
 * l'accueil.
 *
 * Écart pris de ma propre initiative : le cahier des charges (section 27)
 * liste "Pas d'accès" parmi les choix de clôture, alors que StatutAppareil
 * (domain/types.ts, figé, non modifiable) n'a pas de valeur dédiée — un
 * accès a nécessairement déjà été obtenu pour atteindre cet écran (statut
 * EN_COURS sans accesRefuse, sinon voir ../demarrage/actions.ts). Ce choix
 * est donc modélisé comme "l'accès a été reperdu avant d'avoir pu conclure
 * normalement" : etatCloture retombe sur l'état initial constaté à l'arrivée
 * (ou À l'arrêt à défaut), et le motif/la précision saisis sont versés dans
 * commentaireCloture — jamais dans Rapport.refusAcces, qui reste réservé au
 * cas où l'accès initial (section 24) a été refusé.
 */

import { revalidatePath } from 'next/cache';
import {
  CategoriePhoto,
  MotifNonAcces,
  OrigineAction,
  Rapport,
  RattachementRapport,
  SignatureClient,
  SignatureTechnicien,
  StatutAppareil,
  StatutIntervention,
  StatutSignatureClient,
  StatutSynchronisation,
  StatutValidationRapport,
  TypeRapport,
} from '@/domain/types';
import { terminerIntervention } from '@/domain/business-logic';
import {
  addPhotoRapport,
  addRapport,
  getAscenseurById,
  getInterventionById,
  getRapportsByInterventionId,
  updateIntervention,
  updateRapport,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import { LIBELLE_MOTIF_NON_ACCES } from '@/lib/derived/libelles-rapports';
import { PAS_ACCES } from './constants';

export interface PhotoSaisieCloture {
  url: string;
  categorie: CategoriePhoto;
  legende?: string;
}

export interface ClotureSaisie {
  etatSelectionne: StatutAppareil | typeof PAS_ACCES;
  etagesModeDegrade?: string[];
  motifPasAcces?: MotifNonAcces;
  commentaireCloture?: string;
  commentaire: string;
  commentaireSaisieVocale: boolean;
  photos: PhotoSaisieCloture[];
  signatureTechnicienSignee: boolean;
  signatureClientStatut: StatutSignatureClient;
  signatureClientNom?: string;
  signatureClientMotif?: string;
}

export interface ResultatCloture {
  success: boolean;
  error?: string;
}

/** Génère un ID unique simple pour la démo (même forme que les autres Server Actions mobile, non exportée de data/store.ts, gelé). */
function genererId(prefixe: string): string {
  return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function validerCloture(interventionId: string, saisie: ClotureSaisie): Promise<ResultatCloture> {
  const intervention = getInterventionById(interventionId);
  if (!intervention) return { success: false, error: 'Intervention introuvable.' };
  if (intervention.statut !== StatutIntervention.EN_COURS || intervention.accesRefuse) {
    return { success: false, error: "Cette intervention n'est pas en état d'être clôturée." };
  }
  if (!saisie.signatureTechnicienSignee) {
    return { success: false, error: 'La signature du technicien est obligatoire pour finaliser le rapport.' };
  }
  if (saisie.etatSelectionne === StatutAppareil.MODE_DEGRADE && (!saisie.etagesModeDegrade || saisie.etagesModeDegrade.length === 0)) {
    return { success: false, error: 'Précisez au moins un étage concerné par le mode dégradé.' };
  }

  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const technicien = getTechnicienConnecte();
  const heureFin = new Date().toISOString();

  let etatCloture: StatutAppareil;
  let etagesModeDegrade: string[] | undefined;
  let commentaireCloture: string | undefined;

  if (saisie.etatSelectionne === PAS_ACCES) {
    etatCloture = intervention.etatAppareilInitial ?? StatutAppareil.A_L_ARRET;
    const motifLibelle = saisie.motifPasAcces ? LIBELLE_MOTIF_NON_ACCES[saisie.motifPasAcces] : 'motif non précisé';
    commentaireCloture = `Accès perdu avant d'avoir pu conclure l'intervention (${motifLibelle})${saisie.commentaireCloture ? ' — ' + saisie.commentaireCloture : ''}`;
  } else {
    etatCloture = saisie.etatSelectionne;
    etagesModeDegrade = etatCloture === StatutAppareil.MODE_DEGRADE ? saisie.etagesModeDegrade : undefined;
    commentaireCloture = saisie.commentaireCloture?.trim() || undefined;
  }

  const rapportsExistants = getRapportsByInterventionId(interventionId);
  const brouillon = rapportsExistants.find((r) => r.statutSynchronisation === StatutSynchronisation.BROUILLON);
  const rapportId = brouillon?.id ?? genererId('rap-mob');
  const dateDebutRapport = brouillon?.dateHeureDebut ?? intervention.dateArriveeSite ?? intervention.dateCreation;
  const dureeMinutes = Math.max(1, Math.round((new Date(heureFin).getTime() - new Date(dateDebutRapport).getTime()) / 60_000));

  const { intervention: interventionMaj } = terminerIntervention(intervention, rapportId, etatCloture, dureeMinutes);
  updateIntervention(interventionMaj);

  const photoIds = saisie.photos.map((photo) => {
    const photoId = genererId('photo-mob');
    addPhotoRapport({
      id: photoId,
      rapportId,
      url: photo.url,
      categorie: photo.categorie,
      legende: photo.legende?.trim() || undefined,
      dateHeure: heureFin,
      technicienId: technicien.id,
    });
    return photoId;
  });

  const signatureTechnicien: SignatureTechnicien = {
    technicienId: technicien.id,
    dataUrl: 'signature-mock-technicien',
    dateHeure: heureFin,
  };
  const signatureClient: SignatureClient = {
    statut: saisie.signatureClientStatut,
    nomSignataire:
      saisie.signatureClientStatut === StatutSignatureClient.SIGNE ? saisie.signatureClientNom?.trim() || 'Signataire non précisé' : undefined,
    dataUrl: saisie.signatureClientStatut === StatutSignatureClient.SIGNE ? 'signature-mock-client' : undefined,
    motifAbsenceOuIndisponibilite:
      saisie.signatureClientStatut !== StatutSignatureClient.SIGNE ? saisie.signatureClientMotif?.trim() || undefined : undefined,
    dateHeure: heureFin,
  };

  if (brouillon) {
    const rapportMaj: Rapport = {
      ...brouillon,
      dateHeureFin: heureFin,
      dureeMinutes,
      etatCloture,
      etagesModeDegrade,
      commentaireCloture,
      commentaire: saisie.commentaire.trim() || undefined,
      commentaireSaisieVocale: saisie.commentaireSaisieVocale,
      photoIds: [...brouillon.photoIds, ...photoIds],
      signatureTechnicien,
      signatureClient,
      statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
    };
    updateRapport(rapportMaj);
  } else {
    addRapport({
      id: rapportId,
      numero: `RAP-${new Date().getFullYear()}-${rapportId.slice(-6)}`,
      rattachement: RattachementRapport.INTERVENTION,
      interventionId,
      numeroPassageIntervention: rapportsExistants.length + 1,
      typeRapport: TypeRapport.DEPANNAGE,
      ascenseurId: intervention.ascenseurId,
      adresseAppareil: ascenseur?.adresseComplete ?? '',
      technicienId: technicien.id,
      technicienNom: technicien.nomComplet,
      dateHeureDebut: dateDebutRapport,
      dateHeureFin: heureFin,
      dureeMinutes,
      accesObtenu: true,
      etatInitial: intervention.etatAppareilInitial,
      etatCloture,
      etagesModeDegrade,
      commentaireCloture,
      commentaire: saisie.commentaire.trim() || undefined,
      commentaireSaisieVocale: saisie.commentaireSaisieVocale,
      photoIds,
      signatureTechnicien,
      signatureClient,
      origineSaisie: OrigineAction.MOBILE,
      statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
      statutValidation: StatutValidationRapport.EN_ATTENTE,
    });
  }

  revalidatePath('/mobile/accueil');
  revalidatePath(`/mobile/interventions/${interventionId}/cloture`);

  return { success: true };
}
