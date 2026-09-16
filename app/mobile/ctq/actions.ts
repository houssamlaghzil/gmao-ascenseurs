'use server';

/**
 * Server Actions du parcours CTQ mobile (section 32) — chaque bouton avance
 * le statut d'une ReserveCTQ d'un cran via domain/business-logic.ts
 * (demarrerTraitementReserve / declarerReserveTraitee /
 * soumettreReservePourControle), jamais en écrivant le statut à la main.
 *
 * `declarerTraitee` appelle la garde métier (au moins une photo "après
 * traitement") AVANT toute écriture dans le store : en cas de rejet, aucun
 * Rapport ni PhotoRapport orphelin n'est créé, et le message d'erreur réel de
 * declarerReserveTraitee est renvoyé tel quel au client pour affichage.
 *
 * PhotoRapport.rapportId est un champ obligatoire du modèle : les photos de
 * traitement d'une réserve CTQ mobile (sans Intervention/Maintenance de
 * rattachement dans ce parcours) sont donc portées par un petit Rapport
 * ISOLE dédié, créé ici. ReserveCTQ.traitement (ReferenceTraitement) ne
 * distingue que INTERVENTION/MAINTENANCE (modèle gelé) : on retient
 * MAINTENANCE par convention pour ce cas mobile, l'id pointant vers ce
 * Rapport — le web (app/ctq/[id]) affiche alors son id brut en repli
 * (`getMaintenanceById(id) ?? id`), sans erreur.
 */

import { revalidatePath } from 'next/cache';
import {
  CategoriePhoto,
  OrigineAction,
  RattachementRapport,
  StatutSynchronisation,
  StatutValidationRapport,
  TypeRapport,
  TypeTraitementReserve,
} from '@/domain/types';
import { declarerReserveTraitee, demarrerTraitementReserve, soumettreReservePourControle } from '@/domain/business-logic';
import {
  addEvenementReserve,
  addPhotoRapport,
  addRapport,
  getAscenseurById,
  getReserveCTQById,
  updateReserveCTQ,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';

function genererId(prefixe: string): string {
  return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function demarrerTraitement(formData: FormData): Promise<void> {
  const reserveId = String(formData.get('reserveId'));
  const reserve = getReserveCTQById(reserveId);
  if (!reserve) return;

  const { reserve: reserveMaj, evenement } = demarrerTraitementReserve(reserve);
  updateReserveCTQ(reserveMaj);
  addEvenementReserve({ ...evenement, origine: OrigineAction.MOBILE });
  revalidatePath('/mobile/ctq');
}

export async function soumettrePourControle(formData: FormData): Promise<void> {
  const reserveId = String(formData.get('reserveId'));
  const reserve = getReserveCTQById(reserveId);
  if (!reserve) return;

  const { reserve: reserveMaj, evenement } = soumettreReservePourControle(reserve);
  updateReserveCTQ(reserveMaj);
  addEvenementReserve({ ...evenement, origine: OrigineAction.MOBILE });
  revalidatePath('/mobile/ctq');
}

export interface ResultatDeclarerTraitee {
  success: boolean;
  error?: string;
}

export async function declarerTraitee(reserveId: string, photoUrls: string[], commentaire?: string): Promise<ResultatDeclarerTraitee> {
  const reserve = getReserveCTQById(reserveId);
  if (!reserve) return { success: false, error: 'Réserve introuvable.' };

  const rapportId = genererId('rap-ctq');
  const photoIds = photoUrls.map(() => genererId('photo-ctq'));
  const commentaireTechnicien = commentaire?.trim() || undefined;

  let resultat: ReturnType<typeof declarerReserveTraitee>;
  try {
    resultat = declarerReserveTraitee(reserve, { type: TypeTraitementReserve.MAINTENANCE, id: rapportId }, photoIds, commentaireTechnicien);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue.' };
  }

  const technicien = getTechnicienConnecte();
  const ascenseur = getAscenseurById(reserve.appareilId);
  const maintenant = new Date().toISOString();

  photoUrls.forEach((url, idx) => {
    addPhotoRapport({
      id: photoIds[idx],
      rapportId,
      url,
      categorie: CategoriePhoto.RESERVE_CTQ,
      dateHeure: maintenant,
      technicienId: technicien.id,
      reserveCtqId: reserve.id,
    });
  });

  addRapport({
    id: rapportId,
    numero: `RAP-${new Date().getFullYear()}-${rapportId.slice(-6)}`,
    rattachement: RattachementRapport.ISOLE,
    motifRapportIsole: `Traitement réserve CTQ ${reserve.numero}`,
    typeRapport: TypeRapport.DIVERS,
    ascenseurId: reserve.appareilId,
    adresseAppareil: ascenseur?.adresseComplete ?? '',
    technicienId: technicien.id,
    technicienNom: technicien.nomComplet,
    dateHeureDebut: maintenant,
    dateHeureFin: maintenant,
    dureeMinutes: 0,
    accesObtenu: true,
    commentaire: commentaireTechnicien,
    photoIds,
    origineSaisie: OrigineAction.MOBILE,
    statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
    statutValidation: StatutValidationRapport.EN_ATTENTE,
  });

  updateReserveCTQ(resultat.reserve);
  addEvenementReserve({ ...resultat.evenement, origine: OrigineAction.MOBILE });
  revalidatePath('/mobile/ctq');
  return { success: true };
}
