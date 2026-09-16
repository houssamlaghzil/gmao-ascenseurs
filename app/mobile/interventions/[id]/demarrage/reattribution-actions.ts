'use server';

/**
 * Réaffectation mobile (section 34, "Je ne peux pas traiter cette
 * intervention") — même logique métier que le bouton Web "Réattribuer"
 * (voir app/interventions/actions.ts, reaffecterInterventionAction), seule
 * l'origine et le demandeur diffèrent : ici la demande émane du technicien
 * lui-même, depuis le mobile. Partagé entre app/mobile/interventions/[id]/
 * demarrage et .../diagnostic (import relatif depuis diagnostic/), qui sont
 * les deux seules routes de ce parcours à exposer le bouton.
 */

import { revalidatePath } from 'next/cache';
import { MotifReattribution, OrigineAction } from '@/domain/types';
import { reaffecter } from '@/domain/business-logic';
import { addReaffectation, getInterventionById, getTechnicienById, updateIntervention } from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';

export interface ReattributionMobileResult {
  success: boolean;
  error?: string;
}

/**
 * NOTE hors ligne (sections 34/35) : si le technicien était hors ligne au
 * moment de la demande, celle-ci resterait dans la file de synchronisation
 * mobile (ElementFileSynchronisation, type REATTRIBUTION_INTERVENTION —
 * exactement le scénario déjà curé pour tech-006 dans data/mockData.ts, où
 * `elementFileSynchronisationId` relie la Reaffectation à son élément de
 * file) avant transmission réelle au serveur. Cette maquette n'ayant qu'un
 * seul store en mémoire (pas de distinction client/serveur), ce délai n'est
 * pas simulé ici : voir l'écran /mobile/synchronisation (autre agent) pour
 * la représentation de cette file d'attente.
 */
export async function reaffecterInterventionMobile(
  interventionId: string,
  nouveauTechnicienId: string,
  motif: MotifReattribution,
  commentaire: string
): Promise<ReattributionMobileResult> {
  const intervention = getInterventionById(interventionId);
  if (!intervention) {
    return { success: false, error: 'Intervention introuvable.' };
  }
  if (!nouveauTechnicienId) {
    return { success: false, error: 'Sélectionnez un collègue.' };
  }
  const nouveauTechnicien = getTechnicienById(nouveauTechnicienId);
  if (!nouveauTechnicien) {
    return { success: false, error: 'Technicien introuvable.' };
  }

  const demandeur = getTechnicienConnecte();

  try {
    const { intervention: interventionMaj, reaffectation } = reaffecter(
      intervention,
      nouveauTechnicienId,
      motif,
      OrigineAction.MOBILE,
      commentaire.trim() || undefined,
      demandeur.nomComplet
    );

    updateIntervention(interventionMaj);
    addReaffectation(reaffectation);

    revalidatePath('/mobile/accueil');
    revalidatePath(`/mobile/interventions/${interventionId}/demarrage`);
    revalidatePath(`/mobile/interventions/${interventionId}/diagnostic`);

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inattendue.' };
  }
}
