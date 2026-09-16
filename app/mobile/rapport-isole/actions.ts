'use server';

/**
 * Création d'un rapport isolé (section 33) : appareil hors tournée, sans
 * intervention ni maintenance préexistante. Rapport minimal — pas d'état
 * initial/diagnostic/état de clôture (ces notions sont propres au parcours
 * intervention, section 24-27) — mais avec le même compte-rendu/photos/
 * signatures que la clôture d'intervention (voir
 * app/mobile/components/FormulaireRapport.tsx).
 */

import { revalidatePath } from 'next/cache';
import {
  CategoriePhoto,
  OrigineAction,
  RattachementRapport,
  SignatureClient,
  SignatureTechnicien,
  StatutSignatureClient,
  StatutSynchronisation,
  StatutValidationRapport,
  TypeRapport,
} from '@/domain/types';
import { addPhotoRapport, addRapport, getAscenseurById } from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';

export interface PhotoSaisieRapportIsole {
  url: string;
  categorie: CategoriePhoto;
  legende?: string;
}

export interface RapportIsoleSaisie {
  typeRapport: TypeRapport;
  motifRapportIsole: string;
  commentaire: string;
  commentaireSaisieVocale: boolean;
  photos: PhotoSaisieRapportIsole[];
  signatureTechnicienSignee: boolean;
  signatureClientStatut: StatutSignatureClient;
  signatureClientNom?: string;
  signatureClientMotif?: string;
}

export interface ResultatRapportIsole {
  success: boolean;
  error?: string;
}

/** Génère un ID unique simple pour la démo (même forme que les autres Server Actions mobile, non exportée de data/store.ts, gelé). */
function genererId(prefixe: string): string {
  return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function creerRapportIsole(ascenseurId: string, saisie: RapportIsoleSaisie): Promise<ResultatRapportIsole> {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return { success: false, error: 'Appareil introuvable.' };
  if (!saisie.motifRapportIsole.trim()) return { success: false, error: 'Le motif du rapport est requis.' };
  if (!saisie.signatureTechnicienSignee) {
    return { success: false, error: 'La signature du technicien est obligatoire pour finaliser le rapport.' };
  }

  const technicien = getTechnicienConnecte();
  const heure = new Date().toISOString();
  const rapportId = genererId('rap-mob');

  const photoIds = saisie.photos.map((photo) => {
    const photoId = genererId('photo-mob');
    addPhotoRapport({
      id: photoId,
      rapportId,
      url: photo.url,
      categorie: photo.categorie,
      legende: photo.legende?.trim() || undefined,
      dateHeure: heure,
      technicienId: technicien.id,
    });
    return photoId;
  });

  const signatureTechnicien: SignatureTechnicien = {
    technicienId: technicien.id,
    dataUrl: 'signature-mock-technicien',
    dateHeure: heure,
  };
  const signatureClient: SignatureClient = {
    statut: saisie.signatureClientStatut,
    nomSignataire:
      saisie.signatureClientStatut === StatutSignatureClient.SIGNE ? saisie.signatureClientNom?.trim() || 'Signataire non précisé' : undefined,
    dataUrl: saisie.signatureClientStatut === StatutSignatureClient.SIGNE ? 'signature-mock-client' : undefined,
    motifAbsenceOuIndisponibilite:
      saisie.signatureClientStatut !== StatutSignatureClient.SIGNE ? saisie.signatureClientMotif?.trim() || undefined : undefined,
    dateHeure: heure,
  };

  addRapport({
    id: rapportId,
    numero: `RAP-${new Date().getFullYear()}-${rapportId.slice(-6)}`,
    rattachement: RattachementRapport.ISOLE,
    motifRapportIsole: saisie.motifRapportIsole.trim(),
    typeRapport: saisie.typeRapport,
    ascenseurId,
    adresseAppareil: ascenseur.adresseComplete,
    technicienId: technicien.id,
    technicienNom: technicien.nomComplet,
    dateHeureDebut: heure,
    dateHeureFin: heure,
    accesObtenu: true,
    commentaire: saisie.commentaire.trim() || undefined,
    commentaireSaisieVocale: saisie.commentaireSaisieVocale,
    photoIds,
    signatureTechnicien,
    signatureClient,
    origineSaisie: OrigineAction.MOBILE,
    statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
    statutValidation: StatutValidationRapport.EN_ATTENTE,
  });

  revalidatePath('/mobile/accueil');

  return { success: true };
}
