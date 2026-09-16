'use server';

/**
 * Server Actions du démarrage d'intervention (sections 24/25).
 *
 * - validerAccesRefuse : étape 1 avec "Non" — demarrerIntervention(...,
 *   accesRefuse=true) fait passer l'intervention en EN_COURS (garde métier
 *   de domain/business-logic.ts) sans qu'il y ait de suite normale
 *   (état initial/diagnostic n'ont pas de sens sans accès) ; le rapport
 *   terrain est donc terminé directement ici, avec un contenu minimal
 *   (RefusAcces uniquement), statutSynchronisation EN_ATTENTE puisqu'il
 *   s'agit d'une saisie terrain mobile en attente de remontée.
 * - validerEtatInitial : étape 2 avec "Oui" — demarrerIntervention(...,
 *   accesRefuse=false, etatAppareilInitial) puis redirection vers le
 *   diagnostic progressif (section 26, écran séparé).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  CategoriePhoto,
  MotifNonAcces,
  OrigineAction,
  RattachementRapport,
  StatutAppareil,
  StatutSynchronisation,
  StatutValidationRapport,
  TypeRapport,
} from '@/domain/types';
import { demarrerIntervention } from '@/domain/business-logic';
import {
  addPhotoRapport,
  addRapport,
  getAscenseurById,
  getInterventionById,
  getRapportsByInterventionId,
  updateIntervention,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';

/** Génère un ID unique simple pour la démo (même forme que app/mobile/accueil/actions.ts, non exportée de data/store.ts, gelé). */
function genererId(prefixe: string): string {
  return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function validerAccesRefuse(formData: FormData): Promise<void> {
  const interventionId = String(formData.get('interventionId'));
  const motifSaisi = formData.get('motif');
  const motif: MotifNonAcces =
    typeof motifSaisi === 'string' && (Object.values(MotifNonAcces) as string[]).includes(motifSaisi)
      ? (motifSaisi as MotifNonAcces)
      : MotifNonAcces.AUTRE;
  const commentaireBrut = formData.get('commentaire');
  const commentaire = typeof commentaireBrut === 'string' && commentaireBrut.trim() ? commentaireBrut.trim() : undefined;
  const photoUrls = formData.getAll('photoUrl').filter((v): v is string => typeof v === 'string' && v.length > 0);
  const photoCategories = formData.getAll('photoCategorie').filter((v): v is string => typeof v === 'string');

  const intervention = getInterventionById(interventionId);
  if (!intervention) throw new Error('Intervention introuvable');
  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const technicien = getTechnicienConnecte();

  const { intervention: interventionMaj } = demarrerIntervention(intervention, true, motif);
  updateIntervention(interventionMaj);

  const heureConstat = new Date().toISOString();
  const rapportId = genererId('rap-mob');

  const photoIds = photoUrls.map((url, idx) => {
    const photoId = genererId('photo-mob');
    addPhotoRapport({
      id: photoId,
      rapportId,
      url,
      categorie: (photoCategories[idx] as CategoriePhoto | undefined) ?? CategoriePhoto.AUTRE,
      dateHeure: heureConstat,
      technicienId: technicien.id,
    });
    return photoId;
  });

  const passagesExistants = getRapportsByInterventionId(interventionId).length;

  addRapport({
    id: rapportId,
    numero: `RAP-${new Date().getFullYear()}-${rapportId.slice(-6)}`,
    rattachement: RattachementRapport.INTERVENTION,
    interventionId,
    numeroPassageIntervention: passagesExistants + 1,
    typeRapport: TypeRapport.DEPANNAGE,
    ascenseurId: intervention.ascenseurId,
    adresseAppareil: ascenseur?.adresseComplete ?? '',
    technicienId: technicien.id,
    technicienNom: technicien.nomComplet,
    dateHeureDebut: heureConstat,
    dateHeureFin: heureConstat,
    dureeMinutes: 0,
    accesObtenu: false,
    refusAcces: {
      motif,
      commentaire,
      photoIds: photoIds.length > 0 ? photoIds : undefined,
      heureConstat,
    },
    commentaire: "Aucune intervention réalisée, accès impossible",
    photoIds,
    origineSaisie: OrigineAction.MOBILE,
    statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
    statutValidation: StatutValidationRapport.EN_ATTENTE,
  });

  revalidatePath('/mobile/accueil');
  revalidatePath(`/mobile/interventions/${interventionId}/demarrage`);
  redirect('/mobile/accueil');
}

export async function validerEtatInitial(formData: FormData): Promise<void> {
  const interventionId = String(formData.get('interventionId'));
  const etatSaisi = formData.get('etatInitial');
  const etatInitial =
    typeof etatSaisi === 'string' && (Object.values(StatutAppareil) as string[]).includes(etatSaisi)
      ? (etatSaisi as StatutAppareil)
      : undefined;
  if (!etatInitial) throw new Error("État initial manquant");

  const intervention = getInterventionById(interventionId);
  if (!intervention) throw new Error('Intervention introuvable');

  const { intervention: interventionMaj } = demarrerIntervention(intervention, false, undefined, etatInitial);
  updateIntervention(interventionMaj);

  revalidatePath(`/mobile/interventions/${interventionId}/demarrage`);
  revalidatePath(`/mobile/interventions/${interventionId}/diagnostic`);
  redirect(`/mobile/interventions/${interventionId}/diagnostic`);
}
